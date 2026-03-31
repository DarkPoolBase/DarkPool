// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Escrow.sol";
import "../src/mocks/MockUSDC.sol";

contract EscrowTest is Test {
    Escrow public escrow;
    MockUSDC public usdc;
    address public admin = address(this);
    address public darkPool = address(0xD9);
    address public feeCollector = address(0xFEE);
    address public user1 = address(0x1);
    address public user2 = address(0x2);

    function setUp() public {
        usdc = new MockUSDC();
        escrow = new Escrow(address(usdc), feeCollector);
        escrow.grantRole(escrow.DARKPOOL_ROLE(), darkPool);
        usdc.mint(user1, 10_000e6);
        usdc.mint(user2, 10_000e6);
        vm.prank(user1);
        usdc.approve(address(escrow), type(uint256).max);
        vm.prank(user2);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function test_deposit_emitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit IEscrow.Deposited(user1, 1000e6);
        vm.prank(user1);
        escrow.deposit(1000e6);
    }

    function test_deposit_zeroAmount_reverts() public {
        vm.prank(user1);
        vm.expectRevert("Escrow: zero amount");
        escrow.deposit(0);
    }

    function test_multipleDeposits() public {
        vm.startPrank(user1);
        escrow.deposit(1000e6);
        escrow.deposit(2000e6);
        vm.stopPrank();
        (uint256 avail,) = escrow.getBalance(user1);
        assertEq(avail, 3000e6);
    }

    function test_lockFunds_unauthorized_reverts() public {
        vm.prank(user1);
        escrow.deposit(1000e6);
        vm.prank(user1);
        vm.expectRevert();
        escrow.lockFunds(user1, 500e6, bytes32(uint256(1)));
    }

    function testFuzz_deposit(uint256 amount) public {
        amount = bound(amount, 1, 10_000e6);
        vm.prank(user1);
        escrow.deposit(amount);
        (uint256 avail,) = escrow.getBalance(user1);
        assertEq(avail, amount);
    }

    function test_setFeeCollector() public {
        address newCollector = address(0x1234);
        escrow.setFeeCollector(newCollector);
        assertEq(escrow.feeCollector(), newCollector);
    }

    function test_setFeeCollector_zeroAddress_reverts() public {
        vm.expectRevert("Escrow: zero fee collector");
        escrow.setFeeCollector(address(0));
    }

    function test_pause_blocks_deposit() public {
        escrow.pause();
        vm.prank(user1);
        vm.expectRevert();
        escrow.deposit(1000e6);
    }

    function test_unpause_allows_deposit() public {
        escrow.pause();
        escrow.unpause();
        vm.prank(user1);
        escrow.deposit(1000e6);
        (uint256 avail,) = escrow.getBalance(user1);
        assertEq(avail, 1000e6);
    }
}

