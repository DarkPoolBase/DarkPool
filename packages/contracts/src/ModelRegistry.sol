// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IModelRegistry.sol";

/// @title ModelRegistry - On-chain registry for AI models
/// @notice Model developers register and stake on their models. Models are encrypted
/// and only executable inside verified TEEs. Staking with slashing ensures quality.
contract ModelRegistry is IModelRegistry, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant INFERENCE_ROLE = keccak256("INFERENCE_ROLE");
    bytes32 public constant SLASHER_ROLE = keccak256("SLASHER_ROLE");

    IERC20 public immutable stakingToken;

    uint256 public modelCount;
    uint256 public minimumStake;

    mapping(uint256 => ModelMeta) private _models;
    uint256[] private _modelIds;

    constructor(address _stakingToken, uint256 _minimumStake) {
        require(_stakingToken != address(0), "ModelRegistry: zero token");
        stakingToken = IERC20(_stakingToken);
        minimumStake = _minimumStake;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Register a new AI model
    function registerModel(
        string calldata name,
        string calldata version,
        bytes32 inputSchemaHash,
        bytes32 outputSchemaHash,
        uint256 requiredGpu,
        uint256 benchmarkScore,
        bool isOpenSource
    ) external returns (uint256) {
        require(bytes(name).length > 0, "ModelRegistry: empty name");
        require(bytes(version).length > 0, "ModelRegistry: empty version");
        require(inputSchemaHash != bytes32(0), "ModelRegistry: empty input schema");
        require(outputSchemaHash != bytes32(0), "ModelRegistry: empty output schema");
        require(requiredGpu > 0, "ModelRegistry: invalid GPU type");

        modelCount++;
        uint256 modelId = modelCount;

        _models[modelId] = ModelMeta({
            id: modelId,
            name: name,
            version: version,
            inputSchemaHash: inputSchemaHash,
            outputSchemaHash: outputSchemaHash,
            requiredGpu: requiredGpu,
            benchmarkScore: benchmarkScore,
            isOpenSource: isOpenSource,
            developer: msg.sender,
            stakeAmount: 0,
            totalInferences: 0,
            totalEarned: 0,
            active: true
        });

        _modelIds.push(modelId);

        emit ModelRegistered(modelId, msg.sender, name);
        return modelId;
    }

    /// @notice Update model version and benchmark (developer only)
    function updateModel(
        uint256 modelId,
        string calldata version,
        uint256 benchmarkScore
    ) external {
        ModelMeta storage model = _models[modelId];
        require(model.id != 0, "ModelRegistry: model not found");
        require(model.developer == msg.sender, "ModelRegistry: not developer");
        require(bytes(version).length > 0, "ModelRegistry: empty version");

        model.version = version;
        model.benchmarkScore = benchmarkScore;

        emit ModelUpdated(modelId, version, benchmarkScore);
    }

    /// @notice Stake tokens on a model to list it in the registry
    function stakeForModel(uint256 modelId, uint256 amount) external nonReentrant {
        ModelMeta storage model = _models[modelId];
        require(model.id != 0, "ModelRegistry: model not found");
        require(model.developer == msg.sender, "ModelRegistry: not developer");
        require(amount > 0, "ModelRegistry: zero stake");

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        model.stakeAmount += amount;

        emit ModelStaked(modelId, msg.sender, amount);
    }

    /// @notice Get model metadata
    function getModel(uint256 modelId) external view returns (ModelMeta memory) {
        require(_models[modelId].id != 0, "ModelRegistry: model not found");
        return _models[modelId];
    }

    /// @notice List models filtered by GPU type and active status
    function listModels(
        uint256 requiredGpu,
        bool onlyActive
    ) external view returns (ModelMeta[] memory) {
        uint256 count;
        for (uint256 i = 0; i < _modelIds.length; i++) {
            ModelMeta storage m = _models[_modelIds[i]];
            bool gpuMatch = requiredGpu == 0 || m.requiredGpu == requiredGpu;
            bool activeMatch = !onlyActive || m.active;
            if (gpuMatch && activeMatch) count++;
        }

        ModelMeta[] memory result = new ModelMeta[](count);
        uint256 idx;
        for (uint256 i = 0; i < _modelIds.length; i++) {
            ModelMeta storage m = _models[_modelIds[i]];
            bool gpuMatch = requiredGpu == 0 || m.requiredGpu == requiredGpu;
            bool activeMatch = !onlyActive || m.active;
            if (gpuMatch && activeMatch) {
                result[idx] = m;
                idx++;
            }
        }

        return result;
    }

    /// @notice Record an inference execution and accumulate fees
    function recordInference(
        uint256 modelId,
        uint256 fee
    ) external onlyRole(INFERENCE_ROLE) {
        ModelMeta storage model = _models[modelId];
        require(model.id != 0, "ModelRegistry: model not found");
        require(model.active, "ModelRegistry: model not active");

        model.totalInferences++;
        model.totalEarned += fee;

        emit InferenceRecorded(modelId, fee);
    }

    /// @notice Slash a model's stake for failed verification
    function slashModel(
        uint256 modelId,
        uint256 amount,
        string calldata reason
    ) external onlyRole(SLASHER_ROLE) {
        ModelMeta storage model = _models[modelId];
        require(model.id != 0, "ModelRegistry: model not found");
        require(model.stakeAmount >= amount, "ModelRegistry: insufficient stake");

        model.stakeAmount -= amount;

        // If stake drops below minimum, deactivate
        if (model.stakeAmount < minimumStake) {
            model.active = false;
            emit ModelDeactivated(modelId);
        }

        emit ModelSlashed(modelId, amount, reason);
    }

    /// @notice Deactivate a model (developer or admin)
    function deactivateModel(uint256 modelId) external {
        ModelMeta storage model = _models[modelId];
        require(model.id != 0, "ModelRegistry: model not found");
        require(
            model.developer == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "ModelRegistry: not authorized"
        );
        require(model.active, "ModelRegistry: already inactive");

        model.active = false;
        emit ModelDeactivated(modelId);
    }

    /// @notice Update minimum stake requirement (admin only)
    function setMinimumStake(uint256 _minimumStake) external onlyRole(DEFAULT_ADMIN_ROLE) {
        minimumStake = _minimumStake;
    }
}
