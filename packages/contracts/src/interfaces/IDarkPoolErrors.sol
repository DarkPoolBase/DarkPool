// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDarkPoolErrors {
    error EmptyCommitment();
    error ZeroEscrowAmount();
    error OrderNotFound(bytes32 orderId);
    error NotOrderOwner(bytes32 orderId, address caller);
    error OrderNotActive(bytes32 orderId);
    error WrongBatchId(uint256 expected, uint256 received);
    error BatchAlreadySettled(uint256 batchId);
    error OrderCountMismatch();
    error EmptyBatch();
    error InvalidProof();
    error InsufficientBalance(address user, uint256 available, uint256 required);
    error FeeTooHigh(uint256 feeBps, uint256 maxFeeBps);
}

