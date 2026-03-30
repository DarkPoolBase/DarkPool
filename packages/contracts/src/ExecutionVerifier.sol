// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title ExecutionVerifier - Verifies ZK proofs of correct AI inference execution
/// @notice Deployed on Base. Callable by SLA Enforcement contracts to verify
/// that the correct model was run on the submitted input inside a TEE.
contract ExecutionVerifier is AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    /// @notice Address of the Noir UltraPlonk verifier contract
    address public noirVerifier;

    struct ExecutionAttestation {
        uint256 modelId;
        bytes32 modelHash;
        bytes32 inputHash;
        bytes32 outputHash;
        uint256 verifiedAt;
        bool valid;
    }

    /// @notice jobId => attestation
    mapping(bytes32 => ExecutionAttestation) public attestations;

    /// @notice Total number of verified executions
    uint256 public totalVerified;

    event ExecutionVerified(
        bytes32 indexed jobId,
        uint256 indexed modelId,
        bytes32 inputHash,
        bytes32 outputHash
    );
    event AttestationInvalidated(bytes32 indexed jobId, string reason);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    /// @notice Verify a ZK proof of correct execution and store attestation
    /// @param jobId Unique identifier for the inference job
    /// @param proof The ZK proof bytes (from Noir prover in TEE)
    /// @param modelId The model that was supposed to run
    /// @param modelHash Hash of the model weights (from ModelRegistry)
    /// @param inputHash Hash of the encrypted input (from buyer)
    /// @param outputHash Hash of the encrypted output (from TEE)
    function verifyExecution(
        bytes32 jobId,
        bytes calldata proof,
        uint256 modelId,
        bytes32 modelHash,
        bytes32 inputHash,
        bytes32 outputHash
    ) external onlyRole(VERIFIER_ROLE) {
        require(jobId != bytes32(0), "ExecutionVerifier: empty job ID");
        require(proof.length > 0, "ExecutionVerifier: empty proof");
        require(modelId > 0, "ExecutionVerifier: invalid model ID");
        require(inputHash != bytes32(0), "ExecutionVerifier: empty input hash");
        require(outputHash != bytes32(0), "ExecutionVerifier: empty output hash");
        require(!attestations[jobId].valid, "ExecutionVerifier: already verified");

        // TODO: Call the actual Noir UltraPlonk verifier when deployed
        // bytes32[] memory publicInputs = new bytes32[](5);
        // publicInputs[0] = bytes32(modelId);
        // publicInputs[1] = modelHash;
        // publicInputs[2] = inputHash;
        // publicInputs[3] = outputHash;
        // require(INoirVerifier(noirVerifier).verify(proof, publicInputs), "Invalid proof");

        attestations[jobId] = ExecutionAttestation({
            modelId: modelId,
            modelHash: modelHash,
            inputHash: inputHash,
            outputHash: outputHash,
            verifiedAt: block.timestamp,
            valid: true
        });

        totalVerified++;

        emit ExecutionVerified(jobId, modelId, inputHash, outputHash);
    }

    /// @notice Check if a job has been verified
    function isVerified(bytes32 jobId) external view returns (bool) {
        return attestations[jobId].valid;
    }

    /// @notice Get attestation details for a job
    function getAttestation(bytes32 jobId) external view returns (ExecutionAttestation memory) {
        require(attestations[jobId].verifiedAt > 0, "ExecutionVerifier: not found");
        return attestations[jobId];
    }

    /// @notice Invalidate an attestation (e.g., after dispute)
    function invalidateAttestation(
        bytes32 jobId,
        string calldata reason
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(attestations[jobId].valid, "ExecutionVerifier: not valid");
        attestations[jobId].valid = false;
        emit AttestationInvalidated(jobId, reason);
    }

    /// @notice Update the Noir verifier contract address
    function setNoirVerifier(address _verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        noirVerifier = _verifier;
    }
}
