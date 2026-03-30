// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAgentCredit {
    struct CreditProfile {
        uint256 agentId;
        uint256 creditScore;         // 0-1000 (like FICO scaled down)
        uint256 totalTransactions;
        uint256 successfulTransactions;
        uint256 failedTransactions;
        uint256 creditLimit;         // Max tx value in USDC (6 decimals)
        uint256 totalVolume;         // Cumulative tx volume
        uint256 lastUpdated;
        bool active;
    }

    event CreditProfileCreated(uint256 indexed agentId, uint256 initialScore);
    event TransactionRecorded(uint256 indexed agentId, bytes32 txHash, bool success, uint256 amount);
    event CreditScoreUpdated(uint256 indexed agentId, uint256 oldScore, uint256 newScore);
    event CreditLimitUpdated(uint256 indexed agentId, uint256 oldLimit, uint256 newLimit);
    event MinScoreProven(uint256 indexed agentId, uint256 threshold, bool passed);

    function createProfile(uint256 agentId) external;
    function recordTransaction(uint256 agentId, bytes32 txHash, bool success, uint256 amount) external;
    function getScore(uint256 agentId) external view returns (uint256);
    function proveMinScore(uint256 agentId, uint256 threshold, bytes calldata proof) external returns (bool);
    function getCreditLimit(uint256 agentId) external view returns (uint256);
    function getProfile(uint256 agentId) external view returns (CreditProfile memory);
    function isAboveThreshold(uint256 agentId, uint256 threshold) external view returns (bool);
}
