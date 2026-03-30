// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IComputePriceOracle.sol";

/// @title ComputePriceOracle - Decentralized GPU compute price oracle
/// @notice Aggregates batch auction clearing prices into a manipulation-resistant TWAP index.
///         Feeds perpetual funding rates, option premiums, and forward curves.
contract ComputePriceOracle is IComputePriceOracle, AccessControl {
    bytes32 public constant REPORTER_ROLE = keccak256("REPORTER_ROLE");

    /// @notice All price observations in chronological order
    PriceObservation[] private _observations;

    /// @notice Tracks which batch IDs have already been recorded
    mapping(bytes32 => bool) public batchRecorded;

    /// @notice Outlier rejection threshold in basis points from the moving average.
    ///         e.g., 5000 = reject prices deviating >50% from recent average.
    uint256 public outlierThresholdBps;

    /// @notice Minimum observations before outlier rejection activates
    uint256 public minObservationsForOutlier;

    /// @notice Default TWAP window (10 minutes)
    uint256 public constant DEFAULT_TWAP_WINDOW = 10 minutes;

    /// @notice Maximum observations returned in a single history query
    uint256 public constant MAX_HISTORY_QUERY = 500;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        outlierThresholdBps = 5000; // 50% deviation threshold
        minObservationsForOutlier = 5;
    }

    /// @notice Record a clearing price from a batch settlement
    /// @param batchId Unique batch identifier
    /// @param price Clearing price in USDC (6 decimals) per GPU-hour
    /// @param volume Total GPU-hours settled in this batch
    function recordPrice(
        bytes32 batchId,
        uint256 price,
        uint256 volume
    ) external onlyRole(REPORTER_ROLE) {
        require(price > 0, "Oracle: zero price");
        require(volume > 0, "Oracle: zero volume");
        require(!batchRecorded[batchId], "Oracle: batch already recorded");

        // Outlier rejection once we have enough observations
        if (_observations.length >= minObservationsForOutlier) {
            uint256 recentAvg = _recentVwap(6);
            uint256 deviation = price > recentAvg
                ? price - recentAvg
                : recentAvg - price;
            uint256 maxDeviation = (recentAvg * outlierThresholdBps) / 10000;

            if (deviation > maxDeviation) {
                emit PriceRejected(batchId, price, "outlier");
                return;
            }
        }

        batchRecorded[batchId] = true;

        _observations.push(
            PriceObservation({
                price: price,
                timestamp: block.timestamp,
                batchId: batchId,
                volume: volume
            })
        );

        emit PriceRecorded(batchId, price, volume, block.timestamp);
    }

    /// @notice Get the volume-weighted average price over a time window
    /// @param windowSeconds Lookback window in seconds (0 = use default 10min)
    /// @return twap Volume-weighted average price in USDC (6 decimals)
    function getTwap(uint256 windowSeconds) external view returns (uint256) {
        require(_observations.length > 0, "Oracle: no observations");

        uint256 window = windowSeconds == 0 ? DEFAULT_TWAP_WINDOW : windowSeconds;
        uint256 cutoff = block.timestamp > window
            ? block.timestamp - window
            : 0;

        uint256 weightedSum;
        uint256 totalVolume;

        for (uint256 i = _observations.length; i > 0; i--) {
            PriceObservation storage obs = _observations[i - 1];
            if (obs.timestamp < cutoff) break;

            weightedSum += obs.price * obs.volume;
            totalVolume += obs.volume;
        }

        require(totalVolume > 0, "Oracle: no data in window");
        return weightedSum / totalVolume;
    }

    /// @notice Get the most recent price observation
    function getLatestPrice()
        external
        view
        returns (uint256 price, uint256 timestamp)
    {
        require(_observations.length > 0, "Oracle: no observations");
        PriceObservation storage latest = _observations[
            _observations.length - 1
        ];
        return (latest.price, latest.timestamp);
    }

    /// @notice Get a specific observation by index
    function getObservation(
        uint256 index
    ) external view returns (PriceObservation memory) {
        require(index < _observations.length, "Oracle: index out of bounds");
        return _observations[index];
    }

    /// @notice Get the total number of recorded observations
    function getObservationCount() external view returns (uint256) {
        return _observations.length;
    }

    /// @notice Get a paginated slice of price history
    /// @param startIndex Starting index (0-based)
    /// @param count Number of observations to return
    function getPriceHistory(
        uint256 startIndex,
        uint256 count
    ) external view returns (PriceObservation[] memory) {
        require(startIndex < _observations.length, "Oracle: start out of bounds");

        uint256 remaining = _observations.length - startIndex;
        uint256 actualCount = count > remaining ? remaining : count;
        if (actualCount > MAX_HISTORY_QUERY) actualCount = MAX_HISTORY_QUERY;

        PriceObservation[] memory result = new PriceObservation[](actualCount);
        for (uint256 i = 0; i < actualCount; i++) {
            result[i] = _observations[startIndex + i];
        }
        return result;
    }

    /// @notice Update the outlier rejection threshold
    /// @param bps New threshold in basis points (e.g., 5000 = 50%)
    function setOutlierThresholdBps(
        uint256 bps
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bps >= 500 && bps <= 10000, "Oracle: threshold out of range");
        uint256 old = outlierThresholdBps;
        outlierThresholdBps = bps;
        emit OutlierThresholdUpdated(old, bps);
    }

    /// @notice Update minimum observations required before outlier rejection activates
    /// @param min New minimum (must be >= 3)
    function setMinObservations(
        uint256 min
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(min >= 3, "Oracle: min too low");
        uint256 old = minObservationsForOutlier;
        minObservationsForOutlier = min;
        emit MinObservationsUpdated(old, min);
    }

    /// @notice Internal: compute volume-weighted average of last N observations
    function _recentVwap(uint256 count) internal view returns (uint256) {
        uint256 len = _observations.length;
        uint256 lookback = count > len ? len : count;

        uint256 weightedSum;
        uint256 totalVolume;

        for (uint256 i = len; i > len - lookback; i--) {
            PriceObservation storage obs = _observations[i - 1];
            weightedSum += obs.price * obs.volume;
            totalVolume += obs.volume;
        }

        return totalVolume > 0 ? weightedSum / totalVolume : 0;
    }
}
