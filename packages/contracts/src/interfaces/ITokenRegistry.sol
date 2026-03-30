// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ITokenRegistry {
    struct GpuMeta {
        uint256 id;
        string name;
        uint256 vramGb;
        string tier;
        bool active;
    }

    event GpuTypeRegistered(uint256 indexed tokenId, string name);
    event GpuTypeDeactivated(uint256 indexed tokenId);
    event GpuTypeReactivated(uint256 indexed tokenId);

    function registerGpuType(
        uint256 tokenId,
        string calldata name,
        uint256 vramGb,
        string calldata tier
    ) external;

    function deactivateGpuType(uint256 tokenId) external;
    function reactivateGpuType(uint256 tokenId) external;
    function getGpuType(uint256 tokenId) external view returns (GpuMeta memory);
    function getAllActiveGpuTypes() external view returns (GpuMeta[] memory);
    function isValidGpuType(uint256 tokenId) external view returns (bool);
    function getActiveGpuCount() external view returns (uint256);
}
