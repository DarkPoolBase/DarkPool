// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SdkAccessFee.sol";
import "../src/ComputeCredit.sol";

contract SdkAccessFeeTest is Test {
    SdkAccessFee public sdk;
    ComputeCredit public token;

    address public admin = address(this);
    address public subscriber1 = address(0xA1);
    address public subscriber2 = address(0xA2);
    address public feeRecipient = address(0xFEE);
    address public nobody = address(0xDEAD);

    uint256 constant MONTHLY_FEE = 50e18;
    uint256 constant REQUESTS_PER_DAY = 1000;

    function setUp() public {
        token = new ComputeCredit();
        sdk = new SdkAccessFee(address(token), feeRecipient);

        // Mint tokens to subscribers
        token.mint(subscriber1, 10000e18);
        token.mint(subscriber2, 10000e18);

        // Approve
        vm.prank(subscriber1);
        token.approve(address(sdk), type(uint256).max);
        vm.prank(subscriber2);
        token.approve(address(sdk), type(uint256).max);
    }

    // ========== Constructor ==========

    function test_ConstructorDefaults() public view {
        assertEq(sdk.tierCount(), 0);
        assertEq(sdk.feeRecipient(), feeRecipient);
        assertEq(sdk.SUBSCRIPTION_PERIOD(), 30 days);
    }

    function test_RevertConstructorZeroToken() public {
        vm.expectRevert("SdkAccessFee: zero token");
        new SdkAccessFee(address(0), feeRecipient);
    }

    function test_RevertConstructorZeroFeeRecipient() public {
        vm.expectRevert("SdkAccessFee: zero fee recipient");
        new SdkAccessFee(address(token), address(0));
    }

    // ========== Create Tier ==========

    function test_CreateTier() public {
        uint256 id = sdk.createTier("Basic", MONTHLY_FEE, REQUESTS_PER_DAY);

        assertEq(id, 1);
        assertEq(sdk.tierCount(), 1);

        ISdkAccessFee.AccessTier memory tier = sdk.getTier(1);
        assertEq(tier.name, "Basic");
        assertEq(tier.monthlyFee, MONTHLY_FEE);
        assertEq(tier.maxRequestsPerDay, REQUESTS_PER_DAY);
        assertTrue(tier.active);
    }

    function test_CreateTierEmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit ISdkAccessFee.TierCreated(1, "Basic", MONTHLY_FEE);
        sdk.createTier("Basic", MONTHLY_FEE, REQUESTS_PER_DAY);
    }

    function test_RevertCreateTierUnauthorized() public {
        vm.prank(nobody);
        vm.expectRevert();
        sdk.createTier("Basic", MONTHLY_FEE, REQUESTS_PER_DAY);
    }

    function test_RevertCreateTierEmptyName() public {
        vm.expectRevert("SdkAccessFee: empty name");
        sdk.createTier("", MONTHLY_FEE, REQUESTS_PER_DAY);
    }

    function test_RevertCreateTierZeroFee() public {
        vm.expectRevert("SdkAccessFee: zero fee");
        sdk.createTier("Basic", 0, REQUESTS_PER_DAY);
    }

    function test_RevertCreateTierZeroRequests() public {
        vm.expectRevert("SdkAccessFee: zero requests");
        sdk.createTier("Basic", MONTHLY_FEE, 0);
    }

    function test_CreateMultipleTiers() public {
        sdk.createTier("Basic", 50e18, 1000);
        sdk.createTier("Pro", 200e18, 10000);
        sdk.createTier("Enterprise", 1000e18, 100000);

        assertEq(sdk.tierCount(), 3);

        ISdkAccessFee.AccessTier[] memory tiers = sdk.listTiers();
        assertEq(tiers.length, 3);
        assertEq(tiers[0].name, "Basic");
        assertEq(tiers[1].name, "Pro");
        assertEq(tiers[2].name, "Enterprise");
    }

    // ========== Subscribe ==========

    function test_Subscribe() public {
        sdk.createTier("Basic", MONTHLY_FEE, REQUESTS_PER_DAY);

        uint256 balanceBefore = token.balanceOf(subscriber1);
        uint256 feeBefore = token.balanceOf(feeRecipient);

        vm.prank(subscriber1);
        sdk.subscribe(1);

        assertEq(token.balanceOf(subscriber1), balanceBefore - MONTHLY_FEE);
        assertEq(token.balanceOf(feeRecipient), feeBefore + MONTHLY_FEE);

        (uint256 tierId, uint256 expiresAt, bool active) = sdk.getSubscription(subscriber1);
        assertEq(tierId, 1);
        assertEq(expiresAt, block.timestamp + 30 days);
        assertTrue(active);
    }

    function test_SubscribeEmitsEvents() public {
        sdk.createTier("Basic", MONTHLY_FEE, REQUESTS_PER_DAY);

        vm.expectEmit(true, false, false, true);
        emit ISdkAccessFee.FeeCollected(subscriber1, MONTHLY_FEE);

        vm.expectEmit(true, true, false, true);
        emit ISdkAccessFee.SubscriptionCreated(subscriber1, 1, block.timestamp + 30 days);

        vm.prank(subscriber1);
        sdk.subscribe(1);
    }

    function test_RevertSubscribeInvalidTier() public {
        vm.prank(subscriber1);
        vm.expectRevert("SdkAccessFee: tier not active");
        sdk.subscribe(999);
    }

    // ========== Renew ==========

    function test_RenewSubscription() public {
        sdk.createTier("Basic", MONTHLY_FEE, REQUESTS_PER_DAY);

        vm.prank(subscriber1);
        sdk.subscribe(1);

        uint256 originalExpiry = block.timestamp + 30 days;

        // Renew before expiry
        vm.warp(block.timestamp + 15 days);
        vm.prank(subscriber1);
        sdk.renewSubscription();

        (, uint256 expiresAt,) = sdk.getSubscription(subscriber1);
        // Should extend from original expiry, not from now
        assertEq(expiresAt, originalExpiry + 30 days);
    }

    function test_RenewAfterExpiry() public {
        sdk.createTier("Basic", MONTHLY_FEE, REQUESTS_PER_DAY);

        vm.prank(subscriber1);
        sdk.subscribe(1);

        // Warp past expiry
        vm.warp(block.timestamp + 60 days);

        vm.prank(subscriber1);
        sdk.renewSubscription();

        (, uint256 expiresAt,) = sdk.getSubscription(subscriber1);
        // Should extend from now since expired
        assertEq(expiresAt, block.timestamp + 30 days);
    }

    function test_RevertRenewNoSubscription() public {
        vm.prank(subscriber1);
        vm.expectRevert("SdkAccessFee: no subscription");
        sdk.renewSubscription();
    }

    // ========== isActiveSubscriber ==========

    function test_IsActiveSubscriberTrue() public {
        sdk.createTier("Basic", MONTHLY_FEE, REQUESTS_PER_DAY);

        vm.prank(subscriber1);
        sdk.subscribe(1);

        assertTrue(sdk.isActiveSubscriber(subscriber1));
    }

    function test_IsActiveSubscriberFalseAfterExpiry() public {
        sdk.createTier("Basic", MONTHLY_FEE, REQUESTS_PER_DAY);

        vm.prank(subscriber1);
        sdk.subscribe(1);

        vm.warp(block.timestamp + 31 days);

        assertFalse(sdk.isActiveSubscriber(subscriber1));
    }

    function test_IsActiveSubscriberFalseNeverSubscribed() public view {
        assertFalse(sdk.isActiveSubscriber(nobody));
    }

    // ========== Get Subscription ==========

    function test_GetSubscriptionNonSubscriber() public view {
        (uint256 tierId, uint256 expiresAt, bool active) = sdk.getSubscription(nobody);
        assertEq(tierId, 0);
        assertEq(expiresAt, 0);
        assertFalse(active);
    }

    // ========== List Tiers ==========

    function test_ListTiersEmpty() public view {
        ISdkAccessFee.AccessTier[] memory tiers = sdk.listTiers();
        assertEq(tiers.length, 0);
    }
}
