// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AgentCredit.sol";

contract AgentCreditTest is Test {
    AgentCredit public credit;

    address public admin = address(this);
    address public recorder = address(0xA1);
    address public updater = address(0xA2);
    address public nobody = address(0xDEAD);

    uint256 constant AGENT_1 = 1;
    uint256 constant AGENT_2 = 2;
    bytes32 constant TX_HASH_1 = keccak256("tx1");
    bytes32 constant TX_HASH_2 = keccak256("tx2");
    uint256 constant AMOUNT = 100e6; // 100 USDC

    function setUp() public {
        credit = new AgentCredit();
        credit.grantRole(credit.RECORDER_ROLE(), recorder);
        credit.grantRole(credit.SCORE_UPDATER_ROLE(), updater);
    }

    // ========== Constructor ==========

    function test_ConstructorDefaults() public view {
        assertEq(credit.defaultCreditLimit(), 1000e6);
        assertEq(credit.maxCreditLimit(), 1_000_000e6);
        assertEq(credit.SCORE_THRESHOLD_LOW(), 300);
        assertEq(credit.SCORE_THRESHOLD_MED(), 500);
        assertEq(credit.SCORE_THRESHOLD_HIGH(), 700);
        assertEq(credit.SCORE_THRESHOLD_PREMIUM(), 900);
    }

    // ========== Create Profile ==========

    function test_CreateProfile() public {
        credit.createProfile(AGENT_1);

        IAgentCredit.CreditProfile memory p = credit.getProfile(AGENT_1);
        assertEq(p.agentId, AGENT_1);
        assertEq(p.creditScore, 500);
        assertEq(p.totalTransactions, 0);
        assertEq(p.successfulTransactions, 0);
        assertEq(p.failedTransactions, 0);
        assertEq(p.creditLimit, 1000e6);
        assertEq(p.totalVolume, 0);
        assertTrue(p.active);
    }

    function test_CreateProfileEmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit IAgentCredit.CreditProfileCreated(AGENT_1, 500);
        credit.createProfile(AGENT_1);
    }

    function test_RevertCreateProfileDuplicate() public {
        credit.createProfile(AGENT_1);
        vm.expectRevert("AgentCredit: profile exists");
        credit.createProfile(AGENT_1);
    }

    function test_RevertCreateProfileZeroId() public {
        vm.expectRevert("AgentCredit: zero agentId");
        credit.createProfile(0);
    }

    // ========== Record Transaction ==========

    function test_RecordSuccessfulTransaction() public {
        credit.createProfile(AGENT_1);

        vm.prank(recorder);
        credit.recordTransaction(AGENT_1, TX_HASH_1, true, AMOUNT);

        IAgentCredit.CreditProfile memory p = credit.getProfile(AGENT_1);
        assertEq(p.totalTransactions, 1);
        assertEq(p.successfulTransactions, 1);
        assertEq(p.failedTransactions, 0);
        assertEq(p.totalVolume, AMOUNT);
    }

    function test_RecordSuccessfulTransactionEmitsEvent() public {
        credit.createProfile(AGENT_1);

        vm.expectEmit(true, false, false, true);
        emit IAgentCredit.TransactionRecorded(AGENT_1, TX_HASH_1, true, AMOUNT);

        vm.prank(recorder);
        credit.recordTransaction(AGENT_1, TX_HASH_1, true, AMOUNT);
    }

    function test_RecordFailedTransaction() public {
        credit.createProfile(AGENT_1);

        vm.prank(recorder);
        credit.recordTransaction(AGENT_1, TX_HASH_1, false, AMOUNT);

        IAgentCredit.CreditProfile memory p = credit.getProfile(AGENT_1);
        assertEq(p.totalTransactions, 1);
        assertEq(p.successfulTransactions, 0);
        assertEq(p.failedTransactions, 1);
        assertEq(p.totalVolume, 0);
    }

    function test_RevertRecordUnauthorized() public {
        credit.createProfile(AGENT_1);

        vm.prank(nobody);
        vm.expectRevert();
        credit.recordTransaction(AGENT_1, TX_HASH_1, true, AMOUNT);
    }

    function test_RevertRecordNonexistentProfile() public {
        vm.prank(recorder);
        vm.expectRevert("AgentCredit: profile not found");
        credit.recordTransaction(999, TX_HASH_1, true, AMOUNT);
    }

    function test_RevertRecordZeroTxHash() public {
        credit.createProfile(AGENT_1);

        vm.prank(recorder);
        vm.expectRevert("AgentCredit: zero txHash");
        credit.recordTransaction(AGENT_1, bytes32(0), true, AMOUNT);
    }

    function test_RevertRecordZeroAmount() public {
        credit.createProfile(AGENT_1);

        vm.prank(recorder);
        vm.expectRevert("AgentCredit: zero amount");
        credit.recordTransaction(AGENT_1, TX_HASH_1, true, 0);
    }

    // ========== Score Recalculation ==========

    function test_ScoreAllSuccess() public {
        credit.createProfile(AGENT_1);

        vm.startPrank(recorder);
        credit.recordTransaction(AGENT_1, TX_HASH_1, true, AMOUNT);
        credit.recordTransaction(AGENT_1, TX_HASH_2, true, AMOUNT);
        vm.stopPrank();

        assertEq(credit.getScore(AGENT_1), 1000);
    }

    function test_ScoreHalfSuccess() public {
        credit.createProfile(AGENT_1);

        vm.startPrank(recorder);
        credit.recordTransaction(AGENT_1, TX_HASH_1, true, AMOUNT);
        credit.recordTransaction(AGENT_1, TX_HASH_2, false, AMOUNT);
        vm.stopPrank();

        assertEq(credit.getScore(AGENT_1), 500);
    }

    function test_ScoreAllFailed() public {
        credit.createProfile(AGENT_1);

        vm.startPrank(recorder);
        credit.recordTransaction(AGENT_1, TX_HASH_1, false, AMOUNT);
        credit.recordTransaction(AGENT_1, TX_HASH_2, false, AMOUNT);
        vm.stopPrank();

        assertEq(credit.getScore(AGENT_1), 0);
    }

    // ========== Credit Limit Tiers ==========

    function test_CreditLimitLowScore() public {
        credit.createProfile(AGENT_1);

        // All failures → score 0 → defaultCreditLimit
        vm.startPrank(recorder);
        credit.recordTransaction(AGENT_1, TX_HASH_1, false, AMOUNT);
        vm.stopPrank();

        assertEq(credit.getCreditLimit(AGENT_1), 1000e6);
    }

    function test_CreditLimitHighScore() public {
        credit.createProfile(AGENT_1);

        // All successes → score 1000 → maxCreditLimit
        vm.startPrank(recorder);
        credit.recordTransaction(AGENT_1, TX_HASH_1, true, AMOUNT);
        vm.stopPrank();

        assertEq(credit.getCreditLimit(AGENT_1), 1_000_000e6);
    }

    function test_CreditLimitMedScore() public {
        credit.createProfile(AGENT_1);

        // 5 success, 5 fail → 500 → defaultCreditLimit * 5
        vm.startPrank(recorder);
        for (uint256 i = 0; i < 5; i++) {
            credit.recordTransaction(AGENT_1, keccak256(abi.encode("s", i)), true, AMOUNT);
        }
        for (uint256 i = 0; i < 5; i++) {
            credit.recordTransaction(AGENT_1, keccak256(abi.encode("f", i)), false, AMOUNT);
        }
        vm.stopPrank();

        assertEq(credit.getScore(AGENT_1), 500);
        assertEq(credit.getCreditLimit(AGENT_1), 1000e6 * 5);
    }

    // ========== Get Score ==========

    function test_GetScore() public {
        credit.createProfile(AGENT_1);
        assertEq(credit.getScore(AGENT_1), 500);
    }

    function test_RevertGetScoreNonexistent() public {
        vm.expectRevert("AgentCredit: profile not found");
        credit.getScore(999);
    }

    // ========== Prove Min Score ==========

    function test_ProveMinScoreAbove() public {
        credit.createProfile(AGENT_1);

        vm.startPrank(recorder);
        credit.recordTransaction(AGENT_1, TX_HASH_1, true, AMOUNT);
        vm.stopPrank();

        // Score is 1000, threshold 500 → true
        vm.expectEmit(true, false, false, true);
        emit IAgentCredit.MinScoreProven(AGENT_1, 500, true);

        bool passed = credit.proveMinScore(AGENT_1, 500, hex"01");
        assertTrue(passed);
    }

    function test_ProveMinScoreBelow() public {
        credit.createProfile(AGENT_1);

        vm.startPrank(recorder);
        credit.recordTransaction(AGENT_1, TX_HASH_1, false, AMOUNT);
        vm.stopPrank();

        // Score is 0, threshold 500 → false
        vm.expectEmit(true, false, false, true);
        emit IAgentCredit.MinScoreProven(AGENT_1, 500, false);

        bool passed = credit.proveMinScore(AGENT_1, 500, hex"01");
        assertFalse(passed);
    }

    function test_RevertProveMinScoreEmptyProof() public {
        credit.createProfile(AGENT_1);

        vm.expectRevert("AgentCredit: empty proof");
        credit.proveMinScore(AGENT_1, 500, hex"");
    }

    // ========== Is Above Threshold ==========

    function test_IsAboveThresholdTrue() public {
        credit.createProfile(AGENT_1);
        // Initial score is 500
        assertTrue(credit.isAboveThreshold(AGENT_1, 500));
        assertTrue(credit.isAboveThreshold(AGENT_1, 300));
    }

    function test_IsAboveThresholdFalse() public {
        credit.createProfile(AGENT_1);
        // Initial score is 500
        assertFalse(credit.isAboveThreshold(AGENT_1, 501));
        assertFalse(credit.isAboveThreshold(AGENT_1, 700));
    }

    // ========== Get Credit Limit ==========

    function test_GetCreditLimit() public {
        credit.createProfile(AGENT_1);
        // Initial score 500 → defaultCreditLimit * 5
        assertEq(credit.getCreditLimit(AGENT_1), 1000e6);
    }

    // ========== Get Profile ==========

    function test_GetProfile() public {
        credit.createProfile(AGENT_1);

        vm.prank(recorder);
        credit.recordTransaction(AGENT_1, TX_HASH_1, true, AMOUNT);

        IAgentCredit.CreditProfile memory p = credit.getProfile(AGENT_1);
        assertEq(p.agentId, AGENT_1);
        assertEq(p.creditScore, 1000);
        assertEq(p.totalTransactions, 1);
        assertEq(p.successfulTransactions, 1);
        assertEq(p.failedTransactions, 0);
        assertEq(p.totalVolume, AMOUNT);
        assertTrue(p.active);
    }

    function test_RevertGetProfileNonexistent() public {
        vm.expectRevert("AgentCredit: profile not found");
        credit.getProfile(999);
    }

    // ========== Deactivate Profile ==========

    function test_DeactivateProfile() public {
        credit.createProfile(AGENT_1);
        credit.deactivateProfile(AGENT_1);

        IAgentCredit.CreditProfile memory p = credit.getProfile(AGENT_1);
        assertFalse(p.active);
    }

    function test_RevertDeactivateNonexistent() public {
        vm.expectRevert("AgentCredit: profile not found");
        credit.deactivateProfile(999);
    }

    function test_RevertDeactivateAlreadyInactive() public {
        credit.createProfile(AGENT_1);
        credit.deactivateProfile(AGENT_1);

        vm.expectRevert("AgentCredit: already inactive");
        credit.deactivateProfile(AGENT_1);
    }

    function test_RevertRecordInactiveProfile() public {
        credit.createProfile(AGENT_1);
        credit.deactivateProfile(AGENT_1);

        vm.prank(recorder);
        vm.expectRevert("AgentCredit: profile inactive");
        credit.recordTransaction(AGENT_1, TX_HASH_1, true, AMOUNT);
    }

    // ========== Admin Setters ==========

    function test_SetDefaultCreditLimit() public {
        credit.setDefaultCreditLimit(5000e6);
        assertEq(credit.defaultCreditLimit(), 5000e6);
    }

    function test_RevertSetDefaultCreditLimitZero() public {
        vm.expectRevert("AgentCredit: zero limit");
        credit.setDefaultCreditLimit(0);
    }

    function test_RevertSetDefaultCreditLimitUnauthorized() public {
        vm.prank(nobody);
        vm.expectRevert();
        credit.setDefaultCreditLimit(5000e6);
    }

    function test_SetMaxCreditLimit() public {
        credit.setMaxCreditLimit(5_000_000e6);
        assertEq(credit.maxCreditLimit(), 5_000_000e6);
    }

    function test_RevertSetMaxCreditLimitZero() public {
        vm.expectRevert("AgentCredit: zero limit");
        credit.setMaxCreditLimit(0);
    }

    function test_RevertSetMaxCreditLimitUnauthorized() public {
        vm.prank(nobody);
        vm.expectRevert();
        credit.setMaxCreditLimit(5_000_000e6);
    }
}
