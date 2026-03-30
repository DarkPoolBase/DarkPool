// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/FeeCollector.sol";
import "../src/mocks/MockUSDC.sol";

contract FeeCollectorTest is Test {
    FeeCollector public collector;
    MockUSDC public usdc;

    address public admin = address(this);
    address public darkPool = address(0xA1);
    address public treasury = address(0xB1);
    address public stakerVault = address(0xB2);
    address public burnAddress = address(0xB3);
    address public user = address(0xBEEF);

    function setUp() public {
        usdc = new MockUSDC();
        collector = new FeeCollector(
            address(usdc),
            treasury,
            stakerVault,
            burnAddress
        );
        collector.grantRole(collector.DARKPOOL_ROLE(), darkPool);
    }

    // ========== Constructor ==========

    function test_ConstructorDefaults() public view {
        assertEq(collector.feeRate(), 20);
        assertEq(collector.treasuryBps(), 5000);
        assertEq(collector.stakerBps(), 4000);
        assertEq(collector.burnBps(), 1000);
        assertEq(collector.totalCollected(), 0);
    }

    function test_RevertConstructorZeroUsdc() public {
        vm.expectRevert("FeeCollector: zero USDC");
        new FeeCollector(address(0), treasury, stakerVault, burnAddress);
    }

    function test_RevertConstructorZeroTreasury() public {
        vm.expectRevert("FeeCollector: zero treasury");
        new FeeCollector(address(usdc), address(0), stakerVault, burnAddress);
    }

    // ========== NotifyFee ==========

    function test_NotifyFee() public {
        vm.prank(darkPool);
        collector.notifyFee(bytes32(uint256(1)), 1000e6);
        assertEq(collector.totalCollected(), 1000e6);
    }

    function test_NotifyFeeAccumulates() public {
        vm.startPrank(darkPool);
        collector.notifyFee(bytes32(uint256(1)), 500e6);
        collector.notifyFee(bytes32(uint256(2)), 300e6);
        vm.stopPrank();
        assertEq(collector.totalCollected(), 800e6);
    }

    function test_RevertNotifyFeeUnauthorized() public {
        vm.prank(user);
        vm.expectRevert();
        collector.notifyFee(bytes32(uint256(1)), 1000e6);
    }

    function test_RevertNotifyFeeZeroAmount() public {
        vm.prank(darkPool);
        vm.expectRevert("FeeCollector: zero amount");
        collector.notifyFee(bytes32(uint256(1)), 0);
    }

    // ========== Distribute Fees ==========

    function test_DistributeFees() public {
        // Simulate Escrow sending USDC to collector
        usdc.mint(address(collector), 10000e6);

        collector.distributeFees();

        // 50% treasury, 40% stakers, 10% burn
        assertEq(usdc.balanceOf(treasury), 5000e6);
        assertEq(usdc.balanceOf(stakerVault), 4000e6);
        assertEq(usdc.balanceOf(burnAddress), 1000e6);
        assertEq(usdc.balanceOf(address(collector)), 0);
    }

    function test_DistributeFeesCustomSplit() public {
        collector.setDistribution(7000, 2000, 1000);
        usdc.mint(address(collector), 10000e6);

        collector.distributeFees();

        assertEq(usdc.balanceOf(treasury), 7000e6);
        assertEq(usdc.balanceOf(stakerVault), 2000e6);
        assertEq(usdc.balanceOf(burnAddress), 1000e6);
    }

    function test_RevertDistributeFeesZeroBalance() public {
        vm.expectRevert("FeeCollector: nothing to distribute");
        collector.distributeFees();
    }

    function test_PendingDistribution() public {
        usdc.mint(address(collector), 5000e6);
        assertEq(collector.pendingDistribution(), 5000e6);

        collector.distributeFees();
        assertEq(collector.pendingDistribution(), 0);
    }

    // ========== Fee Rate ==========

    function test_SetFeeRate() public {
        collector.setFeeRate(50);
        assertEq(collector.feeRate(), 50);
    }

    function test_RevertSetFeeRateTooHigh() public {
        vm.expectRevert("FeeCollector: fee rate too high");
        collector.setFeeRate(501);
    }

    function test_RevertSetFeeRateUnauthorized() public {
        vm.prank(user);
        vm.expectRevert();
        collector.setFeeRate(50);
    }

    // ========== Distribution Config ==========

    function test_SetDistribution() public {
        collector.setDistribution(6000, 3000, 1000);
        assertEq(collector.treasuryBps(), 6000);
        assertEq(collector.stakerBps(), 3000);
        assertEq(collector.burnBps(), 1000);
    }

    function test_RevertSetDistributionBadSum() public {
        vm.expectRevert("FeeCollector: distribution must sum to 10000");
        collector.setDistribution(5000, 3000, 1000);
    }

    function test_RevertSetDistributionUnauthorized() public {
        vm.prank(user);
        vm.expectRevert();
        collector.setDistribution(5000, 4000, 1000);
    }

    // ========== Address Updates ==========

    function test_SetTreasury() public {
        address newTreasury = address(0xC1);
        collector.setTreasury(newTreasury);
        assertEq(collector.treasury(), newTreasury);
    }

    function test_RevertSetTreasuryZero() public {
        vm.expectRevert("FeeCollector: zero address");
        collector.setTreasury(address(0));
    }

    function test_SetStakerVault() public {
        address newVault = address(0xC2);
        collector.setStakerVault(newVault);
        assertEq(collector.stakerVault(), newVault);
    }

    function test_SetBurnAddress() public {
        address newBurn = address(0xC3);
        collector.setBurnAddress(newBurn);
        assertEq(collector.burnAddress(), newBurn);
    }

    // ========== Fuzz ==========

    function testFuzz_DistributionSumsCorrectly(uint256 amount) public {
        vm.assume(amount > 100 && amount < type(uint128).max);

        usdc.mint(address(collector), amount);
        collector.distributeFees();

        uint256 total = usdc.balanceOf(treasury)
            + usdc.balanceOf(stakerVault)
            + usdc.balanceOf(burnAddress);
        assertEq(total, amount);
    }
}
