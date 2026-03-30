// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IFeeCollector.sol";

/// @title FeeCollector - Collects and distributes protocol fees
/// @notice Receives USDC fees from Escrow on settlement. Distributes to treasury, stakers, and burn.
contract FeeCollector is IFeeCollector, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant DARKPOOL_ROLE = keccak256("DARKPOOL_ROLE");

    IERC20 public immutable usdc;

    address public treasury;
    address public stakerVault;
    address public burnAddress;

    /// @notice Fee rate in basis points (default 20 = 0.2%)
    uint256 private _feeRate;

    /// @notice Distribution split in basis points (must sum to 10000)
    uint256 public treasuryBps;
    uint256 public stakerBps;
    uint256 public burnBps;

    uint256 private _totalCollected;
    uint256 private _totalDistributed;

    constructor(
        address _usdc,
        address _treasury,
        address _stakerVault,
        address _burnAddress
    ) {
        require(_usdc != address(0), "FeeCollector: zero USDC");
        require(_treasury != address(0), "FeeCollector: zero treasury");
        require(_stakerVault != address(0), "FeeCollector: zero staker vault");
        require(_burnAddress != address(0), "FeeCollector: zero burn address");

        usdc = IERC20(_usdc);
        treasury = _treasury;
        stakerVault = _stakerVault;
        burnAddress = _burnAddress;

        _feeRate = 20; // 0.2% default

        // Default distribution: 50% treasury, 40% stakers, 10% burn
        treasuryBps = 5000;
        stakerBps = 4000;
        burnBps = 1000;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Notify the collector that a fee was received from a batch settlement
    /// @dev Called by the settlement flow. The USDC is already transferred to this contract by Escrow.
    function notifyFee(bytes32 batchId, uint256 amount) external onlyRole(DARKPOOL_ROLE) {
        require(amount > 0, "FeeCollector: zero amount");
        _totalCollected += amount;
        emit FeeReceived(batchId, amount);
    }

    /// @notice Distribute accumulated fees to treasury, stakers, and burn address
    function distributeFees() external nonReentrant {
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "FeeCollector: nothing to distribute");

        uint256 toTreasury = (balance * treasuryBps) / 10000;
        uint256 toStakers = (balance * stakerBps) / 10000;
        uint256 toBurn = balance - toTreasury - toStakers; // remainder to burn to avoid dust

        if (toTreasury > 0) {
            usdc.safeTransfer(treasury, toTreasury);
        }
        if (toStakers > 0) {
            usdc.safeTransfer(stakerVault, toStakers);
        }
        if (toBurn > 0) {
            usdc.safeTransfer(burnAddress, toBurn);
        }

        _totalDistributed += balance;
        emit FeesDistributed(toTreasury, toStakers, toBurn);
    }

    /// @notice Set fee rate in basis points (admin only)
    function setFeeRate(uint256 bps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bps <= 500, "FeeCollector: fee rate too high"); // max 5%
        uint256 oldRate = _feeRate;
        _feeRate = bps;
        emit FeeRateUpdated(oldRate, bps);
    }

    /// @notice Set fee distribution split (admin only)
    /// @param _treasuryBps Basis points to treasury
    /// @param _stakerBps Basis points to stakers
    /// @param _burnBps Basis points to burn
    function setDistribution(
        uint256 _treasuryBps,
        uint256 _stakerBps,
        uint256 _burnBps
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            _treasuryBps + _stakerBps + _burnBps == 10000,
            "FeeCollector: distribution must sum to 10000"
        );
        treasuryBps = _treasuryBps;
        stakerBps = _stakerBps;
        burnBps = _burnBps;
        emit DistributionUpdated(_treasuryBps, _stakerBps, _burnBps);
    }

    /// @notice Update treasury address
    function setTreasury(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_treasury != address(0), "FeeCollector: zero address");
        address old = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(old, _treasury);
    }

    /// @notice Update staker vault address
    function setStakerVault(address _stakerVault) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_stakerVault != address(0), "FeeCollector: zero address");
        address old = stakerVault;
        stakerVault = _stakerVault;
        emit StakerVaultUpdated(old, _stakerVault);
    }

    /// @notice Update burn address
    function setBurnAddress(address _burnAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_burnAddress != address(0), "FeeCollector: zero address");
        address old = burnAddress;
        burnAddress = _burnAddress;
        emit BurnAddressUpdated(old, _burnAddress);
    }

    function totalCollected() external view returns (uint256) {
        return _totalCollected;
    }

    function pendingDistribution() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    function feeRate() external view returns (uint256) {
        return _feeRate;
    }

    function totalDistributed() external view returns (uint256) {
        return _totalDistributed;
    }
}
