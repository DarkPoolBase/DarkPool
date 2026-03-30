// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ICircuitMarketplace.sol";

/// @title CircuitMarketplace - Publish, purchase, and curate ZK circuits
/// @notice A marketplace for developers to publish Noir ZK circuits and for
/// users to purchase per-use access. Includes community curation and a
/// platform fee split.
contract CircuitMarketplace is ICircuitMarketplace, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant CURATOR_ROLE = keccak256("CURATOR_ROLE");

    IERC20 public immutable paymentToken;
    address public feeRecipient;
    uint256 public platformFeeBps; // basis points, default 500 = 5%

    uint256 public circuitCount;
    mapping(uint256 => Circuit) private _circuits;
    uint256[] private _circuitIds;

    mapping(address => uint256) private _developerBalances;
    mapping(uint256 => mapping(address => bool)) private _hasCurated;
    mapping(uint256 => mapping(address => bool)) private _hasPurchased;

    constructor(address _paymentToken, address _feeRecipient) {
        require(_paymentToken != address(0), "CircuitMarketplace: zero token");
        require(_feeRecipient != address(0), "CircuitMarketplace: zero fee recipient");
        paymentToken = IERC20(_paymentToken);
        feeRecipient = _feeRecipient;
        platformFeeBps = 500; // 5%
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ========== Publish ==========

    /// @notice Publish a new circuit to the marketplace
    function publishCircuit(
        string calldata name,
        string calldata version,
        bytes32 verifierHash,
        bytes32 circuitSourceHash,
        uint256 price
    ) external returns (uint256) {
        require(bytes(name).length > 0, "CircuitMarketplace: empty name");
        require(bytes(version).length > 0, "CircuitMarketplace: empty version");
        require(verifierHash != bytes32(0), "CircuitMarketplace: zero verifier hash");
        require(circuitSourceHash != bytes32(0), "CircuitMarketplace: zero source hash");
        require(price > 0, "CircuitMarketplace: zero price");

        uint256 circuitId = ++circuitCount;

        _circuits[circuitId] = Circuit({
            id: circuitId,
            name: name,
            version: version,
            verifierHash: verifierHash,
            circuitSourceHash: circuitSourceHash,
            developer: msg.sender,
            price: price,
            totalPurchases: 0,
            totalEarned: 0,
            curationScore: 0,
            active: true
        });

        _circuitIds.push(circuitId);

        emit CircuitPublished(circuitId, msg.sender, name, price);
        return circuitId;
    }

    // ========== Purchase ==========

    /// @notice Purchase access to a circuit
    function purchaseCircuit(uint256 circuitId) external nonReentrant {
        Circuit storage c = _circuits[circuitId];
        require(c.active, "CircuitMarketplace: circuit not active");
        require(!_hasPurchased[circuitId][msg.sender], "CircuitMarketplace: already purchased");

        uint256 fee = (c.price * platformFeeBps) / 10000;
        uint256 devShare = c.price - fee;

        paymentToken.safeTransferFrom(msg.sender, feeRecipient, fee);
        paymentToken.safeTransferFrom(msg.sender, address(this), devShare);

        _developerBalances[c.developer] += devShare;
        c.totalPurchases += 1;
        c.totalEarned += devShare;
        _hasPurchased[circuitId][msg.sender] = true;

        emit CircuitPurchased(circuitId, msg.sender, c.price);
    }

    // ========== Curate ==========

    /// @notice Vote on a circuit (upvote or downvote)
    function curateCircuit(uint256 circuitId, bool upvote) external {
        require(_circuits[circuitId].id != 0, "CircuitMarketplace: circuit not found");
        require(!_hasCurated[circuitId][msg.sender], "CircuitMarketplace: already curated");

        _hasCurated[circuitId][msg.sender] = true;

        Circuit storage c = _circuits[circuitId];
        if (upvote) {
            c.curationScore += 1;
        } else {
            if (c.curationScore > 0) {
                c.curationScore -= 1;
            }
        }

        emit CircuitCurated(circuitId, msg.sender, upvote, c.curationScore);
    }

    // ========== Update ==========

    /// @notice Update a circuit's version and verifier hash (developer only)
    function updateCircuit(uint256 circuitId, string calldata version, bytes32 verifierHash) external {
        Circuit storage c = _circuits[circuitId];
        require(c.developer == msg.sender, "CircuitMarketplace: not developer");
        require(bytes(version).length > 0, "CircuitMarketplace: empty version");
        require(verifierHash != bytes32(0), "CircuitMarketplace: zero verifier hash");

        c.version = version;
        c.verifierHash = verifierHash;

        emit CircuitUpdated(circuitId, version, verifierHash);
    }

    // ========== Deactivate ==========

    /// @notice Deactivate a circuit (developer or admin)
    function deactivateCircuit(uint256 circuitId) external {
        Circuit storage c = _circuits[circuitId];
        require(
            c.developer == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "CircuitMarketplace: unauthorized"
        );
        require(c.active, "CircuitMarketplace: already inactive");

        c.active = false;

        emit CircuitDeactivated(circuitId);
    }

    // ========== Withdraw ==========

    /// @notice Withdraw accumulated developer earnings
    function withdrawEarnings() external nonReentrant {
        uint256 balance = _developerBalances[msg.sender];
        require(balance > 0, "CircuitMarketplace: zero balance");

        _developerBalances[msg.sender] = 0;
        paymentToken.safeTransfer(msg.sender, balance);

        emit DeveloperWithdrawal(msg.sender, balance);
    }

    // ========== Views ==========

    /// @notice Get a circuit by ID
    function getCircuit(uint256 circuitId) external view returns (Circuit memory) {
        require(_circuits[circuitId].id != 0, "CircuitMarketplace: circuit not found");
        return _circuits[circuitId];
    }

    /// @notice List all circuits, optionally filtering to active only
    function listCircuits(bool onlyActive) external view returns (Circuit[] memory) {
        uint256 total = _circuitIds.length;

        // First pass: count matching circuits
        uint256 count = 0;
        for (uint256 i = 0; i < total; i++) {
            if (!onlyActive || _circuits[_circuitIds[i]].active) {
                count++;
            }
        }

        // Second pass: populate array
        Circuit[] memory result = new Circuit[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < total; i++) {
            Circuit storage c = _circuits[_circuitIds[i]];
            if (!onlyActive || c.active) {
                result[idx++] = c;
            }
        }

        return result;
    }

    /// @notice Get a developer's accumulated balance
    function developerBalance(address developer) external view returns (uint256) {
        return _developerBalances[developer];
    }

    // ========== Admin ==========

    /// @notice Set the platform fee (admin only, max 10%)
    function setPlatformFee(uint256 newFeeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFeeBps <= 1000, "CircuitMarketplace: fee exceeds 10%");
        platformFeeBps = newFeeBps;
    }
}
