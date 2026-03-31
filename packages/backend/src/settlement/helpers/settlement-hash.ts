import { keccak256, encodePacked } from 'viem';
import { BatchResult } from '../../matching/matching.service';

/**
 * Compute the settlement hash for on-chain verification.
 * This hash is what the relayer signs in V1 and what the ZK proof verifies in V2.
 */
export function computeSettlementHash(batch: BatchResult): `0x${string}` {
  const buyOrderIds = batch.matchedPairs.map((p) => p.buyOrderId).join('');
  const sellOrderIds = batch.matchedPairs.map((p) => p.sellOrderId).join('');

  return keccak256(
    encodePacked(
      ['uint256', 'string', 'string', 'uint256', 'uint256'],
      [
        BigInt(batch.batchId),
        buyOrderIds,
        sellOrderIds,
        BigInt(Math.round(batch.clearingPrice * 1e6)),
        BigInt(Math.round(batch.matchedVolume)),
      ],
    ),
  );
}

