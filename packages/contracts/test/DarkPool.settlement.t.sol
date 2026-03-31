// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/DarkPool.sol";
import "../src/Escrow.sol";
import "../src/SettlementVerifier.sol";
import "../src/mocks/MockUSDC.sol";
import "../src/interfaces/IDarkPool.sol";

contract DarkPoolSettlementTest is Test {
    DarkPool public darkPool;
    Escrow public escrow;
    SettlementVerifier public verifier;
    MockUSDC public usdc;
    uint256 relayerKey = 0xBEEF;
    address relayer;
    address feeCollector = address(0xFEE);

    function setUp() public {
        relayer = vm.addr(relayerKey);
        usdc = new MockUSDC();
        escrow = new Escrow(address(usdc), feeCollector);
        verifier = new SettlementVerifier(relayer);
        darkPool = new DarkPool(address(escrow), address(verifier));
        escrow.grantRole(escrow.DARKPOOL_ROLE(), address(darkPool));
        darkPool.grantRole(darkPool.RELAYER_ROLE(), relayer);
    }

    function _fundAndDeposit(address user, uint256 amount) internal {
        usdc.mint(user, amount);
        vm.startPrank(user);
        usdc.approve(address(escrow), amount);
        escrow.deposit(amount);
        vm.stopPrank();
    }

    function _signSettlement(IDarkPool.BatchSettlement memory s) internal view returns (bytes memory) {
        bytes32 hash = keccak256(abi.encode(s.batchId, s.matchedBuyOrders, s.matchedSellOrders, s.clearingPrice, s.matchedVolume));
        bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(hash);
        (uint8 v, bytes32 r, bytes32 ss) = vm.sign(relayerKey, ethHash);
        return abi.encodePacked(r, ss, v);
    }

    function test_settlement_updates_balances() public {
        address buyer = address(0x1);
        address seller = address(0x2);
        _fundAndDeposit(buyer, 1000e6);
        _fundAndDeposit(seller, 1000e6);

        vm.prank(buyer);
        bytes32 buyId = darkPool.submitOrder(keccak256("buy"), 500e6);
        vm.prank(seller);
        bytes32 sellId = darkPool.submitOrder(keccak256("sell"), 500e6);

        bytes32[] memory buys = new bytes32[](1);
        buys[0] = buyId;
        bytes32[] memory sells = new bytes32[](1);
        sells[0] = sellId;

        IDarkPool.BatchSettlement memory settlement = IDarkPool.BatchSettlement(1, buys, sells, 400e6, 400e6, 0);
        bytes memory proof = _signSettlement(settlement);

        vm.prank(relayer);
        darkPool.settleBatch(settlement, proof);

        // Buyer: 1000 deposited, 500 locked, 400 used (+ fee), 100 refunded
        (uint256 buyerAvail,) = escrow.getBalance(buyer);
        assertTrue(buyerAvail > 500e6); // Got refund of excess escrow
    }

    function test_settlement_sends_fee_to_collector() public {
        address buyer = address(0x1);
        address seller = address(0x2);
        _fundAndDeposit(buyer, 1000e6);
        _fundAndDeposit(seller, 1000e6);

        vm.prank(buyer);
        bytes32 buyId = darkPool.submitOrder(keccak256("buy"), 500e6);
        vm.prank(seller);
        bytes32 sellId = darkPool.submitOrder(keccak256("sell"), 500e6);

        bytes32[] memory buys = new bytes32[](1);
        buys[0] = buyId;
        bytes32[] memory sells = new bytes32[](1);
        sells[0] = sellId;

        IDarkPool.BatchSettlement memory settlement = IDarkPool.BatchSettlement(1, buys, sells, 400e6, 400e6, 0);
        bytes memory proof = _signSettlement(settlement);

        uint256 feeCollectorBefore = usdc.balanceOf(feeCollector);
        vm.prank(relayer);
        darkPool.settleBatch(settlement, proof);
        uint256 feeCollectorAfter = usdc.balanceOf(feeCollector);

        assertTrue(feeCollectorAfter > feeCollectorBefore);
    }

    function test_double_settlement_reverts() public {
        address buyer = address(0x1);
        address seller = address(0x2);
        _fundAndDeposit(buyer, 1000e6);
        _fundAndDeposit(seller, 1000e6);

        vm.prank(buyer);
        bytes32 buyId = darkPool.submitOrder(keccak256("buy"), 500e6);
        vm.prank(seller);
        bytes32 sellId = darkPool.submitOrder(keccak256("sell"), 500e6);

        bytes32[] memory buys = new bytes32[](1);
        buys[0] = buyId;
        bytes32[] memory sells = new bytes32[](1);
        sells[0] = sellId;

        IDarkPool.BatchSettlement memory settlement = IDarkPool.BatchSettlement(1, buys, sells, 400e6, 400e6, 0);
        bytes memory proof = _signSettlement(settlement);

        vm.prank(relayer);
        darkPool.settleBatch(settlement, proof);

        vm.prank(relayer);
        vm.expectRevert("DarkPool: wrong batch ID");
        darkPool.settleBatch(settlement, proof);
    }
}

