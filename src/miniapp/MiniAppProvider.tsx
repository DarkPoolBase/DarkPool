import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import { miniAppConfig } from './wagmi';

const queryClient = new QueryClient();

const NOTIF_TOKEN_KEY = 'fc_notif_token';
const NOTIF_URL_KEY = 'fc_notif_url';

interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

export function useFarcasterUser(): FarcasterUser | null {
  const [user, setUser] = useState<FarcasterUser | null>(null);

  useEffect(() => {
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

/** Returns whether notifications are enabled and a function to request them. */
export function useFarcasterNotifications() {
  const [enabled, setEnabled] = useState(() => !!localStorage.getItem(NOTIF_TOKEN_KEY));

  const requestNotifications = useCallback(async () => {
    try {
      const result = await sdk.actions.addMiniApp();
      if (result && 'notificationDetails' in result && result.notificationDetails) {
        localStorage.setItem(NOTIF_TOKEN_KEY, result.notificationDetails.token);
        localStorage.setItem(NOTIF_URL_KEY, result.notificationDetails.url);
        setEnabled(true);
      }
    } catch {
      // User rejected or not supported
    }
  }, []);

  // Listen for notification state changes from the Farcaster client
  useEffect(() => {
    const onAdded = ({ notificationDetails }: { notificationDetails?: { url: string; token: string } }) => {
      if (notificationDetails) {
        localStorage.setItem(NOTIF_TOKEN_KEY, notificationDetails.token);
        localStorage.setItem(NOTIF_URL_KEY, notificationDetails.url);
        setEnabled(true);
      }
    };

    const onEnabled = ({ notificationDetails }: { notificationDetails: { url: string; token: string } }) => {
      localStorage.setItem(NOTIF_TOKEN_KEY, notificationDetails.token);
      localStorage.setItem(NOTIF_URL_KEY, notificationDetails.url);
      setEnabled(true);
    };

    const onDisabled = () => {
      localStorage.removeItem(NOTIF_TOKEN_KEY);
      localStorage.removeItem(NOTIF_URL_KEY);
      setEnabled(false);
    };

    const onRemoved = () => {
      localStorage.removeItem(NOTIF_TOKEN_KEY);
      localStorage.removeItem(NOTIF_URL_KEY);
      setEnabled(false);
    };

    sdk.on('miniAppAdded', onAdded);
    sdk.on('notificationsEnabled', onEnabled);
    sdk.on('notificationsDisabled', onDisabled);
    sdk.on('miniAppRemoved', onRemoved);

    return () => {
      sdk.off('miniAppAdded', onAdded);
      sdk.off('notificationsEnabled', onEnabled);
      sdk.off('notificationsDisabled', onDisabled);
      sdk.off('miniAppRemoved', onRemoved);
    };
  }, []);

  return { enabled, requestNotifications };
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
