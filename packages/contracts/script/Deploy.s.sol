// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/DarkPool.sol";
import "../src/Escrow.sol";
import "../src/SettlementVerifier.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address usdc = vm.envAddress("USDC_CONTRACT_ADDRESS");
        address feeCollector = vm.envOr("FEE_COLLECTOR_ADDRESS", deployer);
        address relayer = vm.envOr("RELAYER_ADDRESS", deployer);

        vm.startBroadcast(deployerKey);

        // 1. Deploy Escrow
        Escrow escrow = new Escrow(usdc, feeCollector);
        console.log("Escrow deployed at:", address(escrow));

        // 2. Deploy SettlementVerifier
        SettlementVerifier verifier = new SettlementVerifier(relayer);
        console.log("SettlementVerifier deployed at:", address(verifier));

        // 3. Deploy DarkPool
        DarkPool darkPool = new DarkPool(address(escrow), address(verifier));
        console.log("DarkPool deployed at:", address(darkPool));

        // 4. Grant DARKPOOL_ROLE on Escrow to DarkPool
        escrow.grantRole(escrow.DARKPOOL_ROLE(), address(darkPool));
        console.log("Granted DARKPOOL_ROLE to DarkPool");

        // 5. Grant RELAYER_ROLE on DarkPool to relayer
        darkPool.grantRole(darkPool.RELAYER_ROLE(), relayer);
        console.log("Granted RELAYER_ROLE to relayer:", relayer);

        vm.stopBroadcast();

        console.log("--- Deployment Complete ---");
        console.log("Deployer:", deployer);
        console.log("USDC:", usdc);
        console.log("Fee Collector:", feeCollector);
    }
}
