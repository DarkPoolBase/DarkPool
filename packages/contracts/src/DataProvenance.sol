// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IDataProvenance.sol";

/// @title DataProvenance - Tokenized dataset ownership with royalties
/// @notice ERC-721 NFTs representing datasets in the Private Data Marketplace.
/// Each dataset is a verifiable on-chain asset with automatic royalty distribution
/// to data providers on every access event. Minted via OnchainKit on Base.
contract DataProvenance is ERC721, ERC2981, AccessControl, ReentrancyGuard, IDataProvenance {
    bytes32 public constant MARKETPLACE_ROLE = keccak256("MARKETPLACE_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 private _nextTokenId;

    mapping(uint256 => DatasetMeta) private _datasets;

    constructor() ERC721("ADP Data Provenance", "ADP-DATA") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _nextTokenId = 1;
    }

    /// @notice Mint a new dataset NFT with royalty configuration
    /// @param provider The data provider who owns the dataset
    /// @param metadataHash Hash of the encrypted dataset metadata
    /// @param category Dataset category (HEALTHCARE, FINANCE, NLP, VISION, etc.)
    /// @param format Data format (parquet, csv, jsonl)
    /// @param sizeGb Dataset size in gigabytes
    /// @param qualityScore Quality score 0-100
    /// @param royaltyBps Royalty rate in basis points (e.g., 500 = 5%)
    function mintDataset(
        address provider,
        bytes32 metadataHash,
        string calldata category,
        string calldata format,
        uint256 sizeGb,
        uint256 qualityScore,
        uint96 royaltyBps
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(provider != address(0), "DataProvenance: zero provider");
        require(metadataHash != bytes32(0), "DataProvenance: empty metadata hash");
        require(bytes(category).length > 0, "DataProvenance: empty category");
        require(bytes(format).length > 0, "DataProvenance: empty format");
        require(sizeGb > 0, "DataProvenance: zero size");
        require(qualityScore <= 100, "DataProvenance: quality score exceeds 100");
        require(royaltyBps <= 2500, "DataProvenance: royalty too high"); // max 25%

        uint256 tokenId = _nextTokenId++;

        _safeMint(provider, tokenId);
        _setTokenRoyalty(tokenId, provider, royaltyBps);

        _datasets[tokenId] = DatasetMeta({
            metadataHash: metadataHash,
            category: category,
            format: format,
            sizeGb: sizeGb,
            qualityScore: qualityScore,
            royaltyBps: royaltyBps,
            accessCount: 0,
            active: true
        });

        emit DatasetMinted(tokenId, provider, metadataHash, category);
        return tokenId;
    }

    /// @notice Record a dataset access event and increment counter
    /// @dev Called by the marketplace when a buyer accesses a dataset
    function recordAccess(
        uint256 tokenId,
        address accessor,
        uint256 payment
    ) external onlyRole(MARKETPLACE_ROLE) {
        require(_datasets[tokenId].active, "DataProvenance: dataset not active");
        require(accessor != address(0), "DataProvenance: zero accessor");

        _datasets[tokenId].accessCount++;
        emit DatasetAccessed(tokenId, accessor, payment);
    }

    /// @notice Update the metadata hash for a dataset (new version)
    /// @dev Only the dataset owner can update
    function updateMetadataHash(uint256 tokenId, bytes32 newHash) external {
        require(ownerOf(tokenId) == msg.sender, "DataProvenance: not owner");
        require(newHash != bytes32(0), "DataProvenance: empty hash");

        _datasets[tokenId].metadataHash = newHash;
        emit DatasetUpdated(tokenId, newHash);
    }

    /// @notice Deactivate a dataset (no new access events)
    function deactivateDataset(uint256 tokenId) external {
        require(
            ownerOf(tokenId) == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "DataProvenance: not authorized"
        );
        require(_datasets[tokenId].active, "DataProvenance: already inactive");

        _datasets[tokenId].active = false;
        emit DatasetDeactivated(tokenId);
    }

    /// @notice Get dataset metadata
    function getDatasetMeta(uint256 tokenId) external view returns (DatasetMeta memory) {
        require(_ownerOf(tokenId) != address(0), "DataProvenance: nonexistent token");
        return _datasets[tokenId];
    }

    /// @notice Get total access count for a dataset
    function accessCount(uint256 tokenId) external view returns (uint256) {
        return _datasets[tokenId].accessCount;
    }

    /// @notice Get total number of datasets minted
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    // ========== Required overrides for ERC721 + ERC2981 + AccessControl ==========

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC2981, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
