import { useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from './useAuth';

/**
 * Provides authentication state and a manual login trigger.
 * Does NOT auto-authenticate — the user must explicitly trigger login
 * (e.g., when submitting an order) to avoid unwanted signature popups.
 */
export function useAutoAuth() {
  const { connected, fullWalletAddress, walletType, getProvider } = useWallet();
  const { user, isAuthenticated, login, logout, loading } = useAuth();

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (isAuthenticated) return true;
    if (!fullWalletAddress || !connected) return false;

    const provider = getProvider();
    if (!provider) return false;

    // Use eth_requestAccounts to ensure the EVM side is actively connected
    const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
    const currentAddress = accounts[0];
    if (!currentAddress) return false;

    const signMessage = async (message: string): Promise<string> => {
      const msgBytes = new TextEncoder().encode(message);
      const hexMessage = '0x' + Array.from(msgBytes)
        .map(b => b.toString(16).padStart(2, '0')).join('');

      // Phantom's EVM provider can be strict about personal_sign address matching.
      // Try personal_sign first, fall back to eth_sign if Phantom rejects.
      try {
        return (await provider.request({
          method: 'personal_sign',
          params: [hexMessage, currentAddress.toLowerCase()],
        })) as string;
      } catch (firstErr: any) {
        // If Phantom rejects due to address mismatch, retry with checksummed address
        if (firstErr?.message?.includes('address') || firstErr?.code === -32602) {
          return (await provider.request({
            method: 'personal_sign',
            params: [hexMessage, currentAddress],
          })) as string;
        }
        throw firstErr;
      }
    };

    try {
      await login(currentAddress, signMessage);
      return true;
    } catch (err: any) {
      if (err?.code !== 4001) {
        console.error('[AutoAuth] Failed:', err);
      }
      return false;
    }
  }, [connected, fullWalletAddress, walletType, isAuthenticated, login, getProvider]);

  return { isAuthenticated, user, loading, authenticate };
}
