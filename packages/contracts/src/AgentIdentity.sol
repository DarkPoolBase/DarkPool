// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IAgentIdentity.sol";

/// @title AgentIdentity - On-chain identity registry for autonomous AI agents
/// @notice Agents register with ZK-proven capabilities, stake tokens, and build
/// verifiable reputation. Coinbase Verifications integration provides attestation.
contract AgentIdentity is IAgentIdentity, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant REPUTATION_ROLE = keccak256("REPUTATION_ROLE");
    bytes32 public constant TASK_RECORDER_ROLE = keccak256("TASK_RECORDER_ROLE");

    IERC20 public immutable stakingToken;
    uint256 public minimumStake;

    uint256 private _agentCount;
    mapping(uint256 => AgentMeta) private _agents;
    mapping(address => uint256) private _ownerToAgent;
    mapping(uint256 => mapping(bytes32 => bool)) private _capabilities;
    uint256[] private _agentIds;

    constructor(address _stakingToken, uint256 _minimumStake) {
        require(_stakingToken != address(0), "AgentIdentity: zero token");
        stakingToken = IERC20(_stakingToken);
        minimumStake = _minimumStake;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Register a new agent with ZK-proven capabilities
    /// @param capabilityHash Hash of the agent's capability set
    /// @param proof ZK proof of capability (placeholder verification)
    /// @return The newly assigned agent ID
    function registerAgent(bytes32 capabilityHash, bytes calldata proof) external returns (uint256) {
        require(capabilityHash != bytes32(0), "AgentIdentity: empty capability hash");
        require(proof.length > 0, "AgentIdentity: empty proof");
        require(_ownerToAgent[msg.sender] == 0, "AgentIdentity: already registered");

        _agentCount++;
        uint256 agentId = _agentCount;

        _agents[agentId] = AgentMeta({
            id: agentId,
            owner: msg.sender,
            capabilityHash: capabilityHash,
            reputationScore: 5000, // Start at 50%
            totalTasksCompleted: 0,
            totalEarned: 0,
            stakeAmount: 0,
            registeredAt: block.timestamp,
            active: true,
            verified: false
        });

        _ownerToAgent[msg.sender] = agentId;
        _agentIds.push(agentId);

        emit AgentRegistered(agentId, msg.sender, capabilityHash);
        return agentId;
    }

    /// @notice Verify an agent via Coinbase Verifications attestation
    /// @param agentId The agent to verify
    function verifyAgent(uint256 agentId) external onlyRole(VERIFIER_ROLE) {
        require(_agents[agentId].owner != address(0), "AgentIdentity: agent not found");
        require(!_agents[agentId].verified, "AgentIdentity: already verified");

        _agents[agentId].verified = true;
        emit AgentVerified(agentId, msg.sender);
    }

    /// @notice Check whether a capability has been proven for an agent
    /// @param agentId The agent to check
    /// @param capability The capability hash
    /// @return True if the capability is proven
    function verifyCapability(uint256 agentId, bytes32 capability) external view returns (bool) {
        return _capabilities[agentId][capability];
    }

    /// @notice Update an agent's reputation score
    /// @param agentId The agent to update
    /// @param newScore New reputation score (0-10000 basis points)
    /// @param proof ZK proof of reputation change
    function updateReputation(uint256 agentId, uint256 newScore, bytes calldata proof) external onlyRole(REPUTATION_ROLE) {
        require(_agents[agentId].owner != address(0), "AgentIdentity: agent not found");
        require(_agents[agentId].active, "AgentIdentity: agent not active");
        require(newScore <= 10000, "AgentIdentity: score exceeds max");
        require(proof.length > 0, "AgentIdentity: empty proof");

        uint256 oldScore = _agents[agentId].reputationScore;
        _agents[agentId].reputationScore = newScore;

        emit ReputationUpdated(agentId, oldScore, newScore);
    }

    /// @notice Record a completed task for an agent
    /// @param agentId The agent that completed the task
    /// @param taskHash Hash identifying the task
    /// @param reward Amount earned for the task
    function completeTask(uint256 agentId, bytes32 taskHash, uint256 reward) external onlyRole(TASK_RECORDER_ROLE) {
        require(_agents[agentId].owner != address(0), "AgentIdentity: agent not found");
        require(_agents[agentId].active, "AgentIdentity: agent not active");

        _agents[agentId].totalTasksCompleted++;
        _agents[agentId].totalEarned += reward;
        _capabilities[agentId][taskHash] = true;

        emit TaskCompleted(agentId, taskHash, reward);
    }

    /// @notice Revoke an agent (admin only)
    /// @param agentId The agent to revoke
    /// @param reason Human-readable reason for revocation
    function revokeAgent(uint256 agentId, string calldata reason) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_agents[agentId].owner != address(0), "AgentIdentity: agent not found");
        require(_agents[agentId].active, "AgentIdentity: agent not active");

        _agents[agentId].active = false;
        emit AgentRevoked(agentId, reason);
    }

    /// @notice Stake tokens on behalf of an agent (owner only)
    /// @param agentId The agent to stake for
    /// @param amount Amount of tokens to stake
    function stakeForAgent(uint256 agentId, uint256 amount) external nonReentrant {
        require(_agents[agentId].owner != address(0), "AgentIdentity: agent not found");
        require(msg.sender == _agents[agentId].owner, "AgentIdentity: not agent owner");
        require(amount > 0, "AgentIdentity: zero amount");

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        _agents[agentId].stakeAmount += amount;

        emit AgentStaked(agentId, amount);
    }

    /// @notice Get agent metadata by ID
    /// @param agentId The agent ID to look up
    /// @return The agent's metadata
    function getAgent(uint256 agentId) external view returns (AgentMeta memory) {
        require(_agents[agentId].owner != address(0), "AgentIdentity: agent not found");
        return _agents[agentId];
    }

    /// @notice Get agent metadata by owner address
    /// @param owner The owner address to look up
    /// @return The agent's metadata
    function getAgentByOwner(address owner) external view returns (AgentMeta memory) {
        uint256 agentId = _ownerToAgent[owner];
        require(agentId != 0, "AgentIdentity: no agent for owner");
        return _agents[agentId];
    }

    /// @notice List all active agents
    /// @return Array of active agent metadata
    function listActiveAgents() external view returns (AgentMeta[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < _agentIds.length; i++) {
            if (_agents[_agentIds[i]].active) {
                activeCount++;
            }
        }

        AgentMeta[] memory result = new AgentMeta[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < _agentIds.length; i++) {
            if (_agents[_agentIds[i]].active) {
                result[idx] = _agents[_agentIds[i]];
                idx++;
            }
        }
        return result;
    }

    /// @notice Get the total number of registered agents
    /// @return The agent count
    function agentCount() external view returns (uint256) {
        return _agentCount;
    }

    /// @notice Update the minimum stake requirement (admin only)
    /// @param newMinimumStake New minimum stake amount
    function setMinimumStake(uint256 newMinimumStake) external onlyRole(DEFAULT_ADMIN_ROLE) {
        minimumStake = newMinimumStake;
    }
}
