// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Governance.sol";
import "../src/ComputeCredit.sol";

contract GovernanceTest is Test {
    Governance public gov;
    ComputeCredit public token;

    address public admin = address(this);
    address public proposer = address(0xA1);
    address public voter1 = address(0xB1);
    address public voter2 = address(0xB2);
    address public voter3 = address(0xB3);

    // Governance params
    uint256 constant PROPOSAL_THRESHOLD = 100e18;
    uint256 constant QUORUM = 500e18;
    uint256 constant VOTING_PERIOD = 100; // blocks
    uint256 constant EXECUTION_DELAY = 50; // blocks

    // Dummy target for proposals
    address public target;

    function setUp() public {
        token = new ComputeCredit();
        gov = new Governance(
            address(token),
            PROPOSAL_THRESHOLD,
            QUORUM,
            VOTING_PERIOD,
            EXECUTION_DELAY
        );

        // Mint tokens to participants
        token.mint(proposer, 200e18);
        token.mint(voter1, 300e18);
        token.mint(voter2, 250e18);
        token.mint(voter3, 100e18);

        // Use governance contract itself as target for testing
        target = address(gov);

        // Grant governance contract admin role so it can execute proposals on itself
        gov.grantRole(gov.DEFAULT_ADMIN_ROLE(), address(gov));
    }

    // ========== Propose ==========

    function test_Propose() public {
        vm.prank(proposer);
        uint256 id = gov.propose(
            "Set quorum to 1000",
            target,
            abi.encodeWithSelector(Governance.setQuorum.selector, 1000e18)
        );

        assertEq(id, 1);
        IGovernance.Proposal memory p = gov.getProposal(1);
        assertEq(p.proposer, proposer);
        assertEq(uint256(p.state), uint256(IGovernance.ProposalState.ACTIVE));
    }

    function test_RevertProposeBelowThreshold() public {
        address noTokens = address(0xDEAD);
        vm.prank(noTokens);
        vm.expectRevert("Governance: below proposal threshold");
        gov.propose("Test", target, "");
    }

    function test_RevertProposeEmptyDescription() public {
        vm.prank(proposer);
        vm.expectRevert("Governance: empty description");
        gov.propose("", target, "");
    }

    function test_RevertProposeZeroTarget() public {
        vm.prank(proposer);
        vm.expectRevert("Governance: zero target");
        gov.propose("Test", address(0), "");
    }

    // ========== Vote ==========

    function test_VoteFor() public {
        vm.prank(proposer);
        gov.propose("Test", target, abi.encodeWithSelector(Governance.setQuorum.selector, 1000e18));

        vm.prank(voter1);
        gov.vote(1, true);

        IGovernance.Proposal memory p = gov.getProposal(1);
        assertEq(p.forVotes, 300e18);
    }

    function test_VoteAgainst() public {
        vm.prank(proposer);
        gov.propose("Test", target, abi.encodeWithSelector(Governance.setQuorum.selector, 1000e18));

        vm.prank(voter2);
        gov.vote(1, false);

        IGovernance.Proposal memory p = gov.getProposal(1);
        assertEq(p.againstVotes, 250e18);
    }

    function test_RevertDoubleVote() public {
        vm.prank(proposer);
        gov.propose("Test", target, abi.encodeWithSelector(Governance.setQuorum.selector, 1000e18));

        vm.startPrank(voter1);
        gov.vote(1, true);
        vm.expectRevert("Governance: already voted");
        gov.vote(1, true);
        vm.stopPrank();
    }

    function test_RevertVoteNoTokens() public {
        vm.prank(proposer);
        gov.propose("Test", target, abi.encodeWithSelector(Governance.setQuorum.selector, 1000e18));

        vm.prank(address(0xDEAD));
        vm.expectRevert("Governance: no voting power");
        gov.vote(1, true);
    }

    function test_RevertVoteAfterPeriod() public {
        vm.prank(proposer);
        gov.propose("Test", target, abi.encodeWithSelector(Governance.setQuorum.selector, 1000e18));

        vm.roll(block.number + VOTING_PERIOD + 1);

        vm.prank(voter1);
        vm.expectRevert("Governance: voting ended");
        gov.vote(1, true);
    }

    // ========== Execute ==========

    function test_ExecutePassedProposal() public {
        vm.prank(proposer);
        gov.propose(
            "Set quorum to 1000",
            target,
            abi.encodeWithSelector(Governance.setQuorum.selector, 1000e18)
        );

        // Vote to pass (need > quorum and more for than against)
        vm.prank(voter1);
        gov.vote(1, true);
        vm.prank(voter2);
        gov.vote(1, true);

        // Advance past voting period
        vm.roll(block.number + VOTING_PERIOD + 1);

        gov.execute(1);

        assertEq(gov.quorumVotes(), 1000e18);
        IGovernance.Proposal memory p = gov.getProposal(1);
        assertEq(uint256(p.state), uint256(IGovernance.ProposalState.EXECUTED));
    }

    function test_RevertExecuteFailedProposal() public {
        vm.prank(proposer);
        gov.propose("Test", target, abi.encodeWithSelector(Governance.setQuorum.selector, 1000e18));

        // Vote against (majority)
        vm.prank(voter1);
        gov.vote(1, false);
        vm.prank(voter2);
        gov.vote(1, false);

        vm.roll(block.number + VOTING_PERIOD + 1);

        vm.expectRevert("Governance: proposal not passed");
        gov.execute(1);
    }

    function test_RevertExecuteBeforeVotingEnds() public {
        vm.prank(proposer);
        gov.propose("Test", target, abi.encodeWithSelector(Governance.setQuorum.selector, 1000e18));

        vm.expectRevert("Governance: voting not ended");
        gov.execute(1);
    }

    function test_RevertExecuteAfterDeadline() public {
        vm.prank(proposer);
        gov.propose("Test", target, abi.encodeWithSelector(Governance.setQuorum.selector, 1000e18));

        vm.prank(voter1);
        gov.vote(1, true);
        vm.prank(voter2);
        gov.vote(1, true);

        vm.roll(block.number + VOTING_PERIOD + EXECUTION_DELAY + 1);

        vm.expectRevert("Governance: execution deadline passed");
        gov.execute(1);
    }

    // ========== Cancel ==========

    function test_CancelByProposer() public {
        vm.prank(proposer);
        gov.propose("Test", target, "");

        vm.prank(proposer);
        gov.cancel(1);

        IGovernance.Proposal memory p = gov.getProposal(1);
        assertEq(uint256(p.state), uint256(IGovernance.ProposalState.CANCELLED));
    }

    function test_CancelByAdmin() public {
        vm.prank(proposer);
        gov.propose("Test", target, "");

        gov.cancel(1); // admin = address(this)

        IGovernance.Proposal memory p = gov.getProposal(1);
        assertEq(uint256(p.state), uint256(IGovernance.ProposalState.CANCELLED));
    }

    function test_RevertCancelUnauthorized() public {
        vm.prank(proposer);
        gov.propose("Test", target, "");

        vm.prank(voter1);
        vm.expectRevert("Governance: not authorized");
        gov.cancel(1);
    }

    // ========== Admin ==========

    function test_SetProposalThreshold() public {
        gov.setProposalThreshold(500e18);
        assertEq(gov.proposalThreshold(), 500e18);
    }

    function test_SetVotingPeriod() public {
        gov.setVotingPeriod(200);
        assertEq(gov.votingPeriod(), 200);
    }

    function test_RevertSetVotingPeriodZero() public {
        vm.expectRevert("Governance: zero voting period");
        gov.setVotingPeriod(0);
    }
}
