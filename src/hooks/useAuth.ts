import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

interface AuthUser {
  sub: string;
  wallet: string;
  roles: string[];
}

interface ApiKeyEntry {
  id: string;
  prefix: string;
  label: string | null;
  permissions: string[];
  createdAt: string;
  lastUsedAt: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adp_access_token');
    if (token) {
      api.setToken(token);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ sub: payload.sub, wallet: payload.wallet, roles: payload.roles });
      } catch {
        localStorage.removeItem('adp_access_token');
      }
    }
  }, []);

  const login = useCallback(async (address: string, signMessage: (message: string) => Promise<string>) => {
    setLoading(true);
    try {
      const { nonce } = await api.get<{ nonce: string }>('/api/auth/nonce', {
        params: { address },
      });

      const message = [
        'Agentic Dark Pool wants you to sign in with your Ethereum account:',
        address,
        '',
        'Sign in to the Dark Pool protocol.',
        '',
        `URI: ${window.location.origin}`,
        'Version: 1',
        `Chain ID: 8453`,
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
      ].join('\n');

      const signature = await signMessage(message);

      const { accessToken, refreshToken } = await api.post<{
        accessToken: string;
        refreshToken: string;
      }>('/api/auth/verify', { message, signature });

      localStorage.setItem('adp_access_token', accessToken);
      localStorage.setItem('adp_refresh_token', refreshToken);
      api.setToken(accessToken);

      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      setUser({ sub: payload.sub, wallet: payload.wallet, roles: payload.roles });
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('adp_access_token');
    localStorage.removeItem('adp_refresh_token');
    api.setToken('');
    setUser(null);
  }, []);

  return { user, loading, login, logout, isAuthenticated: !!user };
}

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<ApiKeyEntry[]>('/api/auth/api-keys');
      setKeys(data);
    } catch {
      // Not authenticated or error
    } finally {
      setLoading(false);
    }
  }, []);

  const createKey = useCallback(async (label?: string) => {
    const result = await api.post<{ id: string; key: string; prefix: string }>(
      '/api/auth/api-keys',
      { label },
    );
    await fetchKeys();
    return result;
  }, [fetchKeys]);

  const revokeKey = useCallback(async (keyId: string) => {
    await api.delete(`/api/auth/api-keys/${keyId}`);
    await fetchKeys();
  }, [fetchKeys]);

  return { keys, loading, fetchKeys, createKey, revokeKey };
}

