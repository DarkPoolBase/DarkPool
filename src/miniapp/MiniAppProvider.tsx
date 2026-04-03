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
    // sdk.context is a Promise — must be awaited
    sdk.context
      .then((ctx) => {
        if (ctx?.user) {
          setUser({
            fid: ctx.user.fid,
            username: ctx.user.username,
            displayName: ctx.user.displayName,
            pfpUrl: ctx.user.pfpUrl,
          });
        }
      })
      .catch(() => {
        // Not in a Farcaster client
      });
  }, []);

  return user;
}

export function MiniAppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
