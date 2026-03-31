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

    // Debug: log all address sources to find the mismatch
    const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
    const selectedAddr = (provider as any).selectedAddress;
    console.log('[AutoAuth] Debug addresses:', {
      'eth_requestAccounts': accounts[0],
      'selectedAddress': selectedAddr,
      'fullWalletAddress (context)': fullWalletAddress,
      'walletType': walletType,
      'provider.isPhantom': (provider as any).isPhantom,
      'window.ethereum?.selectedAddress': (window.ethereum as any)?.selectedAddress,
    });

    // Use selectedAddress (Phantom's internal value) if available, then eth_requestAccounts
    const currentAddress = selectedAddr || accounts[0];
    if (!currentAddress) return false;

    const signMessage = async (message: string): Promise<string> => {
      const hexMessage = '0x' + Array.from(new TextEncoder().encode(message))
        .map(b => b.toString(16).padStart(2, '0')).join('');

      console.log('[AutoAuth] Signing with address:', currentAddress);
      console.log('[AutoAuth] Message preview:', message.substring(0, 120));

      return (await provider.request({
        method: 'personal_sign',
        params: [hexMessage, currentAddress],
      })) as string;
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
