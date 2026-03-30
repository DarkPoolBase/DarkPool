// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IModelRegistry {
    struct ModelMeta {
        uint256 id;
        string name;
        string version;
        bytes32 inputSchemaHash;
        bytes32 outputSchemaHash;
        uint256 requiredGpu;
        uint256 benchmarkScore;
        bool isOpenSource;
        address developer;
        uint256 stakeAmount;
        uint256 totalInferences;
        uint256 totalEarned;
        bool active;
    }

    event ModelRegistered(uint256 indexed modelId, address indexed developer, string name);
    event ModelUpdated(uint256 indexed modelId, string version, uint256 benchmarkScore);
    event ModelStaked(uint256 indexed modelId, address indexed developer, uint256 amount);
    event ModelSlashed(uint256 indexed modelId, uint256 amount, string reason);
    event ModelDeactivated(uint256 indexed modelId);
    event InferenceRecorded(uint256 indexed modelId, uint256 fee);

    function registerModel(
        string calldata name,
        string calldata version,
        bytes32 inputSchemaHash,
        bytes32 outputSchemaHash,
        uint256 requiredGpu,
        uint256 benchmarkScore,
        bool isOpenSource
    ) external returns (uint256);

    function updateModel(uint256 modelId, string calldata version, uint256 benchmarkScore) external;
    function stakeForModel(uint256 modelId, uint256 amount) external;
    function getModel(uint256 modelId) external view returns (ModelMeta memory);
    function listModels(uint256 requiredGpu, bool onlyActive) external view returns (ModelMeta[] memory);
    function recordInference(uint256 modelId, uint256 fee) external;
    function slashModel(uint256 modelId, uint256 amount, string calldata reason) external;
}
