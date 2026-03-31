// Contract addresses - Base Sepolia testnet
export const CONTRACTS = {
  DARK_POOL: '0x0000000000000000000000000000000000000000', // TODO: Update after deployment
  ESCROW: '0x0000000000000000000000000000000000000000',
  SETTLEMENT_VERIFIER: '0x0000000000000000000000000000000000000000',
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
} as const;

export const CHAIN_CONFIG = {
  chainId: 84532, // Base Sepolia
  name: 'Base Sepolia',
  rpcUrl: 'https://sepolia.base.org',
  blockExplorer: 'https://sepolia.basescan.org',
} as const;

