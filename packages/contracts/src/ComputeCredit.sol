// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IComputeCredit.sol";

/// @title ComputeCredit - ERC-20 token for GPU compute credits
/// @notice Users purchase credits with USDC to streamline repeat transactions on the Dark Pool
contract ComputeCredit is ERC20, AccessControl, Pausable, IComputeCredit {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant DARKPOOL_ROLE = keccak256("DARKPOOL_ROLE");

    /// @notice Credits per 1 USDC (6 decimals). Default: 1 USDC = 1 credit (1e18)
    uint256 private _exchangeRate;

    constructor() ERC20("ADP Compute Credit", "ADPC") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _exchangeRate = 1e18; // 1:1 with USDC (adjusted for decimal difference)
    }

    /// @notice Mint compute credits. Called after USDC deposit is verified.
    /// @param to Recipient of the minted credits
    /// @param amount Amount of credits to mint (18 decimals)
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(to != address(0), "ComputeCredit: mint to zero address");
        require(amount > 0, "ComputeCredit: zero amount");
        _mint(to, amount);
        emit CreditsMinted(to, amount, 0);
    }

    /// @notice Burn credits when used for order payment. Called by DarkPool.
    /// @param from Address whose credits are burned
    /// @param amount Amount of credits to burn (18 decimals)
    function burn(address from, uint256 amount) external onlyRole(DARKPOOL_ROLE) {
        require(amount > 0, "ComputeCredit: zero amount");
        require(balanceOf(from) >= amount, "ComputeCredit: insufficient balance");
        _burn(from, amount);
        emit CreditsBurned(from, amount);
    }

    /// @notice Get the current USDC-to-credit exchange rate
    /// @return The number of credit tokens (18 decimals) per 1 USDC (6 decimals)
    function exchangeRate() external view returns (uint256) {
        return _exchangeRate;
    }

    /// @notice Update the exchange rate (admin only)
    /// @param newRate New credits per USDC
    function setExchangeRate(uint256 newRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRate > 0, "ComputeCredit: zero exchange rate");
        uint256 oldRate = _exchangeRate;
        _exchangeRate = newRate;
        emit ExchangeRateUpdated(oldRate, newRate);
    }

    /// @notice Pause minting in case of emergency
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpause minting
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
