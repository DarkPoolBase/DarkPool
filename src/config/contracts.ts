// Contract addresses - Base Mainnet (deployed 2026-03-31)
export const CONTRACTS = {
  DARK_POOL: '0xa831E4F285a04Dd9b223a6D6C2bB25F28af6b1b8',
  ESCROW: '0x36077c43166a4eE59D5775FCe433393b43f2140a',
  SETTLEMENT_VERIFIER: '0xE8FEE138F6e3273F31AFa17B9a3bCE0cAa5C8E58',
  TOKEN_REGISTRY: '0x8A230d8948FE78bF5217fbC64d2925014aBd22A4',
  COMPUTE_CREDIT: '0x3Bf6749B12266e5B524bd0EAE51A465eDaa0F28a',
  FEE_COLLECTOR: '0x0d110D16444beD3A5AcE873285413677b5e0ad53',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
} as const;

export const CHAIN_CONFIG = {
  chainId: 8453, // Base Mainnet
  name: 'Base',
  rpcUrl: 'https://mainnet.base.org',
  blockExplorer: 'https://basescan.org',
} as const;
