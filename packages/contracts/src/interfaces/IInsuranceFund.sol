// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IInsuranceFund {
    struct StakerInfo {
        uint256 stakedAmount;
        uint256 unstakeRequestTime;
        uint256 unstakeRequestAmount;
        uint256 rewardDebt; // MasterChef-style: stakedAmount * accRewardPerToken at last update
        uint256 pendingRewards; // Accumulated claimable rewards
    }

    event Staked(address indexed staker, uint256 amount);
    event UnstakeRequested(address indexed staker, uint256 amount, uint256 availableAt);
    event Unstaked(address indexed staker, uint256 amount);
    event LossCovered(uint256 amount, uint256 fundSizeAfter);
    event FeesDistributed(uint256 totalFees, uint256 stakerCount);
    event FeesReceived(uint256 amount);
    event RecapitalizationTriggered(uint256 amount, uint256 fundSizeAfter);
    event CooldownUpdated(uint256 oldCooldown, uint256 newCooldown);
    event ThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    function stake(uint256 amount) external;
    function requestUnstake(uint256 amount) external;
    function unstake() external;
    function coverLoss(uint256 amount) external;
    function distributeFees() external;
    function fundHealth() external view returns (uint256 fundSize, uint256 outstandingRisk);
    function getStakerInfo(address staker) external view returns (StakerInfo memory);
    function totalStaked() external view returns (uint256);
    function pendingFees() external view returns (uint256);
    function setCooldownPeriod(uint256 period) external;
    function setRecapThreshold(uint256 threshold) external;
}
