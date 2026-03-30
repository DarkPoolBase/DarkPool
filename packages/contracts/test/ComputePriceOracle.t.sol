// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ComputePriceOracle.sol";

contract ComputePriceOracleTest is Test {
    ComputePriceOracle public oracle;

    address public admin = address(this);
    address public reporter = address(0xA1);
    address public user = address(0xBEEF);

    function setUp() public {
        oracle = new ComputePriceOracle();
        oracle.grantRole(oracle.REPORTER_ROLE(), reporter);
    }

    // ========== Constructor ==========

    function test_ConstructorDefaults() public view {
        assertEq(oracle.outlierThresholdBps(), 5000);
        assertEq(oracle.minObservationsForOutlier(), 5);
        assertEq(oracle.getObservationCount(), 0);
    }

    // ========== RecordPrice ==========

    function test_RecordPrice() public {
        vm.prank(reporter);
        oracle.recordPrice(bytes32(uint256(1)), 100e6, 50);

        assertEq(oracle.getObservationCount(), 1);

        IComputePriceOracle.PriceObservation memory obs = oracle.getObservation(0);
        assertEq(obs.price, 100e6);
        assertEq(obs.volume, 50);
        assertEq(obs.batchId, bytes32(uint256(1)));
    }

    function test_RecordPriceEmitsEvent() public {
        vm.prank(reporter);
        vm.expectEmit(true, false, false, true);
        emit IComputePriceOracle.PriceRecorded(
            bytes32(uint256(1)),
            100e6,
            50,
            block.timestamp
        );
        oracle.recordPrice(bytes32(uint256(1)), 100e6, 50);
    }

    function test_RevertRecordPriceZeroPrice() public {
        vm.prank(reporter);
        vm.expectRevert("Oracle: zero price");
        oracle.recordPrice(bytes32(uint256(1)), 0, 50);
    }

    function test_RevertRecordPriceZeroVolume() public {
        vm.prank(reporter);
        vm.expectRevert("Oracle: zero volume");
        oracle.recordPrice(bytes32(uint256(1)), 100e6, 0);
    }

    function test_RevertRecordDuplicateBatch() public {
        vm.startPrank(reporter);
        oracle.recordPrice(bytes32(uint256(1)), 100e6, 50);
        vm.expectRevert("Oracle: batch already recorded");
        oracle.recordPrice(bytes32(uint256(1)), 110e6, 60);
        vm.stopPrank();
    }

    function test_RevertRecordPriceUnauthorized() public {
        vm.prank(user);
        vm.expectRevert();
        oracle.recordPrice(bytes32(uint256(1)), 100e6, 50);
    }

    // ========== Outlier Rejection ==========

    function test_OutlierRejection() public {
        vm.startPrank(reporter);

        // Record 5 observations at ~100e6
        for (uint256 i = 1; i <= 5; i++) {
            oracle.recordPrice(bytes32(i), 100e6, 50);
        }

        // Now try to record a price that deviates >50% (threshold)
        // 160e6 is 60% above 100e6, should be rejected
        oracle.recordPrice(bytes32(uint256(6)), 160e6, 50);

        // Should still be 5 observations (outlier rejected)
        assertEq(oracle.getObservationCount(), 5);
        vm.stopPrank();
    }

    function test_OutlierRejectionEmitsEvent() public {
        vm.startPrank(reporter);

        for (uint256 i = 1; i <= 5; i++) {
            oracle.recordPrice(bytes32(i), 100e6, 50);
        }

        vm.expectEmit(true, false, false, true);
        emit IComputePriceOracle.PriceRejected(
            bytes32(uint256(6)),
            200e6,
            "outlier"
        );
        oracle.recordPrice(bytes32(uint256(6)), 200e6, 50);
        vm.stopPrank();
    }

    function test_NoOutlierRejectionBelowMinObservations() public {
        vm.startPrank(reporter);

        // Only 3 observations — below min of 5
        for (uint256 i = 1; i <= 3; i++) {
            oracle.recordPrice(bytes32(i), 100e6, 50);
        }

        // Extreme price should still be accepted
        oracle.recordPrice(bytes32(uint256(4)), 500e6, 50);
        assertEq(oracle.getObservationCount(), 4);
        vm.stopPrank();
    }

    function test_AcceptPriceWithinThreshold() public {
        vm.startPrank(reporter);

        for (uint256 i = 1; i <= 5; i++) {
            oracle.recordPrice(bytes32(i), 100e6, 50);
        }

        // 140e6 is 40% above 100e6, within 50% threshold
        oracle.recordPrice(bytes32(uint256(6)), 140e6, 50);
        assertEq(oracle.getObservationCount(), 6);
        vm.stopPrank();
    }

    // ========== TWAP ==========

    function test_TwapSingleObservation() public {
        vm.prank(reporter);
        oracle.recordPrice(bytes32(uint256(1)), 100e6, 50);

        uint256 twap = oracle.getTwap(0);
        assertEq(twap, 100e6);
    }

    function test_TwapVolumeWeighted() public {
        vm.startPrank(reporter);

        // Price 100 with volume 100, price 200 with volume 100
        // VWAP = (100*100 + 200*100) / 200 = 150
        oracle.recordPrice(bytes32(uint256(1)), 100e6, 100);
        oracle.recordPrice(bytes32(uint256(2)), 200e6, 100);

        uint256 twap = oracle.getTwap(0);
        assertEq(twap, 150e6);
        vm.stopPrank();
    }

    function test_TwapVolumeWeightedAsymmetric() public {
        vm.startPrank(reporter);

        // Price 100 with volume 300, price 200 with volume 100
        // VWAP = (100*300 + 200*100) / 400 = 125
        oracle.recordPrice(bytes32(uint256(1)), 100e6, 300);
        oracle.recordPrice(bytes32(uint256(2)), 200e6, 100);

        uint256 twap = oracle.getTwap(0);
        assertEq(twap, 125e6);
        vm.stopPrank();
    }

    function test_TwapWindowFiltering() public {
        vm.startPrank(reporter);

        // Record old observation
        oracle.recordPrice(bytes32(uint256(1)), 50e6, 100);

        // Advance 20 minutes
        vm.warp(block.timestamp + 20 minutes);

        // Record recent observations
        oracle.recordPrice(bytes32(uint256(2)), 100e6, 100);
        oracle.recordPrice(bytes32(uint256(3)), 120e6, 100);

        // 5-minute window should only include the last observation
        uint256 twap5m = oracle.getTwap(5 minutes);
        assertEq(twap5m, 110e6); // (100*100 + 120*100) / 200

        vm.stopPrank();
    }

    function test_RevertTwapNoObservations() public {
        vm.expectRevert("Oracle: no observations");
        oracle.getTwap(0);
    }

    // ========== GetLatestPrice ==========

    function test_GetLatestPrice() public {
        vm.startPrank(reporter);
        oracle.recordPrice(bytes32(uint256(1)), 100e6, 50);

        vm.warp(block.timestamp + 1 minutes);
        oracle.recordPrice(bytes32(uint256(2)), 120e6, 60);

        (uint256 price, uint256 ts) = oracle.getLatestPrice();
        assertEq(price, 120e6);
        assertEq(ts, block.timestamp);
        vm.stopPrank();
    }

    function test_RevertGetLatestPriceEmpty() public {
        vm.expectRevert("Oracle: no observations");
        oracle.getLatestPrice();
    }

    // ========== GetPriceHistory ==========

    function test_GetPriceHistory() public {
        vm.startPrank(reporter);
        // Use stable prices to avoid outlier rejection
        for (uint256 i = 1; i <= 10; i++) {
            oracle.recordPrice(bytes32(i), 100e6, 50);
        }
        vm.stopPrank();

        assertEq(oracle.getObservationCount(), 10);

        IComputePriceOracle.PriceObservation[] memory history = oracle
            .getPriceHistory(2, 4);
        assertEq(history.length, 4);
        assertEq(history[0].price, 100e6);
        assertEq(history[0].batchId, bytes32(uint256(3)));
        assertEq(history[3].batchId, bytes32(uint256(6)));
    }

    function test_GetPriceHistoryClampedToEnd() public {
        vm.startPrank(reporter);
        for (uint256 i = 1; i <= 5; i++) {
            oracle.recordPrice(bytes32(i), uint256(i) * 10e6, 50);
        }
        vm.stopPrank();

        // Request more than available
        IComputePriceOracle.PriceObservation[] memory history = oracle
            .getPriceHistory(3, 100);
        assertEq(history.length, 2); // Only indices 3 and 4 remain
    }

    function test_RevertGetPriceHistoryOutOfBounds() public {
        vm.expectRevert("Oracle: start out of bounds");
        oracle.getPriceHistory(0, 1);
    }

    // ========== Admin Functions ==========

    function test_SetOutlierThreshold() public {
        oracle.setOutlierThresholdBps(3000);
        assertEq(oracle.outlierThresholdBps(), 3000);
    }

    function test_RevertSetOutlierThresholdTooLow() public {
        vm.expectRevert("Oracle: threshold out of range");
        oracle.setOutlierThresholdBps(100);
    }

    function test_RevertSetOutlierThresholdTooHigh() public {
        vm.expectRevert("Oracle: threshold out of range");
        oracle.setOutlierThresholdBps(20000);
    }

    function test_SetMinObservations() public {
        oracle.setMinObservations(10);
        assertEq(oracle.minObservationsForOutlier(), 10);
    }

    function test_RevertSetMinObservationsTooLow() public {
        vm.expectRevert("Oracle: min too low");
        oracle.setMinObservations(2);
    }

    function test_RevertSetOutlierThresholdUnauthorized() public {
        vm.prank(user);
        vm.expectRevert();
        oracle.setOutlierThresholdBps(3000);
    }

    function test_RevertSetMinObservationsUnauthorized() public {
        vm.prank(user);
        vm.expectRevert();
        oracle.setMinObservations(10);
    }

    // ========== GetObservation ==========

    function test_RevertGetObservationOutOfBounds() public {
        vm.expectRevert("Oracle: index out of bounds");
        oracle.getObservation(0);
    }

    // ========== Fuzz ==========

    function testFuzz_RecordAndRetrieve(uint256 price, uint256 volume) public {
        price = bound(price, 1, type(uint128).max);
        volume = bound(volume, 1, type(uint128).max);

        vm.prank(reporter);
        oracle.recordPrice(bytes32(uint256(1)), price, volume);

        IComputePriceOracle.PriceObservation memory obs = oracle.getObservation(0);
        assertEq(obs.price, price);
        assertEq(obs.volume, volume);
    }
}
