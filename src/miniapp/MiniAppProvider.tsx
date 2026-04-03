import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import { miniAppConfig } from './wagmi';

const queryClient = new QueryClient();

interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

export function useFarcasterUser(): FarcasterUser | null {
  const [user, setUser] = useState<FarcasterUser | null>(null);

  useEffect(() => {
    try {
      const ctx = sdk.context;
      if (ctx?.user) {
        const pfp = ctx.user.pfpUrl;
        setUser({
          fid: ctx.user.fid,
          username: typeof ctx.user.username === 'string' ? ctx.user.username : undefined,
          displayName: typeof ctx.user.displayName === 'string' ? ctx.user.displayName : undefined,
          pfpUrl: typeof pfp === 'string' ? pfp : undefined,
        });
      }
    } catch {
      // Not in a Farcaster client
    }
  }, []);

  return user;
}

export function MiniAppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Signal to the Farcaster client that the app is ready
    sdk.actions.ready().catch(() => {});
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <WagmiProvider config={miniAppConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
