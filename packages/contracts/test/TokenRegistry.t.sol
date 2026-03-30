// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/TokenRegistry.sol";

contract TokenRegistryTest is Test {
    TokenRegistry public registry;
    address public admin = address(this);
    address public user = address(0xBEEF);

    function setUp() public {
        registry = new TokenRegistry();
    }

    // ========== Registration ==========

    function test_RegisterGpuType() public {
        registry.registerGpuType(1, "NVIDIA H100 SXM", 80, "Premium");

        ITokenRegistry.GpuMeta memory gpu = registry.getGpuType(1);
        assertEq(gpu.id, 1);
        assertEq(gpu.name, "NVIDIA H100 SXM");
        assertEq(gpu.vramGb, 80);
        assertEq(gpu.tier, "Premium");
        assertTrue(gpu.active);
    }

    function test_RegisterMultipleGpuTypes() public {
        registry.registerGpuType(1, "NVIDIA H100 SXM", 80, "Premium");
        registry.registerGpuType(2, "NVIDIA A100 SXM", 80, "Standard");
        registry.registerGpuType(3, "NVIDIA L40S", 48, "Standard");
        registry.registerGpuType(4, "NVIDIA H200", 141, "Premium");
        registry.registerGpuType(5, "NVIDIA A10G", 24, "Economy");

        assertEq(registry.getTotalRegistered(), 5);
        assertEq(registry.getActiveGpuCount(), 5);
    }

    function test_RevertRegisterDuplicate() public {
        registry.registerGpuType(1, "NVIDIA H100 SXM", 80, "Premium");
        vm.expectRevert("TokenRegistry: GPU type already registered");
        registry.registerGpuType(1, "NVIDIA H100 Duplicate", 80, "Premium");
    }

    function test_RevertRegisterZeroId() public {
        vm.expectRevert("TokenRegistry: invalid token ID");
        registry.registerGpuType(0, "Invalid", 80, "Premium");
    }

    function test_RevertRegisterEmptyName() public {
        vm.expectRevert("TokenRegistry: empty name");
        registry.registerGpuType(1, "", 80, "Premium");
    }

    function test_RevertRegisterZeroVram() public {
        vm.expectRevert("TokenRegistry: zero VRAM");
        registry.registerGpuType(1, "GPU", 0, "Premium");
    }

    function test_RevertRegisterEmptyTier() public {
        vm.expectRevert("TokenRegistry: empty tier");
        registry.registerGpuType(1, "GPU", 80, "");
    }

    function test_RevertRegisterUnauthorized() public {
        vm.prank(user);
        vm.expectRevert();
        registry.registerGpuType(1, "NVIDIA H100 SXM", 80, "Premium");
    }

    function test_EmitGpuTypeRegistered() public {
        vm.expectEmit(true, false, false, true);
        emit ITokenRegistry.GpuTypeRegistered(1, "NVIDIA H100 SXM");
        registry.registerGpuType(1, "NVIDIA H100 SXM", 80, "Premium");
    }

    // ========== Deactivation ==========

    function test_DeactivateGpuType() public {
        registry.registerGpuType(1, "NVIDIA H100 SXM", 80, "Premium");
        registry.deactivateGpuType(1);

        assertFalse(registry.isValidGpuType(1));
        ITokenRegistry.GpuMeta memory gpu = registry.getGpuType(1);
        assertFalse(gpu.active);
    }

    function test_RevertDeactivateNonExistent() public {
        vm.expectRevert("TokenRegistry: GPU type not found");
        registry.deactivateGpuType(99);
    }

    function test_RevertDeactivateAlreadyInactive() public {
        registry.registerGpuType(1, "NVIDIA H100 SXM", 80, "Premium");
        registry.deactivateGpuType(1);

        vm.expectRevert("TokenRegistry: already inactive");
        registry.deactivateGpuType(1);
    }

    function test_RevertDeactivateUnauthorized() public {
        registry.registerGpuType(1, "NVIDIA H100 SXM", 80, "Premium");
        vm.prank(user);
        vm.expectRevert();
        registry.deactivateGpuType(1);
    }

    // ========== Reactivation ==========

    function test_ReactivateGpuType() public {
        registry.registerGpuType(1, "NVIDIA H100 SXM", 80, "Premium");
        registry.deactivateGpuType(1);
        registry.reactivateGpuType(1);

        assertTrue(registry.isValidGpuType(1));
    }

    function test_RevertReactivateAlreadyActive() public {
        registry.registerGpuType(1, "NVIDIA H100 SXM", 80, "Premium");
        vm.expectRevert("TokenRegistry: already active");
        registry.reactivateGpuType(1);
    }

    // ========== Queries ==========

    function test_GetAllActiveGpuTypes() public {
        registry.registerGpuType(1, "NVIDIA H100 SXM", 80, "Premium");
        registry.registerGpuType(2, "NVIDIA A100 SXM", 80, "Standard");
        registry.registerGpuType(3, "NVIDIA L40S", 48, "Standard");

        registry.deactivateGpuType(2);

        ITokenRegistry.GpuMeta[] memory active = registry.getAllActiveGpuTypes();
        assertEq(active.length, 2);
        assertEq(active[0].id, 1);
        assertEq(active[1].id, 3);
    }

    function test_GetAllActiveReturnsEmptyWhenNoneActive() public {
        registry.registerGpuType(1, "NVIDIA H100 SXM", 80, "Premium");
        registry.deactivateGpuType(1);

        ITokenRegistry.GpuMeta[] memory active = registry.getAllActiveGpuTypes();
        assertEq(active.length, 0);
    }

    function test_IsValidGpuType() public {
        registry.registerGpuType(1, "NVIDIA H100 SXM", 80, "Premium");

        assertTrue(registry.isValidGpuType(1));
        assertFalse(registry.isValidGpuType(99));

        registry.deactivateGpuType(1);
        assertFalse(registry.isValidGpuType(1));
    }

    function test_GetGpuTypeRevertsForNonExistent() public {
        vm.expectRevert("TokenRegistry: GPU type not found");
        registry.getGpuType(99);
    }

    // ========== Fuzz ==========

    function testFuzz_RegisterAndRetrieve(uint256 tokenId, uint256 vramGb) public {
        vm.assume(tokenId > 0 && tokenId < 1000);
        vm.assume(vramGb > 0 && vramGb < 1000);

        registry.registerGpuType(tokenId, "Fuzz GPU", vramGb, "Standard");

        ITokenRegistry.GpuMeta memory gpu = registry.getGpuType(tokenId);
        assertEq(gpu.id, tokenId);
        assertEq(gpu.vramGb, vramGb);
        assertTrue(gpu.active);
    }
}
