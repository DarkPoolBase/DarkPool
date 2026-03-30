// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/DataProvenance.sol";

contract DataProvenanceTest is Test {
    DataProvenance public nft;

    address public admin = address(this);
    address public provider1 = address(0xA1);
    address public provider2 = address(0xA2);
    address public marketplace = address(0xB1);
    address public buyer = address(0xC1);
    address public nobody = address(0xDEAD);

    bytes32 constant META_HASH = keccak256("dataset-v1-metadata");
    bytes32 constant META_HASH_V2 = keccak256("dataset-v2-metadata");

    function setUp() public {
        nft = new DataProvenance();
        nft.grantRole(nft.MARKETPLACE_ROLE(), marketplace);
    }

    // ========== Minting ==========

    function test_MintDataset() public {
        uint256 tokenId = nft.mintDataset(
            provider1, META_HASH, "HEALTHCARE", "parquet", 50, 85, 500
        );

        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(1), provider1);
        assertEq(nft.totalSupply(), 1);

        IDataProvenance.DatasetMeta memory meta = nft.getDatasetMeta(1);
        assertEq(meta.metadataHash, META_HASH);
        assertEq(meta.category, "HEALTHCARE");
        assertEq(meta.format, "parquet");
        assertEq(meta.sizeGb, 50);
        assertEq(meta.qualityScore, 85);
        assertEq(meta.royaltyBps, 500);
        assertEq(meta.accessCount, 0);
        assertTrue(meta.active);
    }

    function test_MintMultipleDatasets() public {
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 50, 85, 500);
        nft.mintDataset(provider2, keccak256("other"), "FINANCE", "csv", 100, 92, 300);

        assertEq(nft.totalSupply(), 2);
        assertEq(nft.ownerOf(1), provider1);
        assertEq(nft.ownerOf(2), provider2);
    }

    function test_MintEmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit IDataProvenance.DatasetMinted(1, provider1, META_HASH, "HEALTHCARE");
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 50, 85, 500);
    }

    function test_RevertMintZeroProvider() public {
        vm.expectRevert("DataProvenance: zero provider");
        nft.mintDataset(address(0), META_HASH, "HEALTHCARE", "parquet", 50, 85, 500);
    }

    function test_RevertMintEmptyHash() public {
        vm.expectRevert("DataProvenance: empty metadata hash");
        nft.mintDataset(provider1, bytes32(0), "HEALTHCARE", "parquet", 50, 85, 500);
    }

    function test_RevertMintEmptyCategory() public {
        vm.expectRevert("DataProvenance: empty category");
        nft.mintDataset(provider1, META_HASH, "", "parquet", 50, 85, 500);
    }

    function test_RevertMintEmptyFormat() public {
        vm.expectRevert("DataProvenance: empty format");
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "", 50, 85, 500);
    }

    function test_RevertMintZeroSize() public {
        vm.expectRevert("DataProvenance: zero size");
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 0, 85, 500);
    }

    function test_RevertMintQualityOver100() public {
        vm.expectRevert("DataProvenance: quality score exceeds 100");
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 50, 101, 500);
    }

    function test_RevertMintRoyaltyTooHigh() public {
        vm.expectRevert("DataProvenance: royalty too high");
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 50, 85, 2501);
    }

    function test_RevertMintUnauthorized() public {
        vm.prank(nobody);
        vm.expectRevert();
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 50, 85, 500);
    }

    // ========== Royalties (ERC-2981) ==========

    function test_RoyaltyInfo() public {
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 50, 85, 500);

        // 500 bps = 5% of 10000 USDC = 500 USDC
        (address receiver, uint256 royaltyAmount) = nft.royaltyInfo(1, 10000e6);
        assertEq(receiver, provider1);
        assertEq(royaltyAmount, 500e6);
    }

    // ========== Access Tracking ==========

    function test_RecordAccess() public {
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 50, 85, 500);

        vm.prank(marketplace);
        nft.recordAccess(1, buyer, 100e6);

        assertEq(nft.accessCount(1), 1);
    }

    function test_RecordMultipleAccesses() public {
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 50, 85, 500);

        vm.startPrank(marketplace);
        nft.recordAccess(1, buyer, 100e6);
        nft.recordAccess(1, buyer, 100e6);
        nft.recordAccess(1, address(0xC2), 50e6);
        vm.stopPrank();

        assertEq(nft.accessCount(1), 3);
    }

    function test_RecordAccessEmitsEvent() public {
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 50, 85, 500);

        vm.prank(marketplace);
        vm.expectEmit(true, true, false, true);
        emit IDataProvenance.DatasetAccessed(1, buyer, 100e6);
        nft.recordAccess(1, buyer, 100e6);
    }

    function test_RevertRecordAccessUnauthorized() public {
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 50, 85, 500);

        vm.prank(nobody);
        vm.expectRevert();
        nft.recordAccess(1, buyer, 100e6);
    }

    function test_RevertRecordAccessInactiveDataset() public {
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 50, 85, 500);

        vm.prank(provider1);
        nft.deactivateDataset(1);

        vm.prank(marketplace);
        vm.expectRevert("DataProvenance: dataset not active");
        nft.recordAccess(1, buyer, 100e6);
    }

    // ========== Update Metadata ==========

    function test_UpdateMetadataHash() public {
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 50, 85, 500);

        vm.prank(provider1);
        nft.updateMetadataHash(1, META_HASH_V2);

        IDataProvenance.DatasetMeta memory meta = nft.getDatasetMeta(1);
        assertEq(meta.metadataHash, META_HASH_V2);
    }

    function test_RevertUpdateNotOwner() public {
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 50, 85, 500);

        vm.prank(nobody);
        vm.expectRevert("DataProvenance: not owner");
        nft.updateMetadataHash(1, META_HASH_V2);
    }

    function test_RevertUpdateEmptyHash() public {
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 50, 85, 500);

        vm.prank(provider1);
        vm.expectRevert("DataProvenance: empty hash");
        nft.updateMetadataHash(1, bytes32(0));
    }

    // ========== Deactivation ==========

    function test_DeactivateByOwner() public {
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 50, 85, 500);

        vm.prank(provider1);
        nft.deactivateDataset(1);

        IDataProvenance.DatasetMeta memory meta = nft.getDatasetMeta(1);
        assertFalse(meta.active);
    }

    function test_DeactivateByAdmin() public {
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 50, 85, 500);

        nft.deactivateDataset(1); // admin = address(this)

        IDataProvenance.DatasetMeta memory meta = nft.getDatasetMeta(1);
        assertFalse(meta.active);
    }

    function test_RevertDeactivateUnauthorized() public {
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 50, 85, 500);

        vm.prank(nobody);
        vm.expectRevert("DataProvenance: not authorized");
        nft.deactivateDataset(1);
    }

    function test_RevertDeactivateAlreadyInactive() public {
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 50, 85, 500);

        vm.prank(provider1);
        nft.deactivateDataset(1);

        vm.prank(provider1);
        vm.expectRevert("DataProvenance: already inactive");
        nft.deactivateDataset(1);
    }

    // ========== ERC-721 ==========

    function test_TransferDataset() public {
        nft.mintDataset(provider1, META_HASH, "HEALTHCARE", "parquet", 50, 85, 500);

        vm.prank(provider1);
        nft.transferFrom(provider1, provider2, 1);

        assertEq(nft.ownerOf(1), provider2);
    }

    function test_SupportsInterface() public view {
        // ERC-721
        assertTrue(nft.supportsInterface(0x80ac58cd));
        // ERC-2981
        assertTrue(nft.supportsInterface(0x2a55205a));
        // AccessControl
        assertTrue(nft.supportsInterface(0x7965db0b));
    }

    // ========== Fuzz ==========

    function testFuzz_MintWithVaryingQuality(uint256 quality) public {
        vm.assume(quality <= 100);
        uint256 tokenId = nft.mintDataset(
            provider1, META_HASH, "NLP", "jsonl", 10, quality, 300
        );
        IDataProvenance.DatasetMeta memory meta = nft.getDatasetMeta(tokenId);
        assertEq(meta.qualityScore, quality);
    }
}
