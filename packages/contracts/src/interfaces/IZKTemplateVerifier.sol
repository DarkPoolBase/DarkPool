// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IZKTemplateVerifier - Interface for ZK proof template verification
/// @notice Supports verification of Balance, Order, Identity, and Dataset proofs
interface IZKTemplateVerifier {
    enum ProofType { Balance, Order, Identity, Dataset }

    struct VerificationResult {
        ProofType proofType;
        bool verified;
        bytes32 publicInputsHash;
        uint256 timestamp;
    }

    event ProofVerified(ProofType indexed proofType, address indexed submitter, bytes32 publicInputsHash);
    event ProofRejected(ProofType indexed proofType, address indexed submitter, string reason);

    function verifyBalanceProof(bytes32 balanceHash, uint256 threshold, bytes calldata proof) external returns (bool);
    function verifyOrderProof(bytes32 commitmentHash, uint256 gpuType, uint256 minQuantity, bytes calldata proof) external returns (bool);
    function verifyIdentityProof(bytes32 identityRoot, uint256 kycStatus, uint256 jurisdiction, bytes calldata proof) external returns (bool);
    function verifyDatasetProof(bytes32 datasetHash, uint256 minSizeGb, uint256 minQuality, uint256 requiredFormat, bytes calldata proof) external returns (bool);
    function getVerification(bytes32 proofHash) external view returns (VerificationResult memory);
    function totalVerifications() external view returns (uint256);
}
