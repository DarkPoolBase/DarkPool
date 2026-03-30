// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICircuitMarketplace {
    struct Circuit {
        uint256 id;
        string name;
        string version;
        bytes32 verifierHash;
        bytes32 circuitSourceHash;
        address developer;
        uint256 price;
        uint256 totalPurchases;
        uint256 totalEarned;
        uint256 curationScore;
        bool active;
    }

    event CircuitPublished(uint256 indexed circuitId, address indexed developer, string name, uint256 price);
    event CircuitPurchased(uint256 indexed circuitId, address indexed buyer, uint256 price);
    event CircuitCurated(uint256 indexed circuitId, address indexed curator, bool upvote, uint256 newScore);
    event CircuitUpdated(uint256 indexed circuitId, string version, bytes32 verifierHash);
    event CircuitDeactivated(uint256 indexed circuitId);
    event DeveloperWithdrawal(address indexed developer, uint256 amount);

    function publishCircuit(string calldata name, string calldata version, bytes32 verifierHash, bytes32 circuitSourceHash, uint256 price) external returns (uint256);
    function purchaseCircuit(uint256 circuitId) external;
    function curateCircuit(uint256 circuitId, bool upvote) external;
    function updateCircuit(uint256 circuitId, string calldata version, bytes32 verifierHash) external;
    function deactivateCircuit(uint256 circuitId) external;
    function withdrawEarnings() external;
    function getCircuit(uint256 circuitId) external view returns (Circuit memory);
    function listCircuits(bool onlyActive) external view returns (Circuit[] memory);
    function developerBalance(address developer) external view returns (uint256);
}
