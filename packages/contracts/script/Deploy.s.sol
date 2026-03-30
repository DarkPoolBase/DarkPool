// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/TokenRegistry.sol";
import "../src/ComputeCredit.sol";
import "../src/FeeCollector.sol";
import "../src/DarkPool.sol";
import "../src/Escrow.sol";
import "../src/SettlementVerifier.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address usdc = vm.envAddress("USDC_CONTRACT_ADDRESS");
        address relayer = vm.envOr("RELAYER_ADDRESS", deployer);
        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);
        address stakerVault = vm.envOr("STAKER_VAULT_ADDRESS", deployer);
        address burnAddress = vm.envOr("BURN_ADDRESS", deployer);

        vm.startBroadcast(deployerKey);

        // 1. Deploy TokenRegistry (no dependencies)
        TokenRegistry tokenRegistry = new TokenRegistry();
        console.log("TokenRegistry deployed at:", address(tokenRegistry));

        // 2. Deploy ComputeCredit (no dependencies)
        ComputeCredit computeCredit = new ComputeCredit();
        console.log("ComputeCredit deployed at:", address(computeCredit));

        // 3. Deploy FeeCollector (no dependencies)
        FeeCollector feeCollector = new FeeCollector(
            usdc,
            treasury,
            stakerVault,
            burnAddress
        );
        console.log("FeeCollector deployed at:", address(feeCollector));

        // 4. Deploy Escrow (depends on USDC, FeeCollector)
        Escrow escrow = new Escrow(usdc, address(feeCollector));
        console.log("Escrow deployed at:", address(escrow));

        // 5. Deploy SettlementVerifier (depends on relayer)
        SettlementVerifier verifier = new SettlementVerifier(relayer);
        console.log("SettlementVerifier deployed at:", address(verifier));

        // 6. Deploy DarkPool (depends on Escrow, SettlementVerifier)
        DarkPool darkPool = new DarkPool(address(escrow), address(verifier));
        console.log("DarkPool deployed at:", address(darkPool));

        // 7. Configure cross-references and roles
        escrow.grantRole(escrow.DARKPOOL_ROLE(), address(darkPool));
        console.log("Granted DARKPOOL_ROLE on Escrow to DarkPool");

        darkPool.grantRole(darkPool.RELAYER_ROLE(), relayer);
        console.log("Granted RELAYER_ROLE on DarkPool to relayer:", relayer);

        feeCollector.grantRole(feeCollector.DARKPOOL_ROLE(), address(darkPool));
        console.log("Granted DARKPOOL_ROLE on FeeCollector to DarkPool");

        computeCredit.grantRole(computeCredit.DARKPOOL_ROLE(), address(darkPool));
        console.log("Granted DARKPOOL_ROLE on ComputeCredit to DarkPool");

        // 8. Register GPU types
        tokenRegistry.registerGpuType(1, "NVIDIA H100 SXM", 80, "Premium");
        tokenRegistry.registerGpuType(2, "NVIDIA A100 SXM", 80, "Standard");
        tokenRegistry.registerGpuType(3, "NVIDIA L40S", 48, "Standard");
        tokenRegistry.registerGpuType(4, "NVIDIA H200", 141, "Premium");
        tokenRegistry.registerGpuType(5, "NVIDIA A10G", 24, "Economy");
        console.log("Registered 5 GPU types in TokenRegistry");

        vm.stopBroadcast();

        console.log("--- Deployment Complete ---");
        console.log("Deployer:", deployer);
        console.log("USDC:", usdc);
        console.log("Treasury:", treasury);
        console.log("Staker Vault:", stakerVault);
        console.log("Burn Address:", burnAddress);
    }
}
