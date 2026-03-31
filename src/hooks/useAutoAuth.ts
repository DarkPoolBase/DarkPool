import { useEffect, useRef } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from './useAuth';

/**
 * Automatically authenticates with the backend when wallet connects.
 * Signs a SIWE message using the wallet provider and stores the JWT.
 */
export function useAutoAuth() {
  const { connected, fullWalletAddress, getProvider } = useWallet();
  const { user, isAuthenticated, login, logout, loading } = useAuth();
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!connected || !fullWalletAddress) {
      if (user) logout();
      hasAttempted.current = false;
      return;
    }

    // Already authenticated or already attempting
    if (isAuthenticated || hasAttempted.current || loading) return;

    hasAttempted.current = true;

    const signMessage = async (message: string): Promise<string> => {
      const provider = getProvider();
      if (!provider) throw new Error('No wallet provider');
      return (await provider.request({
        method: 'personal_sign',
        params: [message, fullWalletAddress],
      })) as string;
    };

    login(fullWalletAddress, signMessage).catch((err) => {
      // User rejected or error — reset so they can try again
      if (err?.code !== 4001) {
        console.error('[AutoAuth] Failed:', err);
      }
      hasAttempted.current = false;
    });
  }, [connected, fullWalletAddress, isAuthenticated, login, logout, getProvider, user, loading]);

  return { isAuthenticated, user, loading };
}

