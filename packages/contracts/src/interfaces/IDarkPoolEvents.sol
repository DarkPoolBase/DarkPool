// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDarkPoolEvents {
    event OrderSubmitted(bytes32 indexed orderId, address indexed trader, uint256 escrowAmount);
    event OrderCancelled(bytes32 indexed orderId, address indexed trader);
    event OrderExpired(bytes32 indexed orderId);
    event BatchSettled(uint256 indexed batchId, uint256 clearingPrice, uint256 matchedVolume, uint256 protocolFee);
    event OrderFilled(bytes32 indexed orderId, uint256 clearingPrice, uint256 batchId);
    event ProtocolFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);
    event EscrowUpdated(address indexed oldEscrow, address indexed newEscrow);
}

