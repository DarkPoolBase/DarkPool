/**
 * Wallet configuration for Base chain integration.
 * Supports Coinbase Smart Wallet, MetaMask, and Phantom.
 */
export const walletConfig = {
  /** Base Mainnet chain ID */
  chainId: 8453,
  /** Base Sepolia testnet chain ID */
  testnetChainId: 84532,

  /** Supported wallet connectors */
  connectors: {
    /** Coinbase Smart Wallet — gasless transactions via Paymaster */
    coinbaseSmartWallet: {
      appName: 'Agentic Dark Pool',
      preference: 'smartWalletOnly' as const,
    },
    /** Standard injected wallets (MetaMask, etc.) */
    injected: true,
    /** WalletConnect for mobile wallets */
    walletConnect: {
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
    },
  },

  /** Coinbase Smart Wallet features */
  smartWallet: {
    /** Enable gasless transactions via Base Paymaster */
    gasless: true,
    /** Session key duration in seconds (24 hours) */
    sessionKeyDuration: 86400,
    /** Supported chains for Smart Wallet */
    supportedChains: [8453, 84532],
  },

  /** Contract addresses on Base */
  contracts: {
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base Mainnet USDC
    usdcTestnet: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
  },
};
