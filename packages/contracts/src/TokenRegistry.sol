// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/ITokenRegistry.sol";

/// @title TokenRegistry - On-chain registry for GPU compute types
/// @notice Maps GPU types to standardized token IDs with metadata for the Agentic Dark Pool
contract TokenRegistry is ITokenRegistry, AccessControl {
    bytes32 public constant REGISTRY_ADMIN_ROLE = keccak256("REGISTRY_ADMIN_ROLE");

    mapping(uint256 => GpuMeta) private _gpuTypes;
    uint256[] private _registeredIds;
    mapping(uint256 => bool) private _exists;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRY_ADMIN_ROLE, msg.sender);
    }

    /// @notice Register a new GPU type with metadata
    /// @param tokenId Unique identifier for the GPU type
    /// @param name Human-readable GPU name (e.g., "NVIDIA H100 SXM")
    /// @param vramGb VRAM in gigabytes
    /// @param tier Pricing tier ("Premium", "Standard", "Economy")
    function registerGpuType(
        uint256 tokenId,
        string calldata name,
        uint256 vramGb,
        string calldata tier
    ) external onlyRole(REGISTRY_ADMIN_ROLE) {
        require(!_exists[tokenId], "TokenRegistry: GPU type already registered");
        require(tokenId > 0, "TokenRegistry: invalid token ID");
        require(bytes(name).length > 0, "TokenRegistry: empty name");
        require(vramGb > 0, "TokenRegistry: zero VRAM");
        require(bytes(tier).length > 0, "TokenRegistry: empty tier");

        _gpuTypes[tokenId] = GpuMeta({
            id: tokenId,
            name: name,
            vramGb: vramGb,
            tier: tier,
            active: true
        });

        _exists[tokenId] = true;
        _registeredIds.push(tokenId);

        emit GpuTypeRegistered(tokenId, name);
    }

    /// @notice Deactivate a GPU type (no new orders accepted)
    function deactivateGpuType(uint256 tokenId) external onlyRole(REGISTRY_ADMIN_ROLE) {
        require(_exists[tokenId], "TokenRegistry: GPU type not found");
        require(_gpuTypes[tokenId].active, "TokenRegistry: already inactive");

        _gpuTypes[tokenId].active = false;
        emit GpuTypeDeactivated(tokenId);
    }

    /// @notice Reactivate a previously deactivated GPU type
    function reactivateGpuType(uint256 tokenId) external onlyRole(REGISTRY_ADMIN_ROLE) {
        require(_exists[tokenId], "TokenRegistry: GPU type not found");
        require(!_gpuTypes[tokenId].active, "TokenRegistry: already active");

        _gpuTypes[tokenId].active = true;
        emit GpuTypeReactivated(tokenId);
    }

    /// @notice Get metadata for a specific GPU type
    function getGpuType(uint256 tokenId) external view returns (GpuMeta memory) {
        require(_exists[tokenId], "TokenRegistry: GPU type not found");
        return _gpuTypes[tokenId];
    }

    /// @notice Get all currently active GPU types
    function getAllActiveGpuTypes() external view returns (GpuMeta[] memory) {
        uint256 activeCount = _countActive();
        GpuMeta[] memory result = new GpuMeta[](activeCount);

        uint256 idx;
        for (uint256 i = 0; i < _registeredIds.length; i++) {
            if (_gpuTypes[_registeredIds[i]].active) {
                result[idx] = _gpuTypes[_registeredIds[i]];
                idx++;
            }
        }

        return result;
    }

    /// @notice Check if a GPU type is registered and active
    function isValidGpuType(uint256 tokenId) external view returns (bool) {
        return _exists[tokenId] && _gpuTypes[tokenId].active;
    }

    /// @notice Get the number of currently active GPU types
    function getActiveGpuCount() external view returns (uint256) {
        return _countActive();
    }

    /// @notice Get the total number of registered GPU types (active + inactive)
    function getTotalRegistered() external view returns (uint256) {
        return _registeredIds.length;
    }

    function _countActive() private view returns (uint256 count) {
        for (uint256 i = 0; i < _registeredIds.length; i++) {
            if (_gpuTypes[_registeredIds[i]].active) {
                count++;
            }
        }
    }
}
