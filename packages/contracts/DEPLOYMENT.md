# Deployment Guide

## Prerequisites
- Foundry installed (`curl -L https://foundry.paradigm.xyz | bash`)
- Base Sepolia ETH for gas
- USDC on Base Sepolia

## Deploy to Base Sepolia
```bash
source .env
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC --broadcast --verify
```

## Contract Addresses (Base Sepolia)
- Escrow: TBD
- SettlementVerifier: TBD
- DarkPool: TBD
- USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
