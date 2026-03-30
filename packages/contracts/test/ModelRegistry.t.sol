// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ModelRegistry.sol";
import "../src/ComputeCredit.sol";

contract ModelRegistryTest is Test {
    ModelRegistry public registry;
    ComputeCredit public token;

    address public admin = address(this);
    address public dev1 = address(0xA1);
    address public dev2 = address(0xA2);
    address public inferenceRole = address(0xB1);
    address public slasher = address(0xB2);
    address public nobody = address(0xDEAD);

    uint256 constant MIN_STAKE = 1000e18;
    bytes32 constant INPUT_HASH = keccak256("input-schema-v1");
    bytes32 constant OUTPUT_HASH = keccak256("output-schema-v1");

    function setUp() public {
        token = new ComputeCredit();
        registry = new ModelRegistry(address(token), MIN_STAKE);
        registry.grantRole(registry.INFERENCE_ROLE(), inferenceRole);
        registry.grantRole(registry.SLASHER_ROLE(), slasher);

        // Mint tokens to developers
        token.mint(dev1, 10000e18);
        token.mint(dev2, 10000e18);

        // Approve registry
        vm.prank(dev1);
        token.approve(address(registry), type(uint256).max);
        vm.prank(dev2);
        token.approve(address(registry), type(uint256).max);
    }

    // ========== Register ==========

    function test_RegisterModel() public {
        vm.prank(dev1);
        uint256 id = registry.registerModel(
            "Llama-3-70B", "1.0.0", INPUT_HASH, OUTPUT_HASH, 1, 150, true
        );

        assertEq(id, 1);
        IModelRegistry.ModelMeta memory m = registry.getModel(1);
        assertEq(m.developer, dev1);
        assertEq(m.name, "Llama-3-70B");
        assertEq(m.version, "1.0.0");
        assertEq(m.requiredGpu, 1);
        assertEq(m.benchmarkScore, 150);
        assertTrue(m.isOpenSource);
        assertTrue(m.active);
        assertEq(m.stakeAmount, 0);
    }

    function test_RegisterMultipleModels() public {
        vm.prank(dev1);
        registry.registerModel("Model-A", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);
        vm.prank(dev2);
        registry.registerModel("Model-B", "2.0", INPUT_HASH, OUTPUT_HASH, 2, 200, false);

        assertEq(registry.modelCount(), 2);
    }

    function test_RevertRegisterEmptyName() public {
        vm.prank(dev1);
        vm.expectRevert("ModelRegistry: empty name");
        registry.registerModel("", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);
    }

    function test_RevertRegisterEmptyVersion() public {
        vm.prank(dev1);
        vm.expectRevert("ModelRegistry: empty version");
        registry.registerModel("Model", "", INPUT_HASH, OUTPUT_HASH, 1, 100, true);
    }

    function test_RevertRegisterEmptyInputSchema() public {
        vm.prank(dev1);
        vm.expectRevert("ModelRegistry: empty input schema");
        registry.registerModel("Model", "1.0", bytes32(0), OUTPUT_HASH, 1, 100, true);
    }

    function test_RevertRegisterInvalidGpu() public {
        vm.prank(dev1);
        vm.expectRevert("ModelRegistry: invalid GPU type");
        registry.registerModel("Model", "1.0", INPUT_HASH, OUTPUT_HASH, 0, 100, true);
    }

    // ========== Update ==========

    function test_UpdateModel() public {
        vm.startPrank(dev1);
        registry.registerModel("Model", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);
        registry.updateModel(1, "2.0", 200);
        vm.stopPrank();

        IModelRegistry.ModelMeta memory m = registry.getModel(1);
        assertEq(m.version, "2.0");
        assertEq(m.benchmarkScore, 200);
    }

    function test_RevertUpdateNotDeveloper() public {
        vm.prank(dev1);
        registry.registerModel("Model", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);

        vm.prank(dev2);
        vm.expectRevert("ModelRegistry: not developer");
        registry.updateModel(1, "2.0", 200);
    }

    // ========== Staking ==========

    function test_StakeForModel() public {
        vm.startPrank(dev1);
        registry.registerModel("Model", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);
        registry.stakeForModel(1, 2000e18);
        vm.stopPrank();

        IModelRegistry.ModelMeta memory m = registry.getModel(1);
        assertEq(m.stakeAmount, 2000e18);
        assertEq(token.balanceOf(address(registry)), 2000e18);
    }

    function test_StakeAccumulates() public {
        vm.startPrank(dev1);
        registry.registerModel("Model", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);
        registry.stakeForModel(1, 1000e18);
        registry.stakeForModel(1, 500e18);
        vm.stopPrank();

        IModelRegistry.ModelMeta memory m = registry.getModel(1);
        assertEq(m.stakeAmount, 1500e18);
    }

    function test_RevertStakeNotDeveloper() public {
        vm.prank(dev1);
        registry.registerModel("Model", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);

        vm.prank(dev2);
        vm.expectRevert("ModelRegistry: not developer");
        registry.stakeForModel(1, 1000e18);
    }

    function test_RevertStakeZero() public {
        vm.startPrank(dev1);
        registry.registerModel("Model", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);
        vm.expectRevert("ModelRegistry: zero stake");
        registry.stakeForModel(1, 0);
        vm.stopPrank();
    }

    // ========== Inference Recording ==========

    function test_RecordInference() public {
        vm.prank(dev1);
        registry.registerModel("Model", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);

        vm.prank(inferenceRole);
        registry.recordInference(1, 50e6);

        IModelRegistry.ModelMeta memory m = registry.getModel(1);
        assertEq(m.totalInferences, 1);
        assertEq(m.totalEarned, 50e6);
    }

    function test_RevertRecordInferenceUnauthorized() public {
        vm.prank(dev1);
        registry.registerModel("Model", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);

        vm.prank(nobody);
        vm.expectRevert();
        registry.recordInference(1, 50e6);
    }

    function test_RevertRecordInferenceInactiveModel() public {
        vm.prank(dev1);
        registry.registerModel("Model", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);
        vm.prank(dev1);
        registry.deactivateModel(1);

        vm.prank(inferenceRole);
        vm.expectRevert("ModelRegistry: model not active");
        registry.recordInference(1, 50e6);
    }

    // ========== Slashing ==========

    function test_SlashModel() public {
        vm.startPrank(dev1);
        registry.registerModel("Model", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);
        registry.stakeForModel(1, 2000e18);
        vm.stopPrank();

        vm.prank(slasher);
        registry.slashModel(1, 500e18, "Failed verification");

        IModelRegistry.ModelMeta memory m = registry.getModel(1);
        assertEq(m.stakeAmount, 1500e18);
        assertTrue(m.active);
    }

    function test_SlashDeactivatesIfBelowMinimum() public {
        vm.startPrank(dev1);
        registry.registerModel("Model", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);
        registry.stakeForModel(1, 1200e18);
        vm.stopPrank();

        vm.prank(slasher);
        registry.slashModel(1, 500e18, "Bad output");

        IModelRegistry.ModelMeta memory m = registry.getModel(1);
        assertEq(m.stakeAmount, 700e18);
        assertFalse(m.active); // Below MIN_STAKE of 1000e18
    }

    function test_RevertSlashUnauthorized() public {
        vm.prank(dev1);
        registry.registerModel("Model", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);

        vm.prank(nobody);
        vm.expectRevert();
        registry.slashModel(1, 100e18, "test");
    }

    // ========== List ==========

    function test_ListModelsAll() public {
        vm.prank(dev1);
        registry.registerModel("A", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);
        vm.prank(dev2);
        registry.registerModel("B", "1.0", INPUT_HASH, OUTPUT_HASH, 2, 200, false);

        IModelRegistry.ModelMeta[] memory all = registry.listModels(0, false);
        assertEq(all.length, 2);
    }

    function test_ListModelsByGpu() public {
        vm.prank(dev1);
        registry.registerModel("A", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);
        vm.prank(dev2);
        registry.registerModel("B", "1.0", INPUT_HASH, OUTPUT_HASH, 2, 200, false);

        IModelRegistry.ModelMeta[] memory h100Only = registry.listModels(1, false);
        assertEq(h100Only.length, 1);
        assertEq(h100Only[0].requiredGpu, 1);
    }

    function test_ListModelsActiveOnly() public {
        vm.prank(dev1);
        registry.registerModel("A", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);
        vm.prank(dev2);
        registry.registerModel("B", "1.0", INPUT_HASH, OUTPUT_HASH, 2, 200, false);

        vm.prank(dev1);
        registry.deactivateModel(1);

        IModelRegistry.ModelMeta[] memory active = registry.listModels(0, true);
        assertEq(active.length, 1);
        assertEq(active[0].name, "B");
    }

    // ========== Deactivate ==========

    function test_DeactivateByDeveloper() public {
        vm.prank(dev1);
        registry.registerModel("Model", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);
        vm.prank(dev1);
        registry.deactivateModel(1);

        assertFalse(registry.getModel(1).active);
    }

    function test_DeactivateByAdmin() public {
        vm.prank(dev1);
        registry.registerModel("Model", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);

        registry.deactivateModel(1); // admin

        assertFalse(registry.getModel(1).active);
    }

    function test_RevertDeactivateUnauthorized() public {
        vm.prank(dev1);
        registry.registerModel("Model", "1.0", INPUT_HASH, OUTPUT_HASH, 1, 100, true);

        vm.prank(nobody);
        vm.expectRevert("ModelRegistry: not authorized");
        registry.deactivateModel(1);
    }
}
