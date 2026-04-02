import { useState, useEffect, useCallback } from 'react';
import { CONTRACTS } from '@/config/contracts';
import { ESCROW_ABI, ERC20_ABI, DARKPOOL_ABI } from '@/config/abis';
import { publicClient, getWalletClient, parseUSDC, formatUSDC, USDC_DECIMALS } from '@/lib/chain';
import { useWallet } from '@/contexts/WalletContext';

export { CONTRACTS };

// ─── Read hooks ──────────────────────────────────────────────────────

export function useEscrowBalance(address?: string) {
  const [data, setData] = useState({ available: BigInt(0), locked: BigInt(0) });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const result = await publicClient.readContract({
        address: CONTRACTS.ESCROW as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'getBalance',
        args: [address as `0x${string}`],
      });
      setData({ available: result[0], locked: result[1] });
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => { refetch(); }, [refetch]);

  // Auto-refresh every 15s
  useEffect(() => {
    if (!address) return;
    const interval = setInterval(refetch, 15_000);
    return () => clearInterval(interval);
  }, [address, refetch]);

  return { data, isLoading, error, refetch };
}

export function useUSDCBalance(address?: string) {
  const [balance, setBalance] = useState(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const result = await publicClient.readContract({
        address: CONTRACTS.USDC as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });
      setBalance(result);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => { refetch(); }, [refetch]);

  return { balance, isLoading, refetch, formatted: formatUSDC(balance) };
}

export function useCurrentBatchId() {
  const [data, setData] = useState(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    publicClient
      .readContract({
        address: CONTRACTS.DARK_POOL as `0x${string}`,
        abi: DARKPOOL_ABI,
        functionName: 'getCurrentBatchId',
      })
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return { data, isLoading };
}

// ─── Write hooks ──────────────────────────────────────────────────────

export function useDepositUSDC() {
  const { getProvider, fullWalletAddress } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deposit = useCallback(
    async (amount: number): Promise<`0x${string}`> => {
      const provider = getProvider();
      if (!provider || !fullWalletAddress) throw new Error('Wallet not connected');
      setIsLoading(true);
      setError(null);

      try {
        const walletClient = getWalletClient(provider);
        const amountRaw = parseUSDC(amount);

        // Step 1: Check allowance and approve if needed
        const allowance = await publicClient.readContract({
          address: CONTRACTS.USDC as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [fullWalletAddress as `0x${string}`, CONTRACTS.ESCROW as `0x${string}`],
        });

        if (allowance < amountRaw) {
          const approveTx = await walletClient.writeContract({
            address: CONTRACTS.USDC as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [CONTRACTS.ESCROW as `0x${string}`, amountRaw],
            account: fullWalletAddress as `0x${string}`,
            chain: walletClient.chain,
          });
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
        }

        // Step 2: Deposit into escrow
        const depositTx = await walletClient.writeContract({
          address: CONTRACTS.ESCROW as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: 'deposit',
          args: [amountRaw],
          account: fullWalletAddress as `0x${string}`,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash: depositTx });
        return depositTx;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getProvider, fullWalletAddress],
  );

  return { deposit, isLoading, error };
}

export function useWithdrawUSDC() {
  const { getProvider, fullWalletAddress } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const withdraw = useCallback(
    async (amount: number): Promise<`0x${string}`> => {
      const provider = getProvider();
      if (!provider || !fullWalletAddress) throw new Error('Wallet not connected');
      setIsLoading(true);
      setError(null);

      try {
        const walletClient = getWalletClient(provider);
        const amountRaw = parseUSDC(amount);

        const tx = await walletClient.writeContract({
          address: CONTRACTS.ESCROW as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: 'withdraw',
          args: [amountRaw],
          account: fullWalletAddress as `0x${string}`,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash: tx });
        return tx;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getProvider, fullWalletAddress],
  );

  return { withdraw, isLoading, error };
}

export function useSubmitOrder() {
  const { getProvider, fullWalletAddress } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submitOrder = useCallback(
    async (commitment: `0x${string}`, escrowAmount: bigint): Promise<`0x${string}`> => {
      const provider = getProvider();
      if (!provider || !fullWalletAddress) throw new Error('Wallet not connected');
      setIsLoading(true);
      setError(null);

      try {
        const walletClient = getWalletClient(provider);

        // Check escrow balance — must have enough available
        const [available] = await publicClient.readContract({
          address: CONTRACTS.ESCROW as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: 'getBalance',
          args: [fullWalletAddress as `0x${string}`],
        });

        if (available < escrowAmount) {
          throw new Error(
            `Insufficient escrow balance. Available: $${formatUSDC(available)}, needed: $${formatUSDC(escrowAmount)}. Deposit USDC first.`,
          );
        }

        const tx = await walletClient.writeContract({
          address: CONTRACTS.DARK_POOL as `0x${string}`,
          abi: DARKPOOL_ABI,
          functionName: 'submitOrder',
          args: [commitment, escrowAmount],
          account: fullWalletAddress as `0x${string}`,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash: tx });
        return tx;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getProvider, fullWalletAddress],
  );

  return { submitOrder, isLoading, error };
}

export function useCancelOrderContract() {
  const { getProvider, fullWalletAddress } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cancelOrder = useCallback(
    async (orderId: `0x${string}`): Promise<`0x${string}`> => {
      const provider = getProvider();
      if (!provider || !fullWalletAddress) throw new Error('Wallet not connected');
      setIsLoading(true);
      setError(null);

      try {
        const walletClient = getWalletClient(provider);
        const tx = await walletClient.writeContract({
          address: CONTRACTS.DARK_POOL as `0x${string}`,
          abi: DARKPOOL_ABI,
          functionName: 'cancelOrder',
          args: [orderId],
          account: fullWalletAddress as `0x${string}`,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash: tx });
        return tx;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getProvider, fullWalletAddress],
  );

  return { cancelOrder, isLoading, error };
}
