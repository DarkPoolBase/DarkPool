import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type PublicClient,
  type WalletClient,
  type Chain,
} from 'viem';
import { base } from 'viem/chains';

const RPC_URL = 'https://mainnet.base.org';

/** Shared read-only client for on-chain reads */
export const publicClient: PublicClient = createPublicClient({
  chain: base as Chain,
  transport: http(RPC_URL),
});

/** Build a wallet client from the user's browser wallet provider */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getWalletClient(provider: any): WalletClient {
  return createWalletClient({
    chain: base as Chain,
    transport: custom(provider),
  });
}

/** USDC uses 6 decimals on Base */
export const USDC_DECIMALS = 6;

/** Convert a human-readable USDC amount (e.g. 1.50) to on-chain units (1500000) */
export function parseUSDC(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** USDC_DECIMALS));
}

/** Convert on-chain USDC units to human-readable amount */
export function formatUSDC(raw: bigint): string {
  const num = Number(raw) / 10 ** USDC_DECIMALS;
  return num.toFixed(2);
}
