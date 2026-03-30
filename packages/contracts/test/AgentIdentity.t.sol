// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AgentIdentity.sol";
import "../src/ComputeCredit.sol";

contract AgentIdentityTest is Test {
    AgentIdentity public identity;
    ComputeCredit public token;

    address public admin = address(this);
    address public agent1 = address(0xA1);
    address public agent2 = address(0xA2);
    address public verifier = address(0xB1);
    address public reputationUpdater = address(0xB2);
    address public taskRecorder = address(0xB3);
    address public nobody = address(0xDEAD);

    uint256 constant MIN_STAKE = 100e18;
    bytes32 constant CAP_HASH = keccak256("capability-set-v1");
    bytes32 constant CAP_HASH_2 = keccak256("capability-set-v2");
    bytes constant PROOF = hex"deadbeef";
    bytes32 constant TASK_HASH = keccak256("task-001");

    function setUp() public {
        token = new ComputeCredit();
        identity = new AgentIdentity(address(token), MIN_STAKE);

        identity.grantRole(identity.VERIFIER_ROLE(), verifier);
        identity.grantRole(identity.REPUTATION_ROLE(), reputationUpdater);
        identity.grantRole(identity.TASK_RECORDER_ROLE(), taskRecorder);

        // Mint tokens to agents
        token.mint(agent1, 10000e18);
        token.mint(agent2, 10000e18);

        // Approve identity contract
        vm.prank(agent1);
        token.approve(address(identity), type(uint256).max);
        vm.prank(agent2);
        token.approve(address(identity), type(uint256).max);
    }

    // ========== Register Agent ==========

    function test_RegisterAgent() public {
        vm.prank(agent1);
        uint256 id = identity.registerAgent(CAP_HASH, PROOF);

        assertEq(id, 1);
        IAgentIdentity.AgentMeta memory a = identity.getAgent(1);
        assertEq(a.owner, agent1);
        assertEq(a.capabilityHash, CAP_HASH);
        assertEq(a.reputationScore, 5000);
        assertEq(a.totalTasksCompleted, 0);
        assertEq(a.totalEarned, 0);
        assertEq(a.stakeAmount, 0);
        assertTrue(a.active);
        assertFalse(a.verified);
    }

    function test_RegisterAgentEmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit IAgentIdentity.AgentRegistered(1, agent1, CAP_HASH);

        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);
    }

    function test_RegisterAgentSetsTimestamp() public {
        vm.warp(1000);
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        IAgentIdentity.AgentMeta memory a = identity.getAgent(1);
        assertEq(a.registeredAt, 1000);
    }

    function test_RevertRegisterEmptyCapabilityHash() public {
        vm.prank(agent1);
        vm.expectRevert("AgentIdentity: empty capability hash");
        identity.registerAgent(bytes32(0), PROOF);
    }

    function test_RevertRegisterEmptyProof() public {
        vm.prank(agent1);
        vm.expectRevert("AgentIdentity: empty proof");
        identity.registerAgent(CAP_HASH, "");
    }

    function test_RevertRegisterDuplicate() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        vm.prank(agent1);
        vm.expectRevert("AgentIdentity: already registered");
        identity.registerAgent(CAP_HASH_2, PROOF);
    }

    // ========== Verify Agent ==========

    function test_VerifyAgent() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        vm.prank(verifier);
        identity.verifyAgent(1);

        IAgentIdentity.AgentMeta memory a = identity.getAgent(1);
        assertTrue(a.verified);
    }

    function test_VerifyAgentEmitsEvent() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        vm.expectEmit(true, true, false, true);
        emit IAgentIdentity.AgentVerified(1, verifier);

        vm.prank(verifier);
        identity.verifyAgent(1);
    }

    function test_RevertVerifyAlreadyVerified() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        vm.prank(verifier);
        identity.verifyAgent(1);

        vm.prank(verifier);
        vm.expectRevert("AgentIdentity: already verified");
        identity.verifyAgent(1);
    }

    function test_RevertVerifyNonexistent() public {
        vm.prank(verifier);
        vm.expectRevert("AgentIdentity: agent not found");
        identity.verifyAgent(999);
    }

    function test_RevertVerifyUnauthorized() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        vm.prank(nobody);
        vm.expectRevert();
        identity.verifyAgent(1);
    }

    // ========== Update Reputation ==========

    function test_UpdateReputation() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        vm.prank(reputationUpdater);
        identity.updateReputation(1, 8000, PROOF);

        IAgentIdentity.AgentMeta memory a = identity.getAgent(1);
        assertEq(a.reputationScore, 8000);
    }

    function test_UpdateReputationEmitsEvent() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        vm.expectEmit(true, false, false, true);
        emit IAgentIdentity.ReputationUpdated(1, 5000, 8000);

        vm.prank(reputationUpdater);
        identity.updateReputation(1, 8000, PROOF);
    }

    function test_RevertUpdateReputationExceedsMax() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        vm.prank(reputationUpdater);
        vm.expectRevert("AgentIdentity: score exceeds max");
        identity.updateReputation(1, 10001, PROOF);
    }

    function test_RevertUpdateReputationUnauthorized() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        vm.prank(nobody);
        vm.expectRevert();
        identity.updateReputation(1, 8000, PROOF);
    }

    function test_RevertUpdateReputationInactiveAgent() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        identity.revokeAgent(1, "test");

        vm.prank(reputationUpdater);
        vm.expectRevert("AgentIdentity: agent not active");
        identity.updateReputation(1, 8000, PROOF);
    }

    // ========== Complete Task ==========

    function test_CompleteTask() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        vm.prank(taskRecorder);
        identity.completeTask(1, TASK_HASH, 500e18);

        IAgentIdentity.AgentMeta memory a = identity.getAgent(1);
        assertEq(a.totalTasksCompleted, 1);
        assertEq(a.totalEarned, 500e18);
        assertTrue(identity.verifyCapability(1, TASK_HASH));
    }

    function test_CompleteTaskEmitsEvent() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        vm.expectEmit(true, false, false, true);
        emit IAgentIdentity.TaskCompleted(1, TASK_HASH, 500e18);

        vm.prank(taskRecorder);
        identity.completeTask(1, TASK_HASH, 500e18);
    }

    function test_RevertCompleteTaskUnauthorized() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        vm.prank(nobody);
        vm.expectRevert();
        identity.completeTask(1, TASK_HASH, 500e18);
    }

    // ========== Revoke Agent ==========

    function test_RevokeAgent() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        identity.revokeAgent(1, "policy violation");

        IAgentIdentity.AgentMeta memory a = identity.getAgent(1);
        assertFalse(a.active);
    }

    function test_RevokeAgentEmitsEvent() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        vm.expectEmit(true, false, false, true);
        emit IAgentIdentity.AgentRevoked(1, "policy violation");

        identity.revokeAgent(1, "policy violation");
    }

    function test_RevertRevokeAlreadyInactive() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        identity.revokeAgent(1, "first");

        vm.expectRevert("AgentIdentity: agent not active");
        identity.revokeAgent(1, "second");
    }

    function test_RevertRevokeUnauthorized() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        vm.prank(nobody);
        vm.expectRevert();
        identity.revokeAgent(1, "bad actor");
    }

    // ========== Stake ==========

    function test_StakeForAgent() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        vm.prank(agent1);
        identity.stakeForAgent(1, 500e18);

        IAgentIdentity.AgentMeta memory a = identity.getAgent(1);
        assertEq(a.stakeAmount, 500e18);
        assertEq(token.balanceOf(address(identity)), 500e18);
    }

    function test_StakeForAgentEmitsEvent() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        vm.expectEmit(true, false, false, true);
        emit IAgentIdentity.AgentStaked(1, 500e18);

        vm.prank(agent1);
        identity.stakeForAgent(1, 500e18);
    }

    function test_RevertStakeNotOwner() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        vm.prank(agent2);
        vm.expectRevert("AgentIdentity: not agent owner");
        identity.stakeForAgent(1, 500e18);
    }

    function test_RevertStakeZero() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        vm.prank(agent1);
        vm.expectRevert("AgentIdentity: zero amount");
        identity.stakeForAgent(1, 0);
    }

    // ========== Queries ==========

    function test_GetAgentByOwner() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);

        IAgentIdentity.AgentMeta memory a = identity.getAgentByOwner(agent1);
        assertEq(a.id, 1);
        assertEq(a.owner, agent1);
    }

    function test_RevertGetAgentByOwnerNotFound() public {
        vm.expectRevert("AgentIdentity: no agent for owner");
        identity.getAgentByOwner(nobody);
    }

    function test_ListActiveAgents() public {
        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);
        vm.prank(agent2);
        identity.registerAgent(CAP_HASH_2, PROOF);

        // Revoke agent1
        identity.revokeAgent(1, "test");

        IAgentIdentity.AgentMeta[] memory active = identity.listActiveAgents();
        assertEq(active.length, 1);
        assertEq(active[0].id, 2);
        assertEq(active[0].owner, agent2);
    }

    function test_AgentCount() public {
        assertEq(identity.agentCount(), 0);

        vm.prank(agent1);
        identity.registerAgent(CAP_HASH, PROOF);
        assertEq(identity.agentCount(), 1);

        vm.prank(agent2);
        identity.registerAgent(CAP_HASH_2, PROOF);
        assertEq(identity.agentCount(), 2);
    }
}
