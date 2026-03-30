// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IAgentCredit.sol";

/// @title AgentCredit - On-chain credit scoring for autonomous agents
/// @notice Tracks transaction history and computes credit scores and tiered
/// credit limits for agents operating in the Agentic Dark Pool.
contract AgentCredit is IAgentCredit, AccessControl, ReentrancyGuard {
    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");
    bytes32 public constant SCORE_UPDATER_ROLE = keccak256("SCORE_UPDATER_ROLE");

    mapping(uint256 => CreditProfile) private _profiles;

    uint256 public defaultCreditLimit;
    uint256 public maxCreditLimit;

    uint256 public constant SCORE_THRESHOLD_LOW = 300;
    uint256 public constant SCORE_THRESHOLD_MED = 500;
    uint256 public constant SCORE_THRESHOLD_HIGH = 700;
    uint256 public constant SCORE_THRESHOLD_PREMIUM = 900;

    constructor() {
        defaultCreditLimit = 1000e6;
        maxCreditLimit = 1_000_000e6;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ========== Profile Management ==========

    /// @notice Create a new credit profile for an agent
    function createProfile(uint256 agentId) external {
        require(agentId > 0, "AgentCredit: zero agentId");
        require(_profiles[agentId].agentId == 0, "AgentCredit: profile exists");

        _profiles[agentId] = CreditProfile({
            agentId: agentId,
            creditScore: 500,
            totalTransactions: 0,
            successfulTransactions: 0,
            failedTransactions: 0,
            creditLimit: defaultCreditLimit,
            totalVolume: 0,
            lastUpdated: block.timestamp,
            active: true
        });

        emit CreditProfileCreated(agentId, 500);
    }

    // ========== Transaction Recording ==========

    /// @notice Record a transaction outcome for an agent
    function recordTransaction(
        uint256 agentId,
        bytes32 txHash,
        bool success,
        uint256 amount
    ) external onlyRole(RECORDER_ROLE) {
        CreditProfile storage profile = _profiles[agentId];
        require(profile.agentId != 0, "AgentCredit: profile not found");
        require(profile.active, "AgentCredit: profile inactive");
        require(txHash != bytes32(0), "AgentCredit: zero txHash");
        require(amount > 0, "AgentCredit: zero amount");

        profile.totalTransactions += 1;

        if (success) {
            profile.successfulTransactions += 1;
            profile.totalVolume += amount;
        } else {
            profile.failedTransactions += 1;
        }

        _recalculateScore(agentId);
        _updateCreditLimit(agentId);

        profile.lastUpdated = block.timestamp;

        emit TransactionRecorded(agentId, txHash, success, amount);
    }

    // ========== Views ==========

    /// @notice Get the credit score for an agent
    function getScore(uint256 agentId) external view returns (uint256) {
        require(_profiles[agentId].agentId != 0, "AgentCredit: profile not found");
        return _profiles[agentId].creditScore;
    }

    /// @notice Prove an agent meets a minimum credit score (placeholder ZK)
    function proveMinScore(
        uint256 agentId,
        uint256 threshold,
        bytes calldata proof
    ) external returns (bool) {
        require(_profiles[agentId].agentId != 0, "AgentCredit: profile not found");
        require(proof.length > 0, "AgentCredit: empty proof");

        bool passed = _profiles[agentId].creditScore >= threshold;

        emit MinScoreProven(agentId, threshold, passed);

        return passed;
    }

    /// @notice Get the credit limit for an agent
    function getCreditLimit(uint256 agentId) external view returns (uint256) {
        require(_profiles[agentId].agentId != 0, "AgentCredit: profile not found");
        return _profiles[agentId].creditLimit;
    }

    /// @notice Get the full credit profile for an agent
    function getProfile(uint256 agentId) external view returns (CreditProfile memory) {
        require(_profiles[agentId].agentId != 0, "AgentCredit: profile not found");
        return _profiles[agentId];
    }

    /// @notice Check if an agent's score is at or above a threshold
    function isAboveThreshold(uint256 agentId, uint256 threshold) external view returns (bool) {
        return _profiles[agentId].creditScore >= threshold;
    }

    // ========== Admin ==========

    /// @notice Update the default credit limit for new profiles
    function setDefaultCreditLimit(uint256 newLimit) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newLimit > 0, "AgentCredit: zero limit");
        defaultCreditLimit = newLimit;
    }

    /// @notice Update the maximum credit limit
    function setMaxCreditLimit(uint256 newLimit) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newLimit > 0, "AgentCredit: zero limit");
        maxCreditLimit = newLimit;
    }

    /// @notice Deactivate an agent's credit profile
    function deactivateProfile(uint256 agentId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_profiles[agentId].agentId != 0, "AgentCredit: profile not found");
        require(_profiles[agentId].active, "AgentCredit: already inactive");
        _profiles[agentId].active = false;
    }

    // ========== Internal ==========

    /// @dev Recalculate credit score based on success rate
    function _recalculateScore(uint256 agentId) internal {
        CreditProfile storage profile = _profiles[agentId];
        uint256 oldScore = profile.creditScore;

        uint256 newScore = (profile.successfulTransactions * 1000) / profile.totalTransactions;
        if (newScore > 1000) {
            newScore = 1000;
        }

        profile.creditScore = newScore;

        if (oldScore != newScore) {
            emit CreditScoreUpdated(agentId, oldScore, newScore);
        }
    }

    /// @dev Update credit limit based on score tiers
    function _updateCreditLimit(uint256 agentId) internal {
        CreditProfile storage profile = _profiles[agentId];
        uint256 oldLimit = profile.creditLimit;
        uint256 score = profile.creditScore;
        uint256 newLimit;

        if (score >= SCORE_THRESHOLD_PREMIUM) {
            newLimit = maxCreditLimit;
        } else if (score >= SCORE_THRESHOLD_HIGH) {
            newLimit = defaultCreditLimit * 10;
        } else if (score >= SCORE_THRESHOLD_MED) {
            newLimit = defaultCreditLimit * 5;
        } else if (score >= SCORE_THRESHOLD_LOW) {
            newLimit = defaultCreditLimit * 2;
        } else {
            newLimit = defaultCreditLimit;
        }

        profile.creditLimit = newLimit;

        if (oldLimit != newLimit) {
            emit CreditLimitUpdated(agentId, oldLimit, newLimit);
        }
    }
}
