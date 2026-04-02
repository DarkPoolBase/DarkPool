import { useState, useEffect } from 'react';
import { createPublicClient, http, getAddress, namehash } from 'viem';
import { base } from 'viem/chains';

// Base L2 client for Basename resolution
const baseClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

// Base chain Basename contracts
const REVERSE_REGISTRAR = '0x79EA96012eEa67A83431F1701B3dFf7e37F9E282' as const;
const L2_RESOLVER = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD' as const;

const reverseRegistrarAbi = [
  {
    name: 'node',
    type: 'function',
    stateMutability: 'pure',
    inputs: [{ name: 'addr', type: 'address' }],
    outputs: [{ name: '', type: 'bytes32' }],
  },
] as const;

const resolverAbi = [
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'text',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }, { name: 'key', type: 'string' }],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

interface BasenameResult {
  basename: string | null;
  avatar: string | null;
  loading: boolean;
}

const cache = new Map<string, { name: string | null; avatar: string | null }>();

export function useBasename(address?: string | null): BasenameResult {
  const [basename, setBasename] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setBasename(null);
      setAvatar(null);
      return;
    }

    const lowerAddr = address.toLowerCase();

    if (cache.has(lowerAddr)) {
      const cached = cache.get(lowerAddr)!;
      setBasename(cached.name);
      setAvatar(cached.avatar);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const checksummed = getAddress(address);

        // Get reverse node from Base's ReverseRegistrar
        const reverseNode = await baseClient.readContract({
          address: REVERSE_REGISTRAR,
          abi: reverseRegistrarAbi,
          functionName: 'node',
          args: [checksummed],
        });

        // Query L2Resolver for the name
        const name = await baseClient.readContract({
          address: L2_RESOLVER,
          abi: resolverAbi,
          functionName: 'name',
          args: [reverseNode],
        });

        if (!cancelled) {
          let avatarUrl: string | null = null;
          if (name) {
            try {
              const forwardNode = namehash(name);
              avatarUrl = await baseClient.readContract({
                address: L2_RESOLVER,
                abi: resolverAbi,
                functionName: 'text',
                args: [forwardNode, 'avatar'],
              }) || null;
            } catch { /* avatar not set */ }
          }

          cache.set(lowerAddr, { name: name || null, avatar: avatarUrl });
          setBasename(name || null);
          setAvatar(avatarUrl);
        }
      } catch {
        if (!cancelled) {
          cache.set(lowerAddr, { name: null, avatar: null });
          setBasename(null);
          setAvatar(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [address]);

  return { basename, avatar, loading };
}
