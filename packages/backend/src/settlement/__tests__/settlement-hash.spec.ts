import { computeSettlementHash } from '../helpers/settlement-hash';

describe('Settlement Hash', () => {
  it('should produce deterministic hash', () => {
    const batch = {
      batchId: 1,
      gpuType: 'H100',
      clearingPrice: 0.22,
      matchedPairs: [
        { buyOrderId: 'b1', sellOrderId: 's1', buyerWallet: '0x1', sellerWallet: '0x2', quantity: 2, duration: 24 },
      ],
      matchedVolume: 48,
      totalValueUSDC: 10.56,
      protocolFee: 0.08,
      unmatchedBuyOrders: [],
      unmatchedSellOrders: [],
      timestamp: Date.now(),
    };

    const hash1 = computeSettlementHash(batch);
    const hash2 = computeSettlementHash(batch);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it('should produce different hash for different batches', () => {
    const base = {
      gpuType: 'H100', clearingPrice: 0.22,
      matchedPairs: [{ buyOrderId: 'b1', sellOrderId: 's1', buyerWallet: '0x1', sellerWallet: '0x2', quantity: 2, duration: 24 }],
      matchedVolume: 48, totalValueUSDC: 10.56, protocolFee: 0.08,
      unmatchedBuyOrders: [], unmatchedSellOrders: [], timestamp: Date.now(),
    };
    const hash1 = computeSettlementHash({ ...base, batchId: 1 });
    const hash2 = computeSettlementHash({ ...base, batchId: 2 });
    expect(hash1).not.toBe(hash2);
  });
});
