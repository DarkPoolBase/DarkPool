import { simulateSettlementTx, isSimulatedTx } from '../helpers/tx-simulator';

describe('Transaction Simulator', () => {
  it('should generate deterministic hash from batch ID', () => {
    const tx1 = simulateSettlementTx({ batchId: 1 } as any);
    const tx2 = simulateSettlementTx({ batchId: 1 } as any);
    expect(tx1).toBe(tx2);
    expect(tx1).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('should generate different hashes for different batches', () => {
    const tx1 = simulateSettlementTx({ batchId: 1 } as any);
    const tx2 = simulateSettlementTx({ batchId: 2 } as any);
    expect(tx1).not.toBe(tx2);
  });

  it('should detect simulated transactions', () => {
    const simulated = simulateSettlementTx({ batchId: 1 } as any);
    expect(isSimulatedTx(simulated)).toBe(true);
  });

  it('should detect real transactions', () => {
    expect(isSimulatedTx('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')).toBe(false);
  });
});
