// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IGovernance {
    enum ProposalState { PENDING, ACTIVE, PASSED, FAILED, EXECUTED, CANCELLED }

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        bytes callData;
        address target;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startBlock;
        uint256 endBlock;
        uint256 executionDeadline;
        ProposalState state;
    }

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);

    function propose(string calldata description, address target, bytes calldata callData) external returns (uint256);
    function vote(uint256 proposalId, bool support) external;
    function execute(uint256 proposalId) external;
    function cancel(uint256 proposalId) external;
    function getProposal(uint256 proposalId) external view returns (Proposal memory);
    function quorum() external view returns (uint256);
}
