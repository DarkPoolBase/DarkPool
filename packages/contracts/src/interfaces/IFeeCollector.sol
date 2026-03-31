// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IFeeCollector {
    struct FeeDistribution {
        uint256 treasuryBps;
        uint256 stakerBps;
        uint256 burnBps;
    }

    event FeeReceived(bytes32 indexed batchId, uint256 amount);
    event FeesDistributed(uint256 treasury, uint256 stakers, uint256 burned);
    event FeeRateUpdated(uint256 oldRate, uint256 newRate);
    event DistributionUpdated(uint256 treasuryBps, uint256 stakerBps, uint256 burnBps);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event StakerVaultUpdated(address oldVault, address newVault);
    event BurnAddressUpdated(address oldBurn, address newBurn);

    function notifyFee(bytes32 batchId, uint256 amount) external;
    function distributeFees() external;
    function setFeeRate(uint256 bps) external;
    function setDistribution(uint256 treasuryBps, uint256 stakerBps, uint256 burnBps) external;
    function totalCollected() external view returns (uint256);
    function pendingDistribution() external view returns (uint256);
    function feeRate() external view returns (uint256);
}

