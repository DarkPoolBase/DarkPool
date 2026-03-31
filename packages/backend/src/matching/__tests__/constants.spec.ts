import { MATCHING_CONSTANTS } from '../constants';

describe('Matching Constants', () => {
  it('should have reasonable batch interval', () => {
    expect(MATCHING_CONSTANTS.BATCH_INTERVAL_MS).toBeGreaterThanOrEqual(10000);
    expect(MATCHING_CONSTANTS.BATCH_INTERVAL_MS).toBeLessThanOrEqual(120000);
  });

  it('should have valid fee configuration', () => {
    expect(MATCHING_CONSTANTS.PROTOCOL_FEE_BPS).toBeLessThanOrEqual(500);
    expect(MATCHING_CONSTANTS.PROTOCOL_FEE_BPS).toBeGreaterThan(0);
  });

  it('should require at least 2 orders for auction', () => {
    expect(MATCHING_CONSTANTS.MIN_ORDERS_FOR_AUCTION).toBe(2);
  });

  it('should list all supported GPU types', () => {
    expect(MATCHING_CONSTANTS.GPU_TYPES).toContain('H100');
    expect(MATCHING_CONSTANTS.GPU_TYPES).toContain('A100');
    expect(MATCHING_CONSTANTS.GPU_TYPES.length).toBeGreaterThanOrEqual(4);
  });
});
