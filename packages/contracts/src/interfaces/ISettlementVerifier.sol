// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISettlementVerifier {
    function verify(bytes32 settlementHash, bytes calldata proof) external view returns (bool);
}

