// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library Constants {
    uint256 constant MAX_BATCH_SIZE = 500;
    uint256 constant MIN_ORDER_AMOUNT = 1e4; // 0.01 USDC
    uint256 constant MAX_ORDER_AMOUNT = 1_000_000e6; // 1M USDC
    uint256 constant ORDER_EXPIRY_DURATION = 7 days;
    uint256 constant BPS_DENOMINATOR = 10000;
    uint256 constant DEFAULT_FEE_BPS = 80; // 0.8%
    uint256 constant MAX_FEE_BPS = 500; // 5%
    
    // Base Sepolia USDC
    address constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
}
// DarkPool protocol constants v2
