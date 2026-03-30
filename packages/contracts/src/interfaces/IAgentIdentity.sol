// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAgentIdentity {
    struct AgentMeta {
        uint256 id;
        address owner;
        bytes32 capabilityHash;     // Hash of agent capabilities (ZK-proven)
        uint256 reputationScore;    // 0-10000 basis points (100.00%)
        uint256 totalTasksCompleted;
        uint256 totalEarned;
        uint256 stakeAmount;
        uint256 registeredAt;
        bool active;
        bool verified;              // Coinbase Verifications attestation
    }

    event AgentRegistered(uint256 indexed agentId, address indexed owner, bytes32 capabilityHash);
    event AgentVerified(uint256 indexed agentId, address indexed verifier);
    event CapabilityVerified(uint256 indexed agentId, bytes32 capability);
    event ReputationUpdated(uint256 indexed agentId, uint256 oldScore, uint256 newScore);
    event AgentRevoked(uint256 indexed agentId, string reason);
    event AgentStaked(uint256 indexed agentId, uint256 amount);
    event TaskCompleted(uint256 indexed agentId, bytes32 taskHash, uint256 reward);

    function registerAgent(bytes32 capabilityHash, bytes calldata proof) external returns (uint256);
    function verifyAgent(uint256 agentId) external;
    function verifyCapability(uint256 agentId, bytes32 capability) external view returns (bool);
    function updateReputation(uint256 agentId, uint256 newScore, bytes calldata proof) external;
    function completeTask(uint256 agentId, bytes32 taskHash, uint256 reward) external;
    function revokeAgent(uint256 agentId, string calldata reason) external;
    function stakeForAgent(uint256 agentId, uint256 amount) external;
    function getAgent(uint256 agentId) external view returns (AgentMeta memory);
    function getAgentByOwner(address owner) external view returns (AgentMeta memory);
    function listActiveAgents() external view returns (AgentMeta[] memory);
    function agentCount() external view returns (uint256);
}
