// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IInsuranceFund.sol";

/// @title InsuranceFund - Backstop for derivatives positions
/// @notice Absorbs losses from liquidations. Stakers earn fees in exchange for underwriting risk.
///         Auto-recapitalizes from protocol fees when fund drops below threshold.
contract InsuranceFund is IInsuranceFund, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant LIQUIDATION_ROLE = keccak256("LIQUIDATION_ROLE");
    bytes32 public constant FEE_DISTRIBUTOR_ROLE = keccak256("FEE_DISTRIBUTOR_ROLE");

    IERC20 public immutable usdc;

    /// @notice 7-day default cooldown for unstaking
    uint256 public cooldownPeriod;

    /// @notice Fund size threshold (in USDC) below which auto-recapitalization triggers
    uint256 public recapThreshold;

    /// @notice Outstanding risk exposure tracked by the liquidation engine
    uint256 public outstandingRisk;

    /// @notice Accumulated fees pending distribution
    uint256 private _pendingFees;

    /// @notice Total tokens staked across all stakers
    uint256 private _totalStaked;

    /// @notice Accumulated reward per staked token (scaled by 1e18)
    uint256 private _accRewardPerToken;

    /// @notice Individual staker info
    mapping(address => StakerInfo) private _stakers;

    /// @notice Total number of unique stakers (for event reporting)
    uint256 public stakerCount;

    constructor(address _usdc) {
        require(_usdc != address(0), "InsuranceFund: zero USDC");

        usdc = IERC20(_usdc);
        cooldownPeriod = 7 days;
        recapThreshold = 100_000e6; // 100k USDC default threshold

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Stake USDC into the insurance fund
    /// @param amount Amount of USDC to stake (6 decimals)
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "InsuranceFund: zero amount");

        _updateRewards(msg.sender);

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        StakerInfo storage info = _stakers[msg.sender];
        if (info.stakedAmount == 0) {
            stakerCount++;
        }
        info.stakedAmount += amount;
        _totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    /// @notice Request to unstake tokens (begins cooldown)
    /// @param amount Amount to unstake
    function requestUnstake(uint256 amount) external {
        StakerInfo storage info = _stakers[msg.sender];
        require(amount > 0, "InsuranceFund: zero amount");
        require(info.stakedAmount >= amount, "InsuranceFund: insufficient stake");

        info.unstakeRequestTime = block.timestamp;
        info.unstakeRequestAmount = amount;

        uint256 availableAt = block.timestamp + cooldownPeriod;
        emit UnstakeRequested(msg.sender, amount, availableAt);
    }

    /// @notice Complete unstaking after cooldown period
    function unstake() external nonReentrant {
        StakerInfo storage info = _stakers[msg.sender];
        require(info.unstakeRequestAmount > 0, "InsuranceFund: no pending unstake");
        require(
            block.timestamp >= info.unstakeRequestTime + cooldownPeriod,
            "InsuranceFund: cooldown not elapsed"
        );

        _updateRewards(msg.sender);

        uint256 amount = info.unstakeRequestAmount;
        info.stakedAmount -= amount;
        info.unstakeRequestTime = 0;
        info.unstakeRequestAmount = 0;
        _totalStaked -= amount;

        if (info.stakedAmount == 0) {
            stakerCount--;
        }

        usdc.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    /// @notice Cover a loss from a liquidation event
    /// @param amount Amount of USDC to absorb
    function coverLoss(uint256 amount) external onlyRole(LIQUIDATION_ROLE) nonReentrant {
        require(amount > 0, "InsuranceFund: zero amount");

        uint256 fundBalance = usdc.balanceOf(address(this));
        require(fundBalance >= amount, "InsuranceFund: insufficient funds");

        // Transfer loss coverage to the liquidation engine (msg.sender)
        usdc.safeTransfer(msg.sender, amount);

        uint256 fundSizeAfter = usdc.balanceOf(address(this));
        emit LossCovered(amount, fundSizeAfter);

        // Check if recapitalization is needed
        if (fundSizeAfter < recapThreshold) {
            emit RecapitalizationTriggered(0, fundSizeAfter);
        }
    }

    /// @notice Receive liquidation fees for distribution to stakers
    /// @dev Caller must have approved this contract for the fee amount
    function receiveFees(uint256 amount) external {
        require(amount > 0, "InsuranceFund: zero fees");
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        _pendingFees += amount;
        emit FeesReceived(amount);
    }

    /// @notice Distribute accumulated fees to all stakers proportionally
    function distributeFees() external onlyRole(FEE_DISTRIBUTOR_ROLE) {
        require(_pendingFees > 0, "InsuranceFund: no pending fees");
        require(_totalStaked > 0, "InsuranceFund: no stakers");

        uint256 fees = _pendingFees;
        _pendingFees = 0;

        // Increase reward per token
        _accRewardPerToken += (fees * 1e18) / _totalStaked;

        emit FeesDistributed(fees, stakerCount);
    }

    /// @notice Claim accumulated staking rewards
    function claimRewards() external nonReentrant {
        _updateRewards(msg.sender);

        StakerInfo storage info = _stakers[msg.sender];
        uint256 rewards = info.pendingRewards;
        require(rewards > 0, "InsuranceFund: no rewards");

        info.pendingRewards = 0;
        usdc.safeTransfer(msg.sender, rewards);
    }

    /// @notice Update outstanding risk exposure
    /// @param risk New total outstanding risk
    function updateOutstandingRisk(uint256 risk) external onlyRole(LIQUIDATION_ROLE) {
        outstandingRisk = risk;
    }

    /// @notice Get fund health metrics
    /// @return fundSize Current fund balance
    /// @return _outstandingRisk Total outstanding risk exposure
    function fundHealth()
        external
        view
        returns (uint256 fundSize, uint256 _outstandingRisk)
    {
        return (usdc.balanceOf(address(this)), outstandingRisk);
    }

    /// @notice Get staker info (includes pending unclaimed rewards)
    function getStakerInfo(
        address staker
    ) external view returns (StakerInfo memory) {
        StakerInfo memory info = _stakers[staker];
        if (info.stakedAmount > 0) {
            uint256 accReward = (info.stakedAmount * _accRewardPerToken) / 1e18;
            if (accReward > info.rewardDebt) {
                info.pendingRewards += accReward - info.rewardDebt;
            }
        }
        return info;
    }

    /// @notice Total USDC staked
    function totalStaked() external view returns (uint256) {
        return _totalStaked;
    }

    /// @notice Accumulated fees not yet distributed
    function pendingFees() external view returns (uint256) {
        return _pendingFees;
    }

    /// @notice Update the unstaking cooldown period
    function setCooldownPeriod(
        uint256 period
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(period >= 1 days && period <= 30 days, "InsuranceFund: invalid cooldown");
        uint256 old = cooldownPeriod;
        cooldownPeriod = period;
        emit CooldownUpdated(old, period);
    }

    /// @notice Update the auto-recapitalization threshold
    function setRecapThreshold(
        uint256 threshold
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 old = recapThreshold;
        recapThreshold = threshold;
        emit ThresholdUpdated(old, threshold);
    }

    /// @notice Internal: update reward accounting for a staker (MasterChef pattern)
    function _updateRewards(address staker) internal {
        StakerInfo storage info = _stakers[staker];
        if (info.stakedAmount > 0) {
            uint256 accReward = (info.stakedAmount * _accRewardPerToken) / 1e18;
            if (accReward > info.rewardDebt) {
                info.pendingRewards += accReward - info.rewardDebt;
            }
        }
        info.rewardDebt = (info.stakedAmount * _accRewardPerToken) / 1e18;
    }
}
