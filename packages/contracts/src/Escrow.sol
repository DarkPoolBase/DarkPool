// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IEscrow.sol";

/// @title Escrow - Holds USDC funds for the Agentic Dark Pool
/// @notice Manages deposit, withdrawal, locking, and release of USDC for order settlement
contract Escrow is IEscrow, ReentrancyGuard, AccessControl, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant DARKPOOL_ROLE = keccak256("DARKPOOL_ROLE");

    IERC20 public immutable usdc;
    address public feeCollector;

    mapping(address => uint256) private _available;
    mapping(address => uint256) private _locked;

    constructor(address _usdc, address _feeCollector) {
        require(_usdc != address(0), "Escrow: zero USDC address");
        require(_feeCollector != address(0), "Escrow: zero fee collector");
        usdc = IERC20(_usdc);
        feeCollector = _feeCollector;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Deposit USDC into escrow. Must approve this contract first.
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Escrow: zero amount");
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        _available[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    /// @notice Deposit USDC into escrow on behalf of another user. Caller pays, user gets the balance.
    function depositFor(address user, uint256 amount) external nonReentrant whenNotPaused {
        require(user != address(0), "Escrow: zero user address");
        require(amount > 0, "Escrow: zero amount");
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        _available[user] += amount;
        emit Deposited(user, amount);
    }

    /// @notice Withdraw available (unlocked) USDC from escrow
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Escrow: zero amount");
        require(_available[msg.sender] >= amount, "Escrow: insufficient available balance");
        _available[msg.sender] -= amount;
        usdc.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Lock funds when an order is submitted. Called by DarkPool contract.
    function lockFunds(
        address user,
        uint256 amount,
        bytes32 orderId
    ) external onlyRole(DARKPOOL_ROLE) {
        require(_available[user] >= amount, "Escrow: insufficient available balance");
        _available[user] -= amount;
        _locked[user] += amount;
        emit FundsLocked(user, orderId, amount);
    }

    /// @notice Unlock funds when an order is cancelled. Called by DarkPool contract.
    function unlockFunds(
        address user,
        uint256 amount,
        bytes32 orderId
    ) external onlyRole(DARKPOOL_ROLE) {
        require(_locked[user] >= amount, "Escrow: insufficient locked balance");
        _locked[user] -= amount;
        _available[user] += amount;
        emit FundsUnlocked(user, orderId, amount);
    }

    /// @notice Release locked funds from buyer to seller during settlement.
    /// @param from The buyer whose locked funds are released
    /// @param to The seller who receives the funds
    /// @param amount The amount to transfer (after fee deduction)
    /// @param fee The protocol fee sent to the fee collector
    function releaseFunds(
        address from,
        address to,
        uint256 amount,
        uint256 fee
    ) external onlyRole(DARKPOOL_ROLE) nonReentrant {
        uint256 total = amount + fee;
        require(_locked[from] >= total, "Escrow: insufficient locked balance");

        _locked[from] -= total;

        // Transfer payment to seller's available balance
        _available[to] += amount;

        // Transfer fee to fee collector
        if (fee > 0) {
            usdc.safeTransfer(feeCollector, fee);
        }

        emit FundsReleased(from, to, amount, fee);
    }

    /// @notice Get a user's available and locked balances
    function getBalance(address user) external view returns (uint256 available, uint256 locked) {
        return (_available[user], _locked[user]);
    }

    /// @notice Update the fee collector address
    function setFeeCollector(address _feeCollector) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeCollector != address(0), "Escrow: zero fee collector");
        feeCollector = _feeCollector;
    }

    /// @notice Pause the contract in case of emergency
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpause the contract
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}

