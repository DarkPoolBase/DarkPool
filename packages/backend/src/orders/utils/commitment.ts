import { keccak256, encodePacked } from 'viem';

export function verifyCommitment(
  commitmentHash: string,
  params: {
    gpuType: string;
    quantity: number;
    pricePerHour: bigint;
    duration: number;
    isBuy: boolean;
    secret: `0x${string}`;
  },
): boolean {
  const computed = keccak256(
    encodePacked(
      ['string', 'uint256', 'uint256', 'uint256', 'bool', 'bytes32'],
      [
        params.gpuType,
        BigInt(params.quantity),
        params.pricePerHour,
        BigInt(params.duration),
        params.isBuy,
        params.secret,
      ],
    ),
  );
  return computed.toLowerCase() === commitmentHash.toLowerCase();
}

export function generateOrderId(
  walletAddress: string,
  commitmentHash: string,
  timestamp: number,
  nonce: number,
): string {
  return keccak256(
    encodePacked(
      ['address', 'bytes32', 'uint256', 'uint256'],
      [
        walletAddress as `0x${string}`,
        commitmentHash as `0x${string}`,
        BigInt(timestamp),
        BigInt(nonce),
      ],
    ),
  );
}

