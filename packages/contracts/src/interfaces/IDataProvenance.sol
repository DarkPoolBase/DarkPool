// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDataProvenance {
    struct DatasetMeta {
        bytes32 metadataHash;
        string category;
        string format;
        uint256 sizeGb;
        uint256 qualityScore;
        uint96 royaltyBps;
        uint256 accessCount;
        bool active;
    }

    event DatasetMinted(
        uint256 indexed tokenId,
        address indexed provider,
        bytes32 metadataHash,
        string category
    );
    event DatasetAccessed(uint256 indexed tokenId, address indexed accessor, uint256 payment);
    event DatasetUpdated(uint256 indexed tokenId, bytes32 newMetadataHash);
    event DatasetDeactivated(uint256 indexed tokenId);

    function mintDataset(
        address provider,
        bytes32 metadataHash,
        string calldata category,
        string calldata format,
        uint256 sizeGb,
        uint256 qualityScore,
        uint96 royaltyBps
    ) external returns (uint256);

    function recordAccess(uint256 tokenId, address accessor, uint256 payment) external;
    function updateMetadataHash(uint256 tokenId, bytes32 newHash) external;
    function deactivateDataset(uint256 tokenId) external;
    function getDatasetMeta(uint256 tokenId) external view returns (DatasetMeta memory);
    function accessCount(uint256 tokenId) external view returns (uint256);
}
