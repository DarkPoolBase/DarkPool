// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @title SettlementVerifier - Verifies batch settlement correctness
/// @notice V1: Trusted relayer signature verification. V2: ZK proof verification.
contract SettlementVerifier is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    address public trustedRelayer;

    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);

    constructor(address _trustedRelayer) Ownable(msg.sender) {
        require(_trustedRelayer != address(0), "Verifier: zero relayer");
        trustedRelayer = _trustedRelayer;
    }

    /// @notice Verify a settlement proof
    /// @param settlementHash The hash of the settlement data
    /// @param proof The proof bytes (V1: ECDSA signature from trusted relayer)
    /// @return valid Whether the proof is valid
    function verify(
        bytes32 settlementHash,
        bytes calldata proof
    ) external view returns (bool valid) {
        // V1: Verify the trusted relayer signed this settlement hash
        bytes32 ethSignedHash = settlementHash.toEthSignedMessageHash();
        address recovered = ethSignedHash.recover(proof);
        return recovered == trustedRelayer;
    }

    /// @notice Update the trusted relayer address
    /// @dev In V2, this will be replaced with a ZK verifier contract address
    function setTrustedRelayer(address _newRelayer) external onlyOwner {
        require(_newRelayer != address(0), "Verifier: zero relayer");
        address old = trustedRelayer;
        trustedRelayer = _newRelayer;
        emit RelayerUpdated(old, _newRelayer);
    }
}

