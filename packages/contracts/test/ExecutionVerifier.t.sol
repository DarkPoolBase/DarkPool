// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ExecutionVerifier.sol";

contract ExecutionVerifierTest is Test {
    ExecutionVerifier public verifier;

    address public admin = address(this);
    address public nobody = address(0xDEAD);

    bytes32 constant JOB_ID = keccak256("job-001");
    bytes32 constant JOB_ID_2 = keccak256("job-002");
    bytes32 constant MODEL_HASH = keccak256("llama-3-70b-weights");
    bytes32 constant INPUT_HASH = keccak256("encrypted-prompt");
    bytes32 constant OUTPUT_HASH = keccak256("encrypted-response");
    bytes constant MOCK_PROOF = hex"cafebabe";

    function setUp() public {
        verifier = new ExecutionVerifier();
    }

    // ========== Verify ==========

    function test_VerifyExecution() public {
        verifier.verifyExecution(JOB_ID, MOCK_PROOF, 1, MODEL_HASH, INPUT_HASH, OUTPUT_HASH);

        assertTrue(verifier.isVerified(JOB_ID));
        assertEq(verifier.totalVerified(), 1);

        ExecutionVerifier.ExecutionAttestation memory att = verifier.getAttestation(JOB_ID);
        assertEq(att.modelId, 1);
        assertEq(att.modelHash, MODEL_HASH);
        assertEq(att.inputHash, INPUT_HASH);
        assertEq(att.outputHash, OUTPUT_HASH);
        assertTrue(att.valid);
        assertTrue(att.verifiedAt > 0);
    }

    function test_VerifyMultipleJobs() public {
        verifier.verifyExecution(JOB_ID, MOCK_PROOF, 1, MODEL_HASH, INPUT_HASH, OUTPUT_HASH);
        verifier.verifyExecution(JOB_ID_2, MOCK_PROOF, 2, MODEL_HASH, INPUT_HASH, OUTPUT_HASH);

        assertEq(verifier.totalVerified(), 2);
        assertTrue(verifier.isVerified(JOB_ID));
        assertTrue(verifier.isVerified(JOB_ID_2));
    }

    function test_EmitExecutionVerified() public {
        vm.expectEmit(true, true, false, true);
        emit ExecutionVerifier.ExecutionVerified(JOB_ID, 1, INPUT_HASH, OUTPUT_HASH);
        verifier.verifyExecution(JOB_ID, MOCK_PROOF, 1, MODEL_HASH, INPUT_HASH, OUTPUT_HASH);
    }

    function test_RevertVerifyEmptyJobId() public {
        vm.expectRevert("ExecutionVerifier: empty job ID");
        verifier.verifyExecution(bytes32(0), MOCK_PROOF, 1, MODEL_HASH, INPUT_HASH, OUTPUT_HASH);
    }

    function test_RevertVerifyEmptyProof() public {
        vm.expectRevert("ExecutionVerifier: empty proof");
        verifier.verifyExecution(JOB_ID, "", 1, MODEL_HASH, INPUT_HASH, OUTPUT_HASH);
    }

    function test_RevertVerifyInvalidModelId() public {
        vm.expectRevert("ExecutionVerifier: invalid model ID");
        verifier.verifyExecution(JOB_ID, MOCK_PROOF, 0, MODEL_HASH, INPUT_HASH, OUTPUT_HASH);
    }

    function test_RevertVerifyEmptyInputHash() public {
        vm.expectRevert("ExecutionVerifier: empty input hash");
        verifier.verifyExecution(JOB_ID, MOCK_PROOF, 1, MODEL_HASH, bytes32(0), OUTPUT_HASH);
    }

    function test_RevertVerifyDuplicate() public {
        verifier.verifyExecution(JOB_ID, MOCK_PROOF, 1, MODEL_HASH, INPUT_HASH, OUTPUT_HASH);

        vm.expectRevert("ExecutionVerifier: already verified");
        verifier.verifyExecution(JOB_ID, MOCK_PROOF, 1, MODEL_HASH, INPUT_HASH, OUTPUT_HASH);
    }

    function test_RevertVerifyUnauthorized() public {
        vm.prank(nobody);
        vm.expectRevert();
        verifier.verifyExecution(JOB_ID, MOCK_PROOF, 1, MODEL_HASH, INPUT_HASH, OUTPUT_HASH);
    }

    // ========== Invalidate ==========

    function test_InvalidateAttestation() public {
        verifier.verifyExecution(JOB_ID, MOCK_PROOF, 1, MODEL_HASH, INPUT_HASH, OUTPUT_HASH);
        verifier.invalidateAttestation(JOB_ID, "Dispute upheld");

        assertFalse(verifier.isVerified(JOB_ID));
    }

    function test_RevertInvalidateNotValid() public {
        vm.expectRevert("ExecutionVerifier: not valid");
        verifier.invalidateAttestation(JOB_ID, "test");
    }

    function test_RevertInvalidateUnauthorized() public {
        verifier.verifyExecution(JOB_ID, MOCK_PROOF, 1, MODEL_HASH, INPUT_HASH, OUTPUT_HASH);

        vm.prank(nobody);
        vm.expectRevert();
        verifier.invalidateAttestation(JOB_ID, "test");
    }

    // ========== Query ==========

    function test_IsVerifiedFalseForUnknown() public view {
        assertFalse(verifier.isVerified(keccak256("unknown")));
    }

    function test_RevertGetAttestationNotFound() public {
        vm.expectRevert("ExecutionVerifier: not found");
        verifier.getAttestation(keccak256("unknown"));
    }
}
