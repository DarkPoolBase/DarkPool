// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/DiffPrivacyVerifier.sol";
import "../src/DataProvenance.sol";

contract DiffPrivacyVerifierTest is Test {
    DiffPrivacyVerifier public verifier;
    DataProvenance public nft;

    address public admin = address(this);
    address public provider = address(0xA1);
    address public nobody = address(0xDEAD);

    bytes32 constant DATASET_HASH = keccak256("dataset-commitment");
    bytes constant MOCK_PROOF = hex"deadbeef";

    function setUp() public {
        nft = new DataProvenance();
        verifier = new DiffPrivacyVerifier(address(nft));

        // Mint a dataset for testing
        nft.mintDataset(provider, keccak256("meta"), "HEALTHCARE", "parquet", 50, 85, 500);
    }

    // ========== Verify and Attest ==========

    function test_VerifyAndAttest() public {
        verifier.verifyAndAttest(1, MOCK_PROOF, DATASET_HASH, 1000000, 10000000, 1000);

        (
            bytes32 hash, uint256 eps, uint256 delta,
            uint256 maxQ, uint256 currentQ, uint256 attestedAt, bool valid
        ) = verifier.attestations(1);

        assertEq(hash, DATASET_HASH);
        assertEq(eps, 1000000);
        assertEq(delta, 10000000);
        assertEq(maxQ, 1000);
        assertEq(currentQ, 0);
        assertTrue(attestedAt > 0);
        assertTrue(valid);
    }

    function test_IsCompliant() public {
        verifier.verifyAndAttest(1, MOCK_PROOF, DATASET_HASH, 1000000, 10000000, 1000);
        assertTrue(verifier.isCompliant(1));
    }

    function test_RemainingBudget() public {
        verifier.verifyAndAttest(1, MOCK_PROOF, DATASET_HASH, 1000000, 10000000, 100);
        assertEq(verifier.remainingBudget(1), 100);
    }

    function test_RevertVerifyZeroEpsilon() public {
        vm.expectRevert("DiffPrivacyVerifier: zero epsilon");
        verifier.verifyAndAttest(1, MOCK_PROOF, DATASET_HASH, 0, 10000000, 1000);
    }

    function test_RevertVerifyEmptyProof() public {
        vm.expectRevert("DiffPrivacyVerifier: empty proof");
        verifier.verifyAndAttest(1, "", DATASET_HASH, 1000000, 10000000, 1000);
    }

    function test_RevertVerifyUnauthorized() public {
        vm.prank(nobody);
        vm.expectRevert();
        verifier.verifyAndAttest(1, MOCK_PROOF, DATASET_HASH, 1000000, 10000000, 1000);
    }

    // ========== Query Budget ==========

    function test_RecordQuery() public {
        verifier.verifyAndAttest(1, MOCK_PROOF, DATASET_HASH, 1000000, 10000000, 100);

        verifier.recordQuery(1);
        assertEq(verifier.remainingBudget(1), 99);

        verifier.recordQuery(1);
        assertEq(verifier.remainingBudget(1), 98);
    }

    function test_RevertRecordQueryBudgetExceeded() public {
        verifier.verifyAndAttest(1, MOCK_PROOF, DATASET_HASH, 1000000, 10000000, 2);

        verifier.recordQuery(1);
        verifier.recordQuery(1);

        vm.expectRevert("DiffPrivacyVerifier: privacy budget exceeded");
        verifier.recordQuery(1);
    }

    function test_RevertRecordQueryNoAttestation() public {
        vm.expectRevert("DiffPrivacyVerifier: no valid attestation");
        verifier.recordQuery(99);
    }

    function test_BudgetExhaustedNotCompliant() public {
        verifier.verifyAndAttest(1, MOCK_PROOF, DATASET_HASH, 1000000, 10000000, 1);

        verifier.recordQuery(1);

        assertFalse(verifier.isCompliant(1));
        assertEq(verifier.remainingBudget(1), 0);
    }

    // ========== Revoke ==========

    function test_RevokeAttestation() public {
        verifier.verifyAndAttest(1, MOCK_PROOF, DATASET_HASH, 1000000, 10000000, 1000);

        verifier.revokeAttestation(1);
        assertFalse(verifier.isCompliant(1));
    }

    function test_RevertRevokeNotValid() public {
        vm.expectRevert("DiffPrivacyVerifier: not valid");
        verifier.revokeAttestation(1);
    }

    function test_RevertRevokeUnauthorized() public {
        verifier.verifyAndAttest(1, MOCK_PROOF, DATASET_HASH, 1000000, 10000000, 1000);

        vm.prank(nobody);
        vm.expectRevert();
        verifier.revokeAttestation(1);
    }

    // ========== Fuzz ==========

    function testFuzz_RecordQueriesUpToBudget(uint256 maxQueries) public {
        vm.assume(maxQueries > 0 && maxQueries <= 50);

        verifier.verifyAndAttest(1, MOCK_PROOF, DATASET_HASH, 1000000, 10000000, maxQueries);

        for (uint256 i = 0; i < maxQueries; i++) {
            verifier.recordQuery(1);
        }

        assertEq(verifier.remainingBudget(1), 0);
        assertFalse(verifier.isCompliant(1));
    }
}
