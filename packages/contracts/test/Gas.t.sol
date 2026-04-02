// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/DarkPool.sol";
import "../src/Escrow.sol";
import "../src/SettlementVerifier.sol";
import "../src/mocks/MockUSDC.sol";

contract GasTest is Test {
    DarkPool public darkPool;
    Escrow public escrow;
    MockUSDC public usdc;

    function setUp() public {
        usdc = new MockUSDC();
        escrow = new Escrow(address(usdc), address(0xFEE));
        SettlementVerifier verifier = new SettlementVerifier(address(this));
        darkPool = new DarkPool(address(escrow), address(verifier));
        escrow.grantRole(escrow.DARKPOOL_ROLE(), address(darkPool));
    }

    function test_gas_submitOrder() public {
        address user = address(0x1);
        usdc.mint(user, 10_000e6);
        vm.startPrank(user);
        usdc.approve(address(escrow), type(uint256).max);
        escrow.deposit(10_000e6);
        uint256 gasBefore = gasleft();
        darkPool.submitOrder(keccak256("order1"), 100e6);
        uint256 gasUsed = gasBefore - gasleft();
        vm.stopPrank();
        emit log_named_uint("submitOrder gas", gasUsed);
        assertTrue(gasUsed < 500_000);
    }

    function test_gas_cancelOrder() public {
        address user = address(0x1);
        usdc.mint(user, 10_000e6);
        vm.startPrank(user);
        usdc.approve(address(escrow), type(uint256).max);
        escrow.deposit(10_000e6);
        bytes32 orderId = darkPool.submitOrder(keccak256("order1"), 100e6);
        uint256 gasBefore = gasleft();
        darkPool.cancelOrder(orderId);
        uint256 gasUsed = gasBefore - gasleft();
        vm.stopPrank();
        emit log_named_uint("cancelOrder gas", gasUsed);
        assertTrue(gasUsed < 100_000);
    }
}

