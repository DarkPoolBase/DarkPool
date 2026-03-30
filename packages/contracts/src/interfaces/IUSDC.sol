// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title IUSDC - Interface for USDC on Base
/// @notice Extends IERC20 with USDC-specific functionality
interface IUSDC is IERC20 {
    function decimals() external view returns (uint8);
}
