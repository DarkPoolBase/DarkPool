import { useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from './useAuth';

/**
 * Provides authentication state and a manual login trigger.
 * Does NOT auto-authenticate — the user must explicitly trigger login
 * (e.g., when submitting an order) to avoid unwanted signature popups.
 */
export function useAutoAuth() {
  const { connected, fullWalletAddress, getProvider } = useWallet();
  const { user, isAuthenticated, login, logout, loading } = useAuth();

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (isAuthenticated) return true;
    if (!fullWalletAddress || !connected) return false;

    const signMessage = async (message: string): Promise<string> => {
      const provider = getProvider();
      if (!provider) throw new Error('No wallet provider');
      // Phantom requires params as [address, message], MetaMask as [message, address]
      // Use eth_sign-style ordering that works with both
      const isPhantom = (provider as any).isPhantom;
      const params = isPhantom
        ? [fullWalletAddress, message]
        : [message, fullWalletAddress];
      return (await provider.request({
        method: 'personal_sign',
        params,
      })) as string;
    };

    try {
      await login(fullWalletAddress, signMessage);
      return true;
    } catch (err: any) {
      if (err?.code !== 4001) {
        console.error('[AutoAuth] Failed:', err);
      }
      return false;
    }
  }, [connected, fullWalletAddress, isAuthenticated, login, getProvider]);

  return { isAuthenticated, user, loading, authenticate };
}
