import { SETTLEMENT_CONSTANTS } from '../constants';

describe('Settlement Constants', () => {
  it('should have reasonable retry config', () => {
    expect(SETTLEMENT_CONSTANTS.MAX_RETRIES).toBeGreaterThanOrEqual(1);
    expect(SETTLEMENT_CONSTANTS.MAX_RETRIES).toBeLessThanOrEqual(10);
  });

  it('should have reasonable retry delay', () => {
    expect(SETTLEMENT_CONSTANTS.RETRY_BASE_DELAY_MS).toBeGreaterThanOrEqual(500);
    expect(SETTLEMENT_CONSTANTS.RETRY_BASE_DELAY_MS).toBeLessThanOrEqual(10000);
  });

  it('should reference correct Redis channels', () => {
    expect(SETTLEMENT_CONSTANTS.REDIS_BATCH_CHANNEL).toBe('adp:events:batch');
    expect(SETTLEMENT_CONSTANTS.REDIS_SETTLEMENT_CHANNEL).toBe('adp:events:settlement');
  });
});
