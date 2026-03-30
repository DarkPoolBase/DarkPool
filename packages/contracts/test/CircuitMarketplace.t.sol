// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/CircuitMarketplace.sol";
import "../src/ComputeCredit.sol";

contract CircuitMarketplaceTest is Test {
    CircuitMarketplace public marketplace;
    ComputeCredit public token;

    address public admin = address(this);
    address public dev1 = address(0xA1);
    address public dev2 = address(0xA2);
    address public buyer1 = address(0xB1);
    address public buyer2 = address(0xB2);
    address public curator = address(0xC1);
    address public feeRecipient = address(0xFEE);
    address public nobody = address(0xDEAD);

    bytes32 constant VERIFIER_HASH = keccak256("verifier-v1");
    bytes32 constant SOURCE_HASH = keccak256("source-v1");
    bytes32 constant VERIFIER_HASH_V2 = keccak256("verifier-v2");

    uint256 constant PRICE = 100e18;

    function setUp() public {
        token = new ComputeCredit();
        marketplace = new CircuitMarketplace(address(token), feeRecipient);

        // Mint tokens to buyers
        token.mint(buyer1, 10000e18);
        token.mint(buyer2, 10000e18);

        // Approve marketplace
        vm.prank(buyer1);
        token.approve(address(marketplace), type(uint256).max);
        vm.prank(buyer2);
        token.approve(address(marketplace), type(uint256).max);
    }

    // ========== Constructor ==========

    function test_ConstructorDefaults() public view {
        assertEq(marketplace.platformFeeBps(), 500);
        assertEq(marketplace.feeRecipient(), feeRecipient);
        assertEq(marketplace.circuitCount(), 0);
    }

    function test_RevertConstructorZeroToken() public {
        vm.expectRevert("CircuitMarketplace: zero token");
        new CircuitMarketplace(address(0), feeRecipient);
    }

    function test_RevertConstructorZeroFeeRecipient() public {
        vm.expectRevert("CircuitMarketplace: zero fee recipient");
        new CircuitMarketplace(address(token), address(0));
    }

    // ========== Publish ==========

    function test_PublishCircuit() public {
        vm.prank(dev1);
        uint256 id = marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        assertEq(id, 1);
        assertEq(marketplace.circuitCount(), 1);

        ICircuitMarketplace.Circuit memory c = marketplace.getCircuit(1);
        assertEq(c.id, 1);
        assertEq(c.name, "ZK-Transfer");
        assertEq(c.version, "1.0.0");
        assertEq(c.verifierHash, VERIFIER_HASH);
        assertEq(c.circuitSourceHash, SOURCE_HASH);
        assertEq(c.developer, dev1);
        assertEq(c.price, PRICE);
        assertEq(c.totalPurchases, 0);
        assertEq(c.totalEarned, 0);
        assertEq(c.curationScore, 0);
        assertTrue(c.active);
    }

    function test_PublishCircuitEmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit ICircuitMarketplace.CircuitPublished(1, dev1, "ZK-Transfer", PRICE);
        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);
    }

    function test_RevertPublishEmptyName() public {
        vm.prank(dev1);
        vm.expectRevert("CircuitMarketplace: empty name");
        marketplace.publishCircuit("", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);
    }

    function test_RevertPublishEmptyVersion() public {
        vm.prank(dev1);
        vm.expectRevert("CircuitMarketplace: empty version");
        marketplace.publishCircuit("ZK-Transfer", "", VERIFIER_HASH, SOURCE_HASH, PRICE);
    }

    function test_RevertPublishZeroVerifierHash() public {
        vm.prank(dev1);
        vm.expectRevert("CircuitMarketplace: zero verifier hash");
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", bytes32(0), SOURCE_HASH, PRICE);
    }

    function test_RevertPublishZeroSourceHash() public {
        vm.prank(dev1);
        vm.expectRevert("CircuitMarketplace: zero source hash");
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, bytes32(0), PRICE);
    }

    function test_RevertPublishZeroPrice() public {
        vm.prank(dev1);
        vm.expectRevert("CircuitMarketplace: zero price");
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, 0);
    }

    // ========== Purchase ==========

    function test_PurchaseCircuit() public {
        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        uint256 buyerBefore = token.balanceOf(buyer1);
        uint256 feeBefore = token.balanceOf(feeRecipient);

        vm.prank(buyer1);
        marketplace.purchaseCircuit(1);

        // 5% fee = 5e18, dev share = 95e18
        assertEq(token.balanceOf(buyer1), buyerBefore - PRICE);
        assertEq(token.balanceOf(feeRecipient), feeBefore + 5e18);
        assertEq(marketplace.developerBalance(dev1), 95e18);

        ICircuitMarketplace.Circuit memory c = marketplace.getCircuit(1);
        assertEq(c.totalPurchases, 1);
        assertEq(c.totalEarned, 95e18);
    }

    function test_PurchaseCircuitEmitsEvent() public {
        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        vm.expectEmit(true, true, false, true);
        emit ICircuitMarketplace.CircuitPurchased(1, buyer1, PRICE);
        vm.prank(buyer1);
        marketplace.purchaseCircuit(1);
    }

    function test_RevertPurchaseAlreadyPurchased() public {
        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        vm.prank(buyer1);
        marketplace.purchaseCircuit(1);

        vm.prank(buyer1);
        vm.expectRevert("CircuitMarketplace: already purchased");
        marketplace.purchaseCircuit(1);
    }

    function test_RevertPurchaseInactiveCircuit() public {
        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        vm.prank(dev1);
        marketplace.deactivateCircuit(1);

        vm.prank(buyer1);
        vm.expectRevert("CircuitMarketplace: circuit not active");
        marketplace.purchaseCircuit(1);
    }

    function test_PlatformFeeTakenCorrectly() public {
        // Set fee to 10%
        marketplace.setPlatformFee(1000);

        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        vm.prank(buyer1);
        marketplace.purchaseCircuit(1);

        // 10% fee = 10e18, dev share = 90e18
        assertEq(token.balanceOf(feeRecipient), 10e18);
        assertEq(marketplace.developerBalance(dev1), 90e18);
    }

    // ========== Curate ==========

    function test_CurateUpvote() public {
        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        vm.prank(curator);
        marketplace.curateCircuit(1, true);

        ICircuitMarketplace.Circuit memory c = marketplace.getCircuit(1);
        assertEq(c.curationScore, 1);
    }

    function test_CurateDownvote() public {
        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        // First upvote to have score > 0
        vm.prank(buyer1);
        marketplace.curateCircuit(1, true);

        // Then downvote
        vm.prank(curator);
        marketplace.curateCircuit(1, false);

        ICircuitMarketplace.Circuit memory c = marketplace.getCircuit(1);
        assertEq(c.curationScore, 0);
    }

    function test_CurateDownvoteFloorZero() public {
        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        vm.prank(curator);
        marketplace.curateCircuit(1, false);

        ICircuitMarketplace.Circuit memory c = marketplace.getCircuit(1);
        assertEq(c.curationScore, 0);
    }

    function test_CurateEmitsEvent() public {
        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        vm.expectEmit(true, true, false, true);
        emit ICircuitMarketplace.CircuitCurated(1, curator, true, 1);
        vm.prank(curator);
        marketplace.curateCircuit(1, true);
    }

    function test_RevertCurateAlreadyCurated() public {
        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        vm.prank(curator);
        marketplace.curateCircuit(1, true);

        vm.prank(curator);
        vm.expectRevert("CircuitMarketplace: already curated");
        marketplace.curateCircuit(1, false);
    }

    function test_RevertCurateNonExistentCircuit() public {
        vm.prank(curator);
        vm.expectRevert("CircuitMarketplace: circuit not found");
        marketplace.curateCircuit(999, true);
    }

    // ========== Update ==========

    function test_UpdateCircuit() public {
        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        vm.prank(dev1);
        marketplace.updateCircuit(1, "2.0.0", VERIFIER_HASH_V2);

        ICircuitMarketplace.Circuit memory c = marketplace.getCircuit(1);
        assertEq(c.version, "2.0.0");
        assertEq(c.verifierHash, VERIFIER_HASH_V2);
    }

    function test_RevertUpdateNotDeveloper() public {
        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        vm.prank(nobody);
        vm.expectRevert("CircuitMarketplace: not developer");
        marketplace.updateCircuit(1, "2.0.0", VERIFIER_HASH_V2);
    }

    // ========== Deactivate ==========

    function test_DeactivateByDeveloper() public {
        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        vm.prank(dev1);
        marketplace.deactivateCircuit(1);

        ICircuitMarketplace.Circuit memory c = marketplace.getCircuit(1);
        assertFalse(c.active);
    }

    function test_DeactivateByAdmin() public {
        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        // admin is address(this) which has DEFAULT_ADMIN_ROLE
        marketplace.deactivateCircuit(1);

        ICircuitMarketplace.Circuit memory c = marketplace.getCircuit(1);
        assertFalse(c.active);
    }

    function test_DeactivateEmitsEvent() public {
        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        vm.expectEmit(true, false, false, false);
        emit ICircuitMarketplace.CircuitDeactivated(1);
        vm.prank(dev1);
        marketplace.deactivateCircuit(1);
    }

    function test_RevertDeactivateUnauthorized() public {
        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        vm.prank(nobody);
        vm.expectRevert("CircuitMarketplace: unauthorized");
        marketplace.deactivateCircuit(1);
    }

    function test_RevertDeactivateAlreadyInactive() public {
        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        vm.prank(dev1);
        marketplace.deactivateCircuit(1);

        vm.prank(dev1);
        vm.expectRevert("CircuitMarketplace: already inactive");
        marketplace.deactivateCircuit(1);
    }

    // ========== Withdraw ==========

    function test_WithdrawEarnings() public {
        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        vm.prank(buyer1);
        marketplace.purchaseCircuit(1);

        uint256 devBefore = token.balanceOf(dev1);
        uint256 expectedEarnings = 95e18; // 100 - 5% fee

        vm.prank(dev1);
        marketplace.withdrawEarnings();

        assertEq(token.balanceOf(dev1), devBefore + expectedEarnings);
        assertEq(marketplace.developerBalance(dev1), 0);
    }

    function test_WithdrawEmitsEvent() public {
        vm.prank(dev1);
        marketplace.publishCircuit("ZK-Transfer", "1.0.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        vm.prank(buyer1);
        marketplace.purchaseCircuit(1);

        vm.expectEmit(true, false, false, true);
        emit ICircuitMarketplace.DeveloperWithdrawal(dev1, 95e18);
        vm.prank(dev1);
        marketplace.withdrawEarnings();
    }

    function test_RevertWithdrawZeroBalance() public {
        vm.prank(dev1);
        vm.expectRevert("CircuitMarketplace: zero balance");
        marketplace.withdrawEarnings();
    }

    // ========== List ==========

    function test_ListAllCircuits() public {
        vm.prank(dev1);
        marketplace.publishCircuit("Circuit-A", "1.0", VERIFIER_HASH, SOURCE_HASH, PRICE);
        vm.prank(dev2);
        marketplace.publishCircuit("Circuit-B", "1.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        ICircuitMarketplace.Circuit[] memory all = marketplace.listCircuits(false);
        assertEq(all.length, 2);
    }

    function test_ListActiveOnly() public {
        vm.prank(dev1);
        marketplace.publishCircuit("Circuit-A", "1.0", VERIFIER_HASH, SOURCE_HASH, PRICE);
        vm.prank(dev2);
        marketplace.publishCircuit("Circuit-B", "1.0", VERIFIER_HASH, SOURCE_HASH, PRICE);

        vm.prank(dev1);
        marketplace.deactivateCircuit(1);

        ICircuitMarketplace.Circuit[] memory active = marketplace.listCircuits(true);
        assertEq(active.length, 1);
        assertEq(active[0].name, "Circuit-B");

        ICircuitMarketplace.Circuit[] memory all = marketplace.listCircuits(false);
        assertEq(all.length, 2);
    }

    // ========== Set Platform Fee ==========

    function test_SetPlatformFee() public {
        marketplace.setPlatformFee(300);
        assertEq(marketplace.platformFeeBps(), 300);
    }

    function test_RevertSetPlatformFeeExceeds10Percent() public {
        vm.expectRevert("CircuitMarketplace: fee exceeds 10%");
        marketplace.setPlatformFee(1001);
    }

    function test_RevertSetPlatformFeeUnauthorized() public {
        vm.prank(nobody);
        vm.expectRevert();
        marketplace.setPlatformFee(300);
    }
}
