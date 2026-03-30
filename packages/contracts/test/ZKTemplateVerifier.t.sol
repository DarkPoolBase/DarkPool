// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ZKTemplateVerifier.sol";

contract ZKTemplateVerifierTest is Test {
    ZKTemplateVerifier public verifier;

    address public admin = address(this);
    address public nobody = address(0xDEAD);

    bytes32 constant BALANCE_HASH = keccak256("balance-commitment-001");
    bytes32 constant ORDER_HASH = keccak256("order-commitment-001");
    bytes32 constant IDENTITY_ROOT = keccak256("identity-root-001");
    bytes32 constant DATASET_HASH = keccak256("dataset-hash-001");
    bytes constant MOCK_PROOF = hex"cafebabe";

    function setUp() public {
        verifier = new ZKTemplateVerifier();
    }

    // ========== Balance Proof ==========

    function test_VerifyBalanceProof() public {
        bool result = verifier.verifyBalanceProof(BALANCE_HASH, 1000, MOCK_PROOF);
        assertTrue(result);
        assertEq(verifier.totalVerifications(), 1);
    }

    function test_VerifyBalanceProofStoresResult() public {
        verifier.verifyBalanceProof(BALANCE_HASH, 1000, MOCK_PROOF);

        bytes32 proofHash = keccak256(abi.encodePacked(BALANCE_HASH, uint256(1000), MOCK_PROOF));
        IZKTemplateVerifier.VerificationResult memory res = verifier.getVerification(proofHash);

        assertTrue(res.verified);
        assertEq(uint256(res.proofType), uint256(IZKTemplateVerifier.ProofType.Balance));
        assertTrue(res.timestamp > 0);
    }

    function test_EmitBalanceProofVerified() public {
        bytes32 publicInputsHash = keccak256(abi.encodePacked(BALANCE_HASH, uint256(1000)));
        vm.expectEmit(true, true, false, true);
        emit IZKTemplateVerifier.ProofVerified(IZKTemplateVerifier.ProofType.Balance, admin, publicInputsHash);
        verifier.verifyBalanceProof(BALANCE_HASH, 1000, MOCK_PROOF);
    }

    function test_RevertBalanceProofEmptyHash() public {
        vm.expectRevert("ZKTemplateVerifier: empty balance hash");
        verifier.verifyBalanceProof(bytes32(0), 1000, MOCK_PROOF);
    }

    function test_RevertBalanceProofEmptyProof() public {
        vm.expectRevert("ZKTemplateVerifier: empty proof");
        verifier.verifyBalanceProof(BALANCE_HASH, 1000, "");
    }

    function test_RevertBalanceProofUnauthorized() public {
        vm.prank(nobody);
        vm.expectRevert();
        verifier.verifyBalanceProof(BALANCE_HASH, 1000, MOCK_PROOF);
    }

    // ========== Order Proof ==========

    function test_VerifyOrderProof() public {
        bool result = verifier.verifyOrderProof(ORDER_HASH, 1, 10, MOCK_PROOF);
        assertTrue(result);
        assertEq(verifier.totalVerifications(), 1);
    }

    function test_VerifyOrderProofStoresResult() public {
        verifier.verifyOrderProof(ORDER_HASH, 1, 10, MOCK_PROOF);

        bytes32 proofHash = keccak256(abi.encodePacked(ORDER_HASH, uint256(1), uint256(10), MOCK_PROOF));
        IZKTemplateVerifier.VerificationResult memory res = verifier.getVerification(proofHash);

        assertTrue(res.verified);
        assertEq(uint256(res.proofType), uint256(IZKTemplateVerifier.ProofType.Order));
    }

    function test_RevertOrderProofEmptyHash() public {
        vm.expectRevert("ZKTemplateVerifier: empty commitment hash");
        verifier.verifyOrderProof(bytes32(0), 1, 10, MOCK_PROOF);
    }

    function test_RevertOrderProofInvalidGpuType() public {
        vm.expectRevert("ZKTemplateVerifier: invalid GPU type");
        verifier.verifyOrderProof(ORDER_HASH, 0, 10, MOCK_PROOF);
    }

    function test_RevertOrderProofEmptyProof() public {
        vm.expectRevert("ZKTemplateVerifier: empty proof");
        verifier.verifyOrderProof(ORDER_HASH, 1, 10, "");
    }

    function test_RevertOrderProofUnauthorized() public {
        vm.prank(nobody);
        vm.expectRevert();
        verifier.verifyOrderProof(ORDER_HASH, 1, 10, MOCK_PROOF);
    }

    // ========== Identity Proof ==========

    function test_VerifyIdentityProof() public {
        bool result = verifier.verifyIdentityProof(IDENTITY_ROOT, 1, 840, MOCK_PROOF);
        assertTrue(result);
        assertEq(verifier.totalVerifications(), 1);
    }

    function test_RevertIdentityProofEmptyRoot() public {
        vm.expectRevert("ZKTemplateVerifier: empty identity root");
        verifier.verifyIdentityProof(bytes32(0), 1, 840, MOCK_PROOF);
    }

    function test_RevertIdentityProofBadKycStatus() public {
        vm.expectRevert("ZKTemplateVerifier: KYC status must be 1");
        verifier.verifyIdentityProof(IDENTITY_ROOT, 0, 840, MOCK_PROOF);
    }

    function test_RevertIdentityProofInvalidJurisdiction() public {
        vm.expectRevert("ZKTemplateVerifier: invalid jurisdiction");
        verifier.verifyIdentityProof(IDENTITY_ROOT, 1, 0, MOCK_PROOF);
    }

    function test_RevertIdentityProofUnauthorized() public {
        vm.prank(nobody);
        vm.expectRevert();
        verifier.verifyIdentityProof(IDENTITY_ROOT, 1, 840, MOCK_PROOF);
    }

    // ========== Dataset Proof ==========

    function test_VerifyDatasetProof() public {
        bool result = verifier.verifyDatasetProof(DATASET_HASH, 100, 80, 1, MOCK_PROOF);
        assertTrue(result);
        assertEq(verifier.totalVerifications(), 1);
    }

    function test_RevertDatasetProofEmptyHash() public {
        vm.expectRevert("ZKTemplateVerifier: empty dataset hash");
        verifier.verifyDatasetProof(bytes32(0), 100, 80, 1, MOCK_PROOF);
    }

    function test_RevertDatasetProofInvalidFormat() public {
        vm.expectRevert("ZKTemplateVerifier: invalid format");
        verifier.verifyDatasetProof(DATASET_HASH, 100, 80, 0, MOCK_PROOF);
    }

    function test_RevertDatasetProofEmptyProof() public {
        vm.expectRevert("ZKTemplateVerifier: empty proof");
        verifier.verifyDatasetProof(DATASET_HASH, 100, 80, 1, "");
    }

    // ========== Cross-cutting ==========

    function test_TotalVerificationsAcrossTypes() public {
        verifier.verifyBalanceProof(BALANCE_HASH, 1000, MOCK_PROOF);
        verifier.verifyOrderProof(ORDER_HASH, 1, 10, MOCK_PROOF);
        verifier.verifyIdentityProof(IDENTITY_ROOT, 1, 840, MOCK_PROOF);
        verifier.verifyDatasetProof(DATASET_HASH, 100, 80, 1, MOCK_PROOF);

        assertEq(verifier.totalVerifications(), 4);
    }

    function test_RevertGetVerificationNotFound() public {
        vm.expectRevert("ZKTemplateVerifier: verification not found");
        verifier.getVerification(keccak256("nonexistent"));
    }
}
