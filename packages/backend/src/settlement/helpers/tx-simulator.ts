import { BatchResult } from '../../matching/matching.service';

/**
 * Simulate an on-chain settlement transaction.
 * Used in V1 when contracts are not yet deployed.
 * Returns a deterministic mock tx hash based on batch ID.
 */
export function simulateSettlementTx(batch: BatchResult): string {
  return `0x${batch.batchId.toString(16).padStart(64, '0')}`;
}

/**
 * Check if a tx hash is simulated or real
 */
export function isSimulatedTx(txHash: string): boolean {
  return txHash.startsWith('0x000000000000000000000000000000000000000000000000000000000000');
}

