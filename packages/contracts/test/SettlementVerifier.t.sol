// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SettlementVerifier.sol";

contract SettlementVerifierTest is Test {
    SettlementVerifier public verifier;
    uint256 public relayerKey = 0xBEEF;
    address public relayer;

    function setUp() public {
        relayer = vm.addr(relayerKey);
        verifier = new SettlementVerifier(relayer);
    }

    function test_constructor_setsRelayer() public view {
        assertEq(verifier.trustedRelayer(), relayer);
    }

    function test_constructor_zeroAddress_reverts() public {
        vm.expectRevert("Verifier: zero relayer");
        new SettlementVerifier(address(0));
    }

    function testFuzz_verify_validSignature(bytes32 dataHash) public view {
        bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(dataHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(relayerKey, ethHash);
        assertTrue(verifier.verify(dataHash, abi.encodePacked(r, s, v)));
    }

    function testFuzz_verify_wrongKey(uint256 wrongKey, bytes32 dataHash) public view {
        wrongKey = bound(wrongKey, 1, type(uint128).max);
        vm.assume(wrongKey != relayerKey);
        bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(dataHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, ethHash);
        assertFalse(verifier.verify(dataHash, abi.encodePacked(r, s, v)));
    }

    function test_setRelayer_onlyOwner() public {
        address newRelayer = address(0x999);
        verifier.setTrustedRelayer(newRelayer);
        assertEq(verifier.trustedRelayer(), newRelayer);
    }

    function test_setRelayer_nonOwner_reverts() public {
        vm.prank(address(0xBAD));
        vm.expectRevert();
        verifier.setTrustedRelayer(address(0x999));
    }

    function test_setRelayer_emitsEvent() public {
        address newRelayer = address(0x999);
        vm.expectEmit(true, true, false, false);
        emit SettlementVerifier.RelayerUpdated(relayer, newRelayer);
        verifier.setTrustedRelayer(newRelayer);
    }
}

