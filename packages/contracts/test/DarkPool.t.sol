// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/DarkPool.sol";
import "../src/Escrow.sol";
import "../src/SettlementVerifier.sol";
import "../src/mocks/MockUSDC.sol";
import "../src/interfaces/IDarkPool.sol";

contract DarkPoolTest is Test {
    DarkPool public darkPool;
    Escrow public escrow;
    SettlementVerifier public verifier;
    MockUSDC public usdc;

    address public admin = address(this);
    address public relayer;
    uint256 public relayerPrivateKey = 0xBEEF;
    address public feeCollector = address(0xFEE);
    address public buyer = address(0x1);
    address public seller = address(0x2);

    uint256 constant INITIAL_BALANCE = 10_000e6; // 10,000 USDC

    function setUp() public {
        relayer = vm.addr(relayerPrivateKey);

        // Deploy contracts
        usdc = new MockUSDC();
        escrow = new Escrow(address(usdc), feeCollector);
        verifier = new SettlementVerifier(relayer);
        darkPool = new DarkPool(address(escrow), address(verifier));

        // Configure roles
        escrow.grantRole(escrow.DARKPOOL_ROLE(), address(darkPool));
        darkPool.grantRole(darkPool.RELAYER_ROLE(), relayer);

        // Fund test accounts
        usdc.mint(buyer, INITIAL_BALANCE);
        usdc.mint(seller, INITIAL_BALANCE);

        // Approve escrow to spend USDC
        vm.prank(buyer);
        usdc.approve(address(escrow), type(uint256).max);
        vm.prank(seller);
        usdc.approve(address(escrow), type(uint256).max);

        // Deposit USDC into escrow
        vm.prank(buyer);
        escrow.deposit(5_000e6);
        vm.prank(seller);
        escrow.deposit(5_000e6);
    }

    // ============ Escrow Tests ============

    function test_deposit() public {
        (uint256 available, uint256 locked) = escrow.getBalance(buyer);
        assertEq(available, 5_000e6);
        assertEq(locked, 0);
    }

    function test_withdraw() public {
        vm.prank(buyer);
        escrow.withdraw(1_000e6);
        (uint256 available,) = escrow.getBalance(buyer);
        assertEq(available, 4_000e6);
    }

    function test_withdraw_insufficient() public {
        vm.prank(buyer);
        vm.expectRevert("Escrow: insufficient available balance");
        escrow.withdraw(6_000e6);
    }

    // ============ Order Submission Tests ============

    function test_submitOrder() public {
        bytes32 commitment = keccak256("test_order");
        vm.prank(buyer);
        bytes32 orderId = darkPool.submitOrder(commitment, 100e6);

        IDarkPool.Order memory order = darkPool.getOrder(orderId);
        assertEq(order.trader, buyer);
        assertEq(order.escrowAmount, 100e6);
        assertTrue(order.status == IDarkPool.OrderStatus.ACTIVE);

        // Check escrow locked the funds
        (uint256 available, uint256 locked) = escrow.getBalance(buyer);
        assertEq(available, 4_900e6);
        assertEq(locked, 100e6);
    }

    function test_submitOrder_zeroCommitment_reverts() public {
        vm.prank(buyer);
        vm.expectRevert("DarkPool: empty commitment");
        darkPool.submitOrder(bytes32(0), 100e6);
    }

    function test_submitOrder_zeroEscrow_reverts() public {
        vm.prank(buyer);
        vm.expectRevert("DarkPool: zero escrow");
        darkPool.submitOrder(keccak256("test"), 0);
    }

    function test_submitOrder_insufficientBalance_reverts() public {
        vm.prank(buyer);
        vm.expectRevert("Escrow: insufficient available balance");
        darkPool.submitOrder(keccak256("test"), 6_000e6);
    }

    // ============ Cancel Order Tests ============

    function test_cancelOrder() public {
        bytes32 commitment = keccak256("cancel_test");
        vm.prank(buyer);
        bytes32 orderId = darkPool.submitOrder(commitment, 200e6);

        vm.prank(buyer);
        darkPool.cancelOrder(orderId);

        IDarkPool.Order memory order = darkPool.getOrder(orderId);
        assertTrue(order.status == IDarkPool.OrderStatus.CANCELLED);

        // Check funds were unlocked
        (uint256 available, uint256 locked) = escrow.getBalance(buyer);
        assertEq(available, 5_000e6);
        assertEq(locked, 0);
    }

    function test_cancelOrder_notOwner_reverts() public {
        vm.prank(buyer);
        bytes32 orderId = darkPool.submitOrder(keccak256("test"), 100e6);

        vm.prank(seller);
        vm.expectRevert("DarkPool: not order owner");
        darkPool.cancelOrder(orderId);
    }

    function test_cancelOrder_alreadyCancelled_reverts() public {
        vm.prank(buyer);
        bytes32 orderId = darkPool.submitOrder(keccak256("test"), 100e6);

        vm.prank(buyer);
        darkPool.cancelOrder(orderId);

        vm.prank(buyer);
        vm.expectRevert("DarkPool: order not active");
        darkPool.cancelOrder(orderId);
    }

    // ============ Settlement Tests ============

    function test_settleBatch() public {
        // Submit buy and sell orders
        vm.prank(buyer);
        bytes32 buyOrderId = darkPool.submitOrder(keccak256("buy_order"), 500e6);

        vm.prank(seller);
        bytes32 sellOrderId = darkPool.submitOrder(keccak256("sell_order"), 500e6);

        // Create settlement
        bytes32[] memory buyOrders = new bytes32[](1);
        buyOrders[0] = buyOrderId;
        bytes32[] memory sellOrders = new bytes32[](1);
        sellOrders[0] = sellOrderId;

        uint256 clearingPrice = 400e6;
        uint256 matchedVolume = 400e6;

        IDarkPool.BatchSettlement memory settlement = IDarkPool.BatchSettlement({
            batchId: 1,
            matchedBuyOrders: buyOrders,
            matchedSellOrders: sellOrders,
            clearingPrice: clearingPrice,
            matchedVolume: matchedVolume,
            protocolFee: 0 // Will be calculated by contract
        });

        // Sign the settlement hash as the relayer
        bytes32 settlementHash = keccak256(
            abi.encode(
                settlement.batchId,
                settlement.matchedBuyOrders,
                settlement.matchedSellOrders,
                settlement.clearingPrice,
                settlement.matchedVolume
            )
        );
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(settlementHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(relayerPrivateKey, ethSignedHash);
        bytes memory proof = abi.encodePacked(r, s, v);

        // Settle the batch
        vm.prank(relayer);
        darkPool.settleBatch(settlement, proof);

        // Verify orders are filled
        IDarkPool.Order memory buyOrder = darkPool.getOrder(buyOrderId);
        assertTrue(buyOrder.status == IDarkPool.OrderStatus.FILLED);
        assertEq(buyOrder.clearingPrice, clearingPrice);
        assertEq(buyOrder.batchId, 1);

        IDarkPool.Order memory sellOrder = darkPool.getOrder(sellOrderId);
        assertTrue(sellOrder.status == IDarkPool.OrderStatus.FILLED);

        // Verify batch ID incremented
        assertEq(darkPool.getCurrentBatchId(), 2);
    }

    function test_settleBatch_invalidProof_reverts() public {
        vm.prank(buyer);
        bytes32 buyOrderId = darkPool.submitOrder(keccak256("buy"), 500e6);
        vm.prank(seller);
        bytes32 sellOrderId = darkPool.submitOrder(keccak256("sell"), 500e6);

        bytes32[] memory buyOrders = new bytes32[](1);
        buyOrders[0] = buyOrderId;
        bytes32[] memory sellOrders = new bytes32[](1);
        sellOrders[0] = sellOrderId;

        IDarkPool.BatchSettlement memory settlement = IDarkPool.BatchSettlement({
            batchId: 1,
            matchedBuyOrders: buyOrders,
            matchedSellOrders: sellOrders,
            clearingPrice: 400e6,
            matchedVolume: 400e6,
            protocolFee: 0
        });

        // Use a fake proof (wrong private key)
        bytes32 settlementHash = keccak256(
            abi.encode(1, buyOrders, sellOrders, uint256(400e6), uint256(400e6))
        );
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(settlementHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(0xDEAD, ethSignedHash); // Wrong key
        bytes memory badProof = abi.encodePacked(r, s, v);

        vm.prank(relayer);
        vm.expectRevert("DarkPool: invalid proof");
        darkPool.settleBatch(settlement, badProof);
    }

    function test_settleBatch_wrongBatchId_reverts() public {
        vm.prank(buyer);
        bytes32 buyOrderId = darkPool.submitOrder(keccak256("buy"), 500e6);
        vm.prank(seller);
        bytes32 sellOrderId = darkPool.submitOrder(keccak256("sell"), 500e6);

        bytes32[] memory buyOrders = new bytes32[](1);
        buyOrders[0] = buyOrderId;
        bytes32[] memory sellOrders = new bytes32[](1);
        sellOrders[0] = sellOrderId;

        IDarkPool.BatchSettlement memory settlement = IDarkPool.BatchSettlement({
            batchId: 999, // Wrong batch ID
            matchedBuyOrders: buyOrders,
            matchedSellOrders: sellOrders,
            clearingPrice: 400e6,
            matchedVolume: 400e6,
            protocolFee: 0
        });

        vm.prank(relayer);
        vm.expectRevert("DarkPool: wrong batch ID");
        darkPool.settleBatch(settlement, "");
    }

    // ============ Admin Tests ============

    function test_setProtocolFee() public {
        darkPool.setProtocolFee(100); // 1%
        assertEq(darkPool.protocolFeeBps(), 100);
    }

    function test_setProtocolFee_tooHigh_reverts() public {
        vm.expectRevert("DarkPool: fee too high");
        darkPool.setProtocolFee(600); // 6% > 5% max
    }

    function test_pause() public {
        darkPool.pause();
        vm.prank(buyer);
        vm.expectRevert();
        darkPool.submitOrder(keccak256("test"), 100e6);
    }

    // ============ Verifier Tests ============

    function test_verifier_validSignature() public view {
        bytes32 testHash = keccak256("test_data");
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(testHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(relayerPrivateKey, ethSignedHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        assertTrue(verifier.verify(testHash, sig));
    }

    function test_verifier_invalidSignature() public view {
        bytes32 testHash = keccak256("test_data");
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(testHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(0xDEAD, ethSignedHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        assertFalse(verifier.verify(testHash, sig));
    }

    function test_verifier_updateRelayer() public {
        address newRelayer = address(0x999);
        verifier.setTrustedRelayer(newRelayer);
        assertEq(verifier.trustedRelayer(), newRelayer);
    }
}
