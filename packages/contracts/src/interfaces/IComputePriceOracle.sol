// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IComputePriceOracle {
    struct PriceObservation {
        uint256 price; // clearing price in USDC (6 decimals) per GPU-hour
        uint256 timestamp;
        bytes32 batchId;
        uint256 volume; // total GPU-hours in this batch
    }

    event PriceRecorded(
        bytes32 indexed batchId,
        uint256 price,
        uint256 volume,
        uint256 timestamp
    );
    event PriceRejected(bytes32 indexed batchId, uint256 price, string reason);
    event TwapUpdated(uint256 twap, uint256 windowStart, uint256 windowEnd);
    event OutlierThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event MinObservationsUpdated(uint256 oldMin, uint256 newMin);

    function recordPrice(bytes32 batchId, uint256 price, uint256 volume) external;
    function getTwap(uint256 windowSeconds) external view returns (uint256);
    function getLatestPrice() external view returns (uint256 price, uint256 timestamp);
    function getObservation(uint256 index) external view returns (PriceObservation memory);
    function getObservationCount() external view returns (uint256);
    function getPriceHistory(uint256 startIndex, uint256 count)
        external
        view
        returns (PriceObservation[] memory);
    function setOutlierThresholdBps(uint256 bps) external;
    function setMinObservations(uint256 min) external;
}
