import { calculateEscrowAmount, calculateProtocolFee, calculateRefund } from '../utils/escrow-calculator';

describe('EscrowCalculator', () => {
  describe('calculateEscrowAmount', () => {
    it('should calculate correctly for standard order', () => {
      expect(calculateEscrowAmount(4, 0.25, 24)).toBe(24);
    });

    it('should handle single GPU hour', () => {
      expect(calculateEscrowAmount(1, 0.21, 1)).toBeCloseTo(0.21);
    });

    it('should handle large orders', () => {
      expect(calculateEscrowAmount(100, 2.50, 720)).toBe(180000);
    });
  });

  describe('calculateProtocolFee', () => {
    it('should calculate 0.8% fee by default', () => {
      expect(calculateProtocolFee(1000)).toBe(8);
    });

    it('should calculate custom fee rate', () => {
      expect(calculateProtocolFee(1000, 50)).toBe(5); // 0.5%
    });

    it('should return 0 for zero value', () => {
      expect(calculateProtocolFee(0)).toBe(0);
    });
  });

  describe('calculateRefund', () => {
    it('should refund excess escrow', () => {
      // Escrowed 500, clearing at 400 for 1 unit 1 hr = 100 refund
      expect(calculateRefund(500, 400, 1, 1)).toBe(100);
    });

    it('should return 0 if no excess', () => {
      expect(calculateRefund(400, 400, 1, 1)).toBe(0);
    });

    it('should never return negative', () => {
      expect(calculateRefund(100, 400, 1, 1)).toBe(0);
    });
  });
});
