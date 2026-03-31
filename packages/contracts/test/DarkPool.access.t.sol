// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/DarkPool.sol";
import "../src/Escrow.sol";
import "../src/SettlementVerifier.sol";
import "../src/mocks/MockUSDC.sol";

contract DarkPoolAccessTest is Test {
    DarkPool public darkPool;
    Escrow public escrow;

    function setUp() public {
        MockUSDC usdc = new MockUSDC();
        escrow = new Escrow(address(usdc), address(0xFEE));
        SettlementVerifier verifier = new SettlementVerifier(address(this));
        darkPool = new DarkPool(address(escrow), address(verifier));
        escrow.grantRole(escrow.DARKPOOL_ROLE(), address(darkPool));
    }

    function test_onlyAdmin_canSetFee() public {
        vm.prank(address(0xBAD));
        vm.expectRevert();
        darkPool.setProtocolFee(100);
    }

    function test_onlyAdmin_canPause() public {
        vm.prank(address(0xBAD));
        vm.expectRevert();
        darkPool.pause();
    }

    function test_onlyRelayer_canSettle() public {
        bytes32[] memory empty = new bytes32[](0);
        IDarkPool.BatchSettlement memory s = IDarkPool.BatchSettlement(1, empty, empty, 0, 0, 0);
        vm.prank(address(0xBAD));
        vm.expectRevert();
        darkPool.settleBatch(s, "");
    }

    function test_admin_role_is_deployer() public view {
        assertTrue(darkPool.hasRole(darkPool.DEFAULT_ADMIN_ROLE(), address(this)));
    }
}

