// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IFeeCollector.sol";

/// @title MockFeeCollector - Test-only fee collector
contract MockFeeCollector is IFeeCollector {
    uint256 private _totalCollected;
    uint256 private _feeRate = 20;

    function notifyFee(bytes32, uint256 amount) external override {
        _totalCollected += amount;
    }

    function distributeFees() external override {}

    function setFeeRate(uint256 bps) external override {
        _feeRate = bps;
    }

    function setDistribution(uint256, uint256, uint256) external override {}

    function totalCollected() external view override returns (uint256) {
        return _totalCollected;
    }

    function pendingDistribution() external view override returns (uint256) {
        return 0;
    }

    function feeRate() external view override returns (uint256) {
        return _feeRate;
    }
}

