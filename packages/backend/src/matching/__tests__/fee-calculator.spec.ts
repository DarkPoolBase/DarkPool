import { calculateBatchFee, calculateBatchValue } from '../algorithms/fee-calculator';

describe('Fee Calculator', () => {
  describe('calculateBatchFee', () => {
    it('should calculate 0.8% fee by default', () => {
      expect(calculateBatchFee(1000)).toBe(8);
    });

    it('should calculate custom fee', () => {
      expect(calculateBatchFee(1000, 50)).toBe(5);
    });

    it('should handle zero value', () => {
      expect(calculateBatchFee(0)).toBe(0);
    });
  });

  describe('calculateBatchValue', () => {
    it('should multiply volume by price', () => {
      expect(calculateBatchValue(100, 0.25)).toBe(25);
    });
  });
});
