// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/X402PrivacyPool.sol";

contract DeployPrivacyPoolScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address usdc = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913; // Base Mainnet USDC

        vm.startBroadcast(deployerKey);

        // Deploy X402PrivacyPool (feeRecipient = deployer)
        X402PrivacyPool pool = new X402PrivacyPool(deployer);
        console.log("X402PrivacyPool deployed at:", address(pool));

        // Add USDC as supported token
        pool.addSupportedToken(usdc);
        console.log("Added USDC as supported token");

        vm.stopBroadcast();

        console.log("--- Privacy Pool Deployment Complete ---");
        console.log("Deployer:", deployer);
        console.log("Fee Recipient:", deployer);
        console.log("USDC:", usdc);
    }
}
