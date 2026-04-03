import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConnect, useSignMessage } from 'wagmi';
import { getAddress } from 'viem';
import { api } from '@/lib/api';

export function useMiniAppAuth() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('adp_access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          api.setToken(token);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('adp_access_token');
        }
      } catch {
        localStorage.removeItem('adp_access_token');
      }
    }
  }, []);

  // Auto-connect Farcaster wallet
  useEffect(() => {
    if (!isConnected && connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [isConnected, connectors, connect]);

  // Auto-authenticate once wallet is connected
  useEffect(() => {
    if (isConnected && address && !isAuthenticated && !loading) {
      authenticate();
    }
  }, [isConnected, address, isAuthenticated]);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (isAuthenticated) return true;
    if (!isConnected || !address) return false;

    setLoading(true);
    try {
      const checksumAddress = getAddress(address);

      const { nonce } = await api.get<{ nonce: string }>('/api/auth/nonce', {
        params: { address: checksumAddress },
      });

      const domain = window.location.host;
      const origin = window.location.origin;
      const issuedAt = new Date().toISOString();
      const message = `${domain} wants you to sign in with your Ethereum account:\n${checksumAddress}\n\nSign in to Agentic Dark Pool\n\nURI: ${origin}\nVersion: 1\nChain ID: 8453\nNonce: ${nonce}\nIssued At: ${issuedAt}`;

      const signature = await signMessageAsync({ message });

      const { accessToken, refreshToken } = await api.post<{
        accessToken: string;
        refreshToken: string;
      }>('/api/auth/verify', {
        message,
        signature,
        address: checksumAddress,
      });

      localStorage.setItem('adp_access_token', accessToken);
      localStorage.setItem('adp_refresh_token', refreshToken);
      api.setToken(accessToken);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error('[MiniAppAuth] Failed:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, isAuthenticated, signMessageAsync]);

  return { isAuthenticated, isConnected, address, loading, authenticate };
}
