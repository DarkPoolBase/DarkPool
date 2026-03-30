import { keccak256, encodePacked } from 'viem';

/**
 * Generate a commitment hash for an order (client-side)
 * The commitment hides order details on-chain using a commit-reveal scheme
 */
export function generateCommitment(params: {
  gpuType: string;
  quantity: number;
  pricePerHour: bigint;
  duration: number;
  isBuy: boolean;
  secret: `0x${string}`;
}): `0x${string}` {
  return keccak256(
    encodePacked(
      ['string', 'uint256', 'uint256', 'uint256', 'bool', 'bytes32'],
      [
        params.gpuType,
        BigInt(params.quantity),
        params.pricePerHour,
        BigInt(params.duration),
        params.isBuy,
        params.secret,
      ]
    )
  );
}

/**
 * Generate a random secret for order commitment
 */
export function generateSecret(): `0x${string}` {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}
