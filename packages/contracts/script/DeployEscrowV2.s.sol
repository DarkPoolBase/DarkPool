// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/Escrow.sol";

contract DeployEscrowV2Script is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address usdc = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913; // Base Mainnet USDC
        address feeCollector = 0x0d110D16444beD3A5AcE873285413677b5e0ad53; // Existing FeeCollector

        vm.startBroadcast(deployerKey);

        // Deploy new Escrow with depositFor support
        Escrow escrow = new Escrow(usdc, feeCollector);
        console.log("Escrow V2 deployed at:", address(escrow));

        // Grant DARKPOOL_ROLE to existing DarkPool contract
        address darkPool = 0xa831E4F285a04Dd9b223a6D6C2bB25F28af6b1b8;
        escrow.grantRole(escrow.DARKPOOL_ROLE(), darkPool);
        console.log("Granted DARKPOOL_ROLE to DarkPool:", darkPool);

        vm.stopBroadcast();

        console.log("--- Escrow V2 Deployment Complete ---");
        console.log("Deployer:", deployer);
        console.log("USDC:", usdc);
        console.log("FeeCollector:", feeCollector);
    }
}
