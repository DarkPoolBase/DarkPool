// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/InsuranceFund.sol";
import "../src/mocks/MockUSDC.sol";

contract InsuranceFundTest is Test {
    InsuranceFund public fund;
    MockUSDC public usdc;

    address public admin = address(this);
    address public liquidator = address(0xA1);
    address public feeDistributor = address(0xA2);
    address public alice = address(0xBEEF);
    address public bob = address(0xCAFE);

    uint256 constant STAKE_AMOUNT = 10_000e6;

    function setUp() public {
        usdc = new MockUSDC();
        fund = new InsuranceFund(address(usdc));
        fund.grantRole(fund.LIQUIDATION_ROLE(), liquidator);
        fund.grantRole(fund.FEE_DISTRIBUTOR_ROLE(), feeDistributor);

        // Fund test accounts
        usdc.mint(alice, 100_000e6);
        usdc.mint(bob, 100_000e6);
        usdc.mint(liquidator, 100_000e6);
        usdc.mint(feeDistributor, 100_000e6);

        // Approve
        vm.prank(alice);
        usdc.approve(address(fund), type(uint256).max);
        vm.prank(bob);
        usdc.approve(address(fund), type(uint256).max);
        vm.prank(liquidator);
        usdc.approve(address(fund), type(uint256).max);
        vm.prank(feeDistributor);
        usdc.approve(address(fund), type(uint256).max);
    }

    // ========== Constructor ==========

    function test_ConstructorDefaults() public view {
        assertEq(fund.cooldownPeriod(), 7 days);
        assertEq(fund.recapThreshold(), 100_000e6);
        assertEq(fund.totalStaked(), 0);
        assertEq(fund.stakerCount(), 0);
    }

    function test_RevertConstructorZeroUsdc() public {
        vm.expectRevert("InsuranceFund: zero USDC");
        new InsuranceFund(address(0));
    }

    // ========== Stake ==========

    function test_Stake() public {
        vm.prank(alice);
        fund.stake(STAKE_AMOUNT);

        assertEq(fund.totalStaked(), STAKE_AMOUNT);
        assertEq(fund.stakerCount(), 1);
        assertEq(usdc.balanceOf(address(fund)), STAKE_AMOUNT);

        IInsuranceFund.StakerInfo memory info = fund.getStakerInfo(alice);
        assertEq(info.stakedAmount, STAKE_AMOUNT);
    }

    function test_StakeMultipleStakers() public {
        vm.prank(alice);
        fund.stake(STAKE_AMOUNT);
        vm.prank(bob);
        fund.stake(STAKE_AMOUNT * 2);

        assertEq(fund.totalStaked(), STAKE_AMOUNT * 3);
        assertEq(fund.stakerCount(), 2);
    }

    function test_StakeAccumulates() public {
        vm.startPrank(alice);
        fund.stake(STAKE_AMOUNT);
        fund.stake(STAKE_AMOUNT);
        vm.stopPrank();

        assertEq(fund.totalStaked(), STAKE_AMOUNT * 2);
        assertEq(fund.stakerCount(), 1);
    }

    function test_RevertStakeZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert("InsuranceFund: zero amount");
        fund.stake(0);
    }

    function test_StakeEmitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit IInsuranceFund.Staked(alice, STAKE_AMOUNT);
        fund.stake(STAKE_AMOUNT);
    }

    // ========== RequestUnstake ==========

    function test_RequestUnstake() public {
        vm.startPrank(alice);
        fund.stake(STAKE_AMOUNT);
        fund.requestUnstake(STAKE_AMOUNT);
        vm.stopPrank();

        IInsuranceFund.StakerInfo memory info = fund.getStakerInfo(alice);
        assertEq(info.unstakeRequestAmount, STAKE_AMOUNT);
        assertEq(info.unstakeRequestTime, block.timestamp);
    }

    function test_RevertRequestUnstakeZero() public {
        vm.startPrank(alice);
        fund.stake(STAKE_AMOUNT);
        vm.expectRevert("InsuranceFund: zero amount");
        fund.requestUnstake(0);
        vm.stopPrank();
    }

    function test_RevertRequestUnstakeInsufficientStake() public {
        vm.startPrank(alice);
        fund.stake(STAKE_AMOUNT);
        vm.expectRevert("InsuranceFund: insufficient stake");
        fund.requestUnstake(STAKE_AMOUNT + 1);
        vm.stopPrank();
    }

    // ========== Unstake ==========

    function test_UnstakeAfterCooldown() public {
        vm.startPrank(alice);
        fund.stake(STAKE_AMOUNT);
        fund.requestUnstake(STAKE_AMOUNT);
        vm.stopPrank();

        // Advance past cooldown
        vm.warp(block.timestamp + 7 days);

        uint256 balanceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        fund.unstake();

        assertEq(usdc.balanceOf(alice), balanceBefore + STAKE_AMOUNT);
        assertEq(fund.totalStaked(), 0);
        assertEq(fund.stakerCount(), 0);
    }

    function test_RevertUnstakeBeforeCooldown() public {
        vm.startPrank(alice);
        fund.stake(STAKE_AMOUNT);
        fund.requestUnstake(STAKE_AMOUNT);

        vm.warp(block.timestamp + 6 days);

        vm.expectRevert("InsuranceFund: cooldown not elapsed");
        fund.unstake();
        vm.stopPrank();
    }

    function test_RevertUnstakeNoPendingRequest() public {
        vm.startPrank(alice);
        fund.stake(STAKE_AMOUNT);
        vm.expectRevert("InsuranceFund: no pending unstake");
        fund.unstake();
        vm.stopPrank();
    }

    function test_PartialUnstake() public {
        vm.startPrank(alice);
        fund.stake(STAKE_AMOUNT);
        fund.requestUnstake(STAKE_AMOUNT / 2);
        vm.stopPrank();

        vm.warp(block.timestamp + 7 days);

        vm.prank(alice);
        fund.unstake();

        assertEq(fund.totalStaked(), STAKE_AMOUNT / 2);
        assertEq(fund.stakerCount(), 1);
    }

    // ========== CoverLoss ==========

    function test_CoverLoss() public {
        // Alice stakes
        vm.prank(alice);
        fund.stake(STAKE_AMOUNT);

        uint256 liqBalanceBefore = usdc.balanceOf(liquidator);

        // Liquidator requests loss coverage
        vm.prank(liquidator);
        fund.coverLoss(5_000e6);

        assertEq(usdc.balanceOf(liquidator), liqBalanceBefore + 5_000e6);
        assertEq(usdc.balanceOf(address(fund)), STAKE_AMOUNT - 5_000e6);
    }

    function test_CoverLossEmitsEvent() public {
        vm.prank(alice);
        fund.stake(STAKE_AMOUNT);

        vm.prank(liquidator);
        vm.expectEmit(false, false, false, true);
        emit IInsuranceFund.LossCovered(5_000e6, STAKE_AMOUNT - 5_000e6);
        fund.coverLoss(5_000e6);
    }

    function test_RevertCoverLossInsufficientFunds() public {
        vm.prank(alice);
        fund.stake(STAKE_AMOUNT);

        vm.prank(liquidator);
        vm.expectRevert("InsuranceFund: insufficient funds");
        fund.coverLoss(STAKE_AMOUNT + 1);
    }

    function test_RevertCoverLossZero() public {
        vm.prank(liquidator);
        vm.expectRevert("InsuranceFund: zero amount");
        fund.coverLoss(0);
    }

    function test_RevertCoverLossUnauthorized() public {
        vm.prank(alice);
        fund.stake(STAKE_AMOUNT);

        vm.prank(alice);
        vm.expectRevert();
        fund.coverLoss(1_000e6);
    }

    function test_CoverLossTriggersRecapEvent() public {
        // Set threshold higher than what will remain
        fund.setRecapThreshold(8_000e6);

        vm.prank(alice);
        fund.stake(STAKE_AMOUNT);

        vm.prank(liquidator);
        vm.expectEmit(false, false, false, true);
        emit IInsuranceFund.RecapitalizationTriggered(0, STAKE_AMOUNT - 5_000e6);
        fund.coverLoss(5_000e6);
    }

    // ========== Fee Distribution ==========

    function test_ReceiveAndDistributeFees() public {
        // Alice and Bob stake
        vm.prank(alice);
        fund.stake(STAKE_AMOUNT);
        vm.prank(bob);
        fund.stake(STAKE_AMOUNT);

        // Send fees to the fund
        vm.prank(feeDistributor);
        fund.receiveFees(1_000e6);
        assertEq(fund.pendingFees(), 1_000e6);

        // Distribute fees
        vm.prank(feeDistributor);
        fund.distributeFees();
        assertEq(fund.pendingFees(), 0);

        // Each staker should have ~500e6 in rewards (equal stakes)
        IInsuranceFund.StakerInfo memory aliceInfo = fund.getStakerInfo(alice);
        assertEq(aliceInfo.pendingRewards, 500e6);

        IInsuranceFund.StakerInfo memory bobInfo = fund.getStakerInfo(bob);
        assertEq(bobInfo.pendingRewards, 500e6);
    }

    function test_FeeDistributionProportional() public {
        // Alice stakes 3x more than Bob
        vm.prank(alice);
        fund.stake(30_000e6);
        vm.prank(bob);
        fund.stake(10_000e6);

        vm.startPrank(feeDistributor);
        fund.receiveFees(4_000e6);
        fund.distributeFees();
        vm.stopPrank();

        IInsuranceFund.StakerInfo memory aliceInfo = fund.getStakerInfo(alice);
        assertEq(aliceInfo.pendingRewards, 3_000e6);

        IInsuranceFund.StakerInfo memory bobInfo = fund.getStakerInfo(bob);
        assertEq(bobInfo.pendingRewards, 1_000e6);
    }

    function test_ClaimRewards() public {
        vm.prank(alice);
        fund.stake(STAKE_AMOUNT);

        vm.startPrank(feeDistributor);
        fund.receiveFees(1_000e6);
        fund.distributeFees();
        vm.stopPrank();

        uint256 balanceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        fund.claimRewards();

        assertEq(usdc.balanceOf(alice), balanceBefore + 1_000e6);
    }

    function test_RevertClaimNoRewards() public {
        vm.prank(alice);
        fund.stake(STAKE_AMOUNT);

        vm.prank(alice);
        vm.expectRevert("InsuranceFund: no rewards");
        fund.claimRewards();
    }

    function test_RevertDistributeNoFees() public {
        vm.prank(alice);
        fund.stake(STAKE_AMOUNT);

        vm.prank(feeDistributor);
        vm.expectRevert("InsuranceFund: no pending fees");
        fund.distributeFees();
    }

    function test_RevertDistributeNoStakers() public {
        vm.prank(feeDistributor);
        fund.receiveFees(1_000e6);

        vm.prank(feeDistributor);
        vm.expectRevert("InsuranceFund: no stakers");
        fund.distributeFees();
    }

    // ========== Fund Health ==========

    function test_FundHealth() public {
        vm.prank(alice);
        fund.stake(STAKE_AMOUNT);

        vm.prank(liquidator);
        fund.updateOutstandingRisk(50_000e6);

        (uint256 fundSize, uint256 risk) = fund.fundHealth();
        assertEq(fundSize, STAKE_AMOUNT);
        assertEq(risk, 50_000e6);
    }

    // ========== Admin Functions ==========

    function test_SetCooldownPeriod() public {
        fund.setCooldownPeriod(14 days);
        assertEq(fund.cooldownPeriod(), 14 days);
    }

    function test_RevertSetCooldownTooShort() public {
        vm.expectRevert("InsuranceFund: invalid cooldown");
        fund.setCooldownPeriod(12 hours);
    }

    function test_RevertSetCooldownTooLong() public {
        vm.expectRevert("InsuranceFund: invalid cooldown");
        fund.setCooldownPeriod(60 days);
    }

    function test_SetRecapThreshold() public {
        fund.setRecapThreshold(500_000e6);
        assertEq(fund.recapThreshold(), 500_000e6);
    }

    function test_RevertSetCooldownUnauthorized() public {
        vm.prank(alice);
        vm.expectRevert();
        fund.setCooldownPeriod(14 days);
    }

    function test_RevertSetThresholdUnauthorized() public {
        vm.prank(alice);
        vm.expectRevert();
        fund.setRecapThreshold(500_000e6);
    }

    // ========== Fuzz ==========

    function testFuzz_StakeAndUnstake(uint256 amount) public {
        amount = bound(amount, 1, 50_000e6);

        vm.startPrank(alice);
        fund.stake(amount);
        assertEq(fund.totalStaked(), amount);

        fund.requestUnstake(amount);
        vm.warp(block.timestamp + 7 days);
        fund.unstake();

        assertEq(fund.totalStaked(), 0);
        vm.stopPrank();
    }
}
