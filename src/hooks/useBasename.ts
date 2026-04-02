import { useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';

// ENS resolution needs mainnet client (ENS registry lives on L1)
const ensClient = createPublicClient({
  chain: mainnet,
  transport: http('https://cloudflare-eth.com'),
});

// Base L2 Basename resolver
const BASE_RESOLVER = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD' as const;

interface BasenameResult {
  basename: string | null;
  loading: boolean;
}

const cache = new Map<string, string | null>();

export function useBasename(address?: string | null): BasenameResult {
  const [basename, setBasename] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setBasename(null);
      return;
    }

    const lowerAddr = address.toLowerCase();

    // Check cache
    if (cache.has(lowerAddr)) {
      setBasename(cache.get(lowerAddr) || null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // Try ENS reverse resolution (works for .eth names and some .base.eth)
        const name = await ensClient.getEnsName({
          address: address as `0x${string}`,
        });

        if (!cancelled) {
          cache.set(lowerAddr, name);
          setBasename(name);
        }
      } catch {
        if (!cancelled) {
          cache.set(lowerAddr, null);
          setBasename(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [address]);

  return { basename, loading };
}
