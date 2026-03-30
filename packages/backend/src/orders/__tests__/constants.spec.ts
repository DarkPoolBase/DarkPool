import { ORDER_CONSTANTS } from '../constants';

describe('Order Constants', () => {
  it('should have valid price range', () => {
    expect(ORDER_CONSTANTS.MIN_PRICE).toBeLessThan(ORDER_CONSTANTS.MAX_PRICE);
    expect(ORDER_CONSTANTS.MIN_PRICE).toBeGreaterThan(0);
  });

  it('should have valid quantity range', () => {
    expect(ORDER_CONSTANTS.MIN_QUANTITY).toBe(1);
    expect(ORDER_CONSTANTS.MAX_QUANTITY).toBe(1000);
  });

  it('should have valid duration range', () => {
    expect(ORDER_CONSTANTS.MIN_DURATION).toBe(1);
    expect(ORDER_CONSTANTS.MAX_DURATION).toBe(720); // 30 days
  });

  it('should have valid commitment hash regex', () => {
    const validHash = '0x' + 'ab'.repeat(32);
    expect(ORDER_CONSTANTS.COMMITMENT_HASH_REGEX.test(validHash)).toBe(true);
    expect(ORDER_CONSTANTS.COMMITMENT_HASH_REGEX.test('invalid')).toBe(false);
  });
});
