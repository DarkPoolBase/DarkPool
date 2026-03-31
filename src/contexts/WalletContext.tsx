import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { WalletType, EVMProvider } from '@/types/wallet';

// Base Sepolia for development, Base Mainnet for production
const isProduction =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'darkpoolbase.org' ||
    window.location.hostname === 'www.darkpoolbase.org' ||
    window.location.hostname.endsWith('.vercel.app'));

const TARGET_CHAIN_ID = isProduction ? 8453 : 84532;
const TARGET_CHAIN_HEX = isProduction ? '0x2105' : '0x14a34';
const TARGET_CHAIN_NAME = isProduction ? 'Base' : 'Base Sepolia';
const TARGET_RPC = isProduction ? 'https://mainnet.base.org' : 'https://sepolia.base.org';
const TARGET_EXPLORER = isProduction ? 'https://basescan.org' : 'https://sepolia.basescan.org';

type NetworkStatus = 'connected' | 'wrong_network' | 'disconnected';

interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  walletAddress: string | null;
  fullWalletAddress: string | null;
  walletType: WalletType | null;
  networkStatus: NetworkStatus;
  connect: (type: WalletType) => Promise<void>;
  disconnect: () => Promise<void>;
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  getProvider: () => EVMProvider | null;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
};

const formatAddress = (address: string): string =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

const getPhantomEVMProvider = (): EVMProvider | null => {
  if (typeof window === 'undefined') return null;
  const provider = window.phantom?.ethereum;
  if (provider?.isPhantom) return provider;
  return null;
};

const getMetaMaskProvider = (): EVMProvider | null => {
  if (typeof window === 'undefined') return null;
  const provider = window.ethereum;
  if (provider?.isMetaMask && !provider?.isPhantom) return provider;
  return null;
};

const getCoinbaseProvider = (): EVMProvider | null => {
  if (typeof window === 'undefined') return null;
  const dedicated = window.coinbaseWalletExtension;
  if (dedicated) return dedicated;
  const provider = window.ethereum;
  if (provider?.isCoinbaseWallet) return provider;
  return null;
};

const getProviderByType = (type: WalletType): EVMProvider | null => {
  if (type === 'phantom') return getPhantomEVMProvider();
  if (type === 'metamask') return getMetaMaskProvider();
  if (type === 'coinbase') return getCoinbaseProvider();
  return null;
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [fullWalletAddress, setFullWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('disconnected');
  const [showModal, setShowModal] = useState(false);

  const clearWallet = useCallback(() => {
    setConnected(false);
    setWalletAddress(null);
    setFullWalletAddress(null);
    setWalletType(null);
    setNetworkStatus('disconnected');
    localStorage.removeItem('adp_wallet');
  }, []);

  const ensureBaseChain = useCallback(async (provider: EVMProvider): Promise<boolean> => {
    try {
      const currentChainHex = (await provider.request({ method: 'eth_chainId' })) as string;
      const currentChainId = parseInt(currentChainHex, 16);

      if (currentChainId === TARGET_CHAIN_ID) {
        setNetworkStatus('connected');
        return true;
      }

      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: TARGET_CHAIN_HEX }],
        });
        setNetworkStatus('connected');
        return true;
      } catch (switchError: unknown) {
        const err = switchError as { code?: number };
        if (err.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: TARGET_CHAIN_HEX,
                chainName: TARGET_CHAIN_NAME,
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: [TARGET_RPC],
                blockExplorerUrls: [TARGET_EXPLORER],
              },
            ],
          });
          setNetworkStatus('connected');
          return true;
        }
        setNetworkStatus('wrong_network');
        return false;
      }
    } catch {
      setNetworkStatus('wrong_network');
      return false;
    }
  }, []);

  const connect = useCallback(
    async (type: WalletType) => {
      setConnecting(true);

      try {
        const provider = getProviderByType(type);

        if (!provider) {
          const isMobile = /Mobile|Android/i.test(navigator.userAgent);
          const host = window.location.host + window.location.pathname;
          const dappUrl = encodeURIComponent(window.location.href);

          if (isMobile) {
            const deepLinks: Record<WalletType, string> = {
              metamask: `https://metamask.app.link/dapp/${host}`,
              phantom: `https://phantom.app/ul/browse/${host}`,
              coinbase: `https://go.cb-w.com/dapp?cb_url=${dappUrl}`,
            };
            window.location.href = deepLinks[type];
          } else {
            const installUrls: Record<WalletType, string> = {
              phantom: 'https://phantom.app/',
              metamask: 'https://metamask.io/download/',
              coinbase: 'https://www.coinbase.com/wallet/downloads',
            };
            window.open(installUrls[type], '_blank');
          }
          setConnecting(false);
          return;
        }

        const accounts = (await provider.request({
          method: 'eth_requestAccounts',
        })) as string[];

        if (accounts.length === 0) {
          setConnecting(false);
          return;
        }

        const address = accounts[0];
        await ensureBaseChain(provider);

        const formatted = formatAddress(address);
        setWalletType(type);
        setWalletAddress(formatted);
        setFullWalletAddress(address);
        setConnected(true);
        setShowModal(false);

        localStorage.setItem(
          'adp_wallet',
          JSON.stringify({ type, address: formatted, fullAddress: address })
        );
      } catch (err: unknown) {
        const error = err as { code?: number; message?: string };
        if (error.code === 4001 || error.message?.includes('rejected')) {
          setConnecting(false);
          return;
        }
        console.error('[DarkPool] Connection failed:', err);
        setNetworkStatus('disconnected');
      } finally {
        setConnecting(false);
      }
    },
    [ensureBaseChain]
  );

  const disconnect = useCallback(async () => {
    clearWallet();
  }, [clearWallet]);

  const getProviderFn = useCallback((): EVMProvider | null => {
    if (!walletType) return null;
    return getProviderByType(walletType);
  }, [walletType]);

  // Eager reconnect from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('adp_wallet');
    if (!saved) return;

    const { type, address, fullAddress } = JSON.parse(saved) as {
      type: WalletType;
      address: string;
      fullAddress: string;
    };

    setWalletType(type);
    setWalletAddress(address);
    setFullWalletAddress(fullAddress);
    setConnected(true);
    setNetworkStatus('connected');

    const eagerReconnect = async () => {
      await new Promise((r) => setTimeout(r, 500));
      const provider = getProviderByType(type);
      if (!provider) { clearWallet(); return; }

      try {
        const accounts = (await provider.request({ method: 'eth_accounts' })) as string[];
        if (accounts.length === 0 || accounts[0].toLowerCase() !== fullAddress.toLowerCase()) {
          clearWallet();
          return;
        }
        await ensureBaseChain(provider);
      } catch {
        clearWallet();
      }
    };

    eagerReconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for account/chain/disconnect events
  useEffect(() => {
    if (!walletType || !fullWalletAddress) return;
    const provider = getProviderByType(walletType);
    if (!provider) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accts = accounts as string[];
      if (accts.length === 0 || accts[0].toLowerCase() !== fullWalletAddress.toLowerCase()) {
        clearWallet();
      }
    };

    const handleChainChanged = (newChainHex: unknown) => {
      const chainId = parseInt(newChainHex as string, 16);
      setNetworkStatus(chainId === TARGET_CHAIN_ID ? 'connected' : 'wrong_network');
    };

    const handleDisconnect = () => clearWallet();

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);
    provider.on('disconnect', handleDisconnect);

    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
      provider.removeListener('disconnect', handleDisconnect);
    };
  }, [walletType, fullWalletAddress, clearWallet]);

  return (
    <WalletContext.Provider
      value={{
        connected, connecting, walletAddress, fullWalletAddress,
        walletType, networkStatus, connect, disconnect,
        showModal, setShowModal, getProvider: getProviderFn,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

