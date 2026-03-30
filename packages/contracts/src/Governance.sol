// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IGovernance.sol";

/// @title Governance - Protocol governance for the Agentic Dark Pool
/// @notice Token-weighted voting on fee rates, batch intervals, GPU types, and contract upgrades.
/// @dev Uses ComputeCredit (ADPC) token balances as voting power.
contract Governance is IGovernance, AccessControl {
    IERC20 public immutable votingToken;

    uint256 public proposalCount;

    /// @notice Minimum tokens required to create a proposal
    uint256 public proposalThreshold;

    /// @notice Minimum total votes for a proposal to be valid
    uint256 public quorumVotes;

    /// @notice Voting period in blocks (~48 hours at 2s/block on Base)
    uint256 public votingPeriod;

    /// @notice Execution delay in blocks (~24 hours at 2s/block on Base)
    uint256 public executionDelay;

    mapping(uint256 => Proposal) private _proposals;
    mapping(uint256 => mapping(address => bool)) private _hasVoted;

    constructor(
        address _votingToken,
        uint256 _proposalThreshold,
        uint256 _quorumVotes,
        uint256 _votingPeriod,
        uint256 _executionDelay
    ) {
        require(_votingToken != address(0), "Governance: zero token address");
        votingToken = IERC20(_votingToken);
        proposalThreshold = _proposalThreshold;
        quorumVotes = _quorumVotes;
        votingPeriod = _votingPeriod;
        executionDelay = _executionDelay;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Create a new proposal
    /// @param description Human-readable description of the proposal
    /// @param target Contract address to call if proposal passes
    /// @param callData Encoded function call to execute
    function propose(
        string calldata description,
        address target,
        bytes calldata callData
    ) external returns (uint256) {
        require(
            votingToken.balanceOf(msg.sender) >= proposalThreshold,
            "Governance: below proposal threshold"
        );
        require(target != address(0), "Governance: zero target");
        require(bytes(description).length > 0, "Governance: empty description");

        proposalCount++;
        uint256 proposalId = proposalCount;

        _proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            description: description,
            callData: callData,
            target: target,
            forVotes: 0,
            againstVotes: 0,
            startBlock: block.number,
            endBlock: block.number + votingPeriod,
            executionDeadline: block.number + votingPeriod + executionDelay,
            state: ProposalState.ACTIVE
        });

        emit ProposalCreated(proposalId, msg.sender, description);
        return proposalId;
    }

    /// @notice Cast a vote on an active proposal
    /// @param proposalId The proposal to vote on
    /// @param support True for yes, false for no
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = _proposals[proposalId];
        require(proposal.id != 0, "Governance: proposal not found");
        require(proposal.state == ProposalState.ACTIVE, "Governance: not active");
        require(block.number <= proposal.endBlock, "Governance: voting ended");
        require(!_hasVoted[proposalId][msg.sender], "Governance: already voted");

        uint256 weight = votingToken.balanceOf(msg.sender);
        require(weight > 0, "Governance: no voting power");

        _hasVoted[proposalId][msg.sender] = true;

        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    /// @notice Execute a passed proposal
    /// @param proposalId The proposal to execute
    function execute(uint256 proposalId) external {
        Proposal storage proposal = _proposals[proposalId];
        require(proposal.id != 0, "Governance: proposal not found");
        require(block.number > proposal.endBlock, "Governance: voting not ended");
        require(
            block.number <= proposal.executionDeadline,
            "Governance: execution deadline passed"
        );

        // Finalize state if still ACTIVE
        if (proposal.state == ProposalState.ACTIVE) {
            bool quorumReached = (proposal.forVotes + proposal.againstVotes) >= quorumVotes;
            bool passed = quorumReached && proposal.forVotes > proposal.againstVotes;
            proposal.state = passed ? ProposalState.PASSED : ProposalState.FAILED;
        }

        require(proposal.state == ProposalState.PASSED, "Governance: proposal not passed");

        proposal.state = ProposalState.EXECUTED;

        (bool success, ) = proposal.target.call(proposal.callData);
        require(success, "Governance: execution failed");

        emit ProposalExecuted(proposalId);
    }

    /// @notice Cancel a proposal (proposer or admin only)
    function cancel(uint256 proposalId) external {
        Proposal storage proposal = _proposals[proposalId];
        require(proposal.id != 0, "Governance: proposal not found");
        require(
            msg.sender == proposal.proposer || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Governance: not authorized"
        );
        require(
            proposal.state == ProposalState.ACTIVE || proposal.state == ProposalState.PASSED,
            "Governance: cannot cancel"
        );

        proposal.state = ProposalState.CANCELLED;
        emit ProposalCancelled(proposalId);
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        require(_proposals[proposalId].id != 0, "Governance: proposal not found");
        return _proposals[proposalId];
    }

    function quorum() external view returns (uint256) {
        return quorumVotes;
    }

    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return _hasVoted[proposalId][voter];
    }

    /// @notice Update governance parameters (admin only)
    function setProposalThreshold(uint256 _threshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        proposalThreshold = _threshold;
    }

    function setQuorum(uint256 _quorum) external onlyRole(DEFAULT_ADMIN_ROLE) {
        quorumVotes = _quorum;
    }

    function setVotingPeriod(uint256 _period) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_period > 0, "Governance: zero voting period");
        votingPeriod = _period;
    }

    function setExecutionDelay(uint256 _delay) external onlyRole(DEFAULT_ADMIN_ROLE) {
        executionDelay = _delay;
    }
}
