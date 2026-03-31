// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IDarkPool.sol";
import "./Escrow.sol";
import "./SettlementVerifier.sol";

/// @title DarkPool - Privacy-preserving GPU compute marketplace
/// @notice Main entry point for order submission and batch settlement on Base
contract DarkPool is IDarkPool, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    Escrow public immutable escrow;
    SettlementVerifier public immutable verifier;

    uint256 public currentBatchId;
    uint256 public orderCount;

    // Fee rate in basis points (e.g., 80 = 0.8%)
    uint256 public protocolFeeBps = 80;
    uint256 public constant MAX_FEE_BPS = 500; // 5% max
    uint256 public constant BPS_DENOMINATOR = 10000;

    mapping(bytes32 => Order) public orders;
    mapping(uint256 => bool) public batchSettled;

    constructor(address _escrow, address _verifier) {
        require(_escrow != address(0), "DarkPool: zero escrow");
        require(_verifier != address(0), "DarkPool: zero verifier");
        escrow = Escrow(_escrow);
        verifier = SettlementVerifier(_verifier);
        currentBatchId = 1;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Submit an encrypted order commitment with escrowed funds
    /// @param commitment The keccak256 hash of (gpuType, quantity, price, duration, side, secret)
    /// @param escrowAmount The USDC amount to lock in escrow for this order
    /// @return orderId The unique identifier for this order
    function submitOrder(
        bytes32 commitment,
        uint256 escrowAmount
    ) external nonReentrant whenNotPaused returns (bytes32 orderId) {
        require(commitment != bytes32(0), "DarkPool: empty commitment");
        require(escrowAmount > 0, "DarkPool: zero escrow");

        orderCount++;
        orderId = keccak256(
            abi.encodePacked(msg.sender, commitment, block.timestamp, orderCount)
        );

        require(orders[orderId].createdAt == 0, "DarkPool: order exists");

        orders[orderId] = Order({
            id: orderId,
            trader: msg.sender,
            side: OrderSide.BUY, // Side is hidden in the commitment
            escrowAmount: escrowAmount,
            status: OrderStatus.ACTIVE,
            batchId: 0,
            clearingPrice: 0,
            createdAt: block.timestamp
        });

        // Lock funds in escrow
        escrow.lockFunds(msg.sender, escrowAmount, orderId);

        emit OrderSubmitted(orderId, msg.sender, escrowAmount);
    }

    /// @notice Cancel an active order and unlock escrowed funds
    /// @param orderId The order to cancel
    function cancelOrder(bytes32 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.createdAt != 0, "DarkPool: order not found");
        require(order.trader == msg.sender, "DarkPool: not order owner");
        require(order.status == OrderStatus.ACTIVE, "DarkPool: order not active");

        order.status = OrderStatus.CANCELLED;

        // Unlock escrowed funds
        escrow.unlockFunds(msg.sender, order.escrowAmount, orderId);

        emit OrderCancelled(orderId, msg.sender);
    }

    /// @notice Settle a batch of matched orders. Called by the trusted relayer.
    /// @param settlement The batch settlement data with matched orders and clearing price
    /// @param proof The settlement proof (V1: relayer signature)
    function settleBatch(
        BatchSettlement calldata settlement,
        bytes calldata proof
    ) external onlyRole(RELAYER_ROLE) nonReentrant whenNotPaused {
        require(settlement.batchId == currentBatchId, "DarkPool: wrong batch ID");
        require(!batchSettled[settlement.batchId], "DarkPool: batch already settled");
        require(
            settlement.matchedBuyOrders.length == settlement.matchedSellOrders.length,
            "DarkPool: order count mismatch"
        );
        require(settlement.matchedBuyOrders.length > 0, "DarkPool: empty batch");

        // Verify the settlement proof
        bytes32 settlementHash = keccak256(
            abi.encode(
                settlement.batchId,
                settlement.matchedBuyOrders,
                settlement.matchedSellOrders,
                settlement.clearingPrice,
                settlement.matchedVolume
            )
        );
        require(verifier.verify(settlementHash, proof), "DarkPool: invalid proof");

        // Process each matched pair
        uint256 totalFees;
        for (uint256 i = 0; i < settlement.matchedBuyOrders.length; i++) {
            bytes32 buyOrderId = settlement.matchedBuyOrders[i];
            bytes32 sellOrderId = settlement.matchedSellOrders[i];

            Order storage buyOrder = orders[buyOrderId];
            Order storage sellOrder = orders[sellOrderId];

            require(buyOrder.status == OrderStatus.ACTIVE, "DarkPool: buy order not active");
            require(sellOrder.status == OrderStatus.ACTIVE, "DarkPool: sell order not active");

            // Calculate fee
            uint256 tradeValue = settlement.clearingPrice;
            uint256 fee = (tradeValue * protocolFeeBps) / BPS_DENOMINATOR;
            totalFees += fee;

            // Release funds: buyer pays seller at clearing price minus fee
            escrow.releaseFunds(
                buyOrder.trader,
                sellOrder.trader,
                tradeValue - fee,
                fee
            );

            // Refund excess escrow to buyer if they deposited more than clearing price
            if (buyOrder.escrowAmount > tradeValue) {
                uint256 refund = buyOrder.escrowAmount - tradeValue;
                escrow.unlockFunds(buyOrder.trader, refund, buyOrderId);
            }

            // Update order statuses
            buyOrder.status = OrderStatus.FILLED;
            buyOrder.batchId = settlement.batchId;
            buyOrder.clearingPrice = settlement.clearingPrice;

            sellOrder.status = OrderStatus.FILLED;
            sellOrder.batchId = settlement.batchId;
            sellOrder.clearingPrice = settlement.clearingPrice;

            emit OrderFilled(buyOrderId, settlement.clearingPrice, settlement.batchId);
            emit OrderFilled(sellOrderId, settlement.clearingPrice, settlement.batchId);
        }

        batchSettled[settlement.batchId] = true;
        currentBatchId++;

        emit BatchSettled(
            settlement.batchId,
            settlement.clearingPrice,
            settlement.matchedVolume,
            totalFees
        );
    }

    /// @notice Get order details
    function getOrder(bytes32 orderId) external view returns (Order memory) {
        require(orders[orderId].createdAt != 0, "DarkPool: order not found");
        return orders[orderId];
    }

    /// @notice Get current batch ID
    function getCurrentBatchId() external view returns (uint256) {
        return currentBatchId;
    }

    /// @notice Update protocol fee (admin only)
    function setProtocolFee(uint256 _feeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeBps <= MAX_FEE_BPS, "DarkPool: fee too high");
        protocolFeeBps = _feeBps;
    }

    /// @notice Pause the contract in case of emergency
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpause the contract
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
// Settlement batch size optimization
