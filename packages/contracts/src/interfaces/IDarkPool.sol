// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDarkPool {
    enum OrderSide { BUY, SELL }
    enum OrderStatus { PENDING, ACTIVE, FILLED, CANCELLED, EXPIRED }

    struct Order {
        bytes32 id;
        address trader;
        OrderSide side;
        uint256 escrowAmount;
        OrderStatus status;
        uint256 batchId;
        uint256 clearingPrice;
        uint256 createdAt;
    }

    struct BatchSettlement {
        uint256 batchId;
        bytes32[] matchedBuyOrders;
        bytes32[] matchedSellOrders;
        uint256 clearingPrice;
        uint256 matchedVolume;
        uint256 protocolFee;
    }

    event OrderSubmitted(bytes32 indexed orderId, address indexed trader, uint256 escrowAmount);
    event OrderCancelled(bytes32 indexed orderId, address indexed trader);
    event BatchSettled(
        uint256 indexed batchId,
        uint256 clearingPrice,
        uint256 matchedVolume,
        uint256 protocolFee
    );
    event OrderFilled(bytes32 indexed orderId, uint256 clearingPrice, uint256 batchId);
}
// V2 upgrade path documented
