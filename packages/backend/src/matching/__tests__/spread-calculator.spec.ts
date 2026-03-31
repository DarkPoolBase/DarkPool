import { calculateSpread, calculateVWAP } from '../algorithms/spread-calculator';

describe('Spread Calculator', () => {
  it('should calculate spread', () => {
    const bids = [{ id: '1', wallet: '0x1', price: 0.25, quantity: 2, duration: 24, gpuHours: 48 }];
    const asks = [{ id: '2', wallet: '0x2', price: 0.28, quantity: 2, duration: 24, gpuHours: 48 }];
    const result = calculateSpread(bids, asks);
    expect(result.spread).toBeCloseTo(0.03);
    expect(result.midPrice).toBeCloseTo(0.265);
  });

  it('should return null for empty books', () => {
    expect(calculateSpread([], []).spread).toBeNull();
  });
});

describe('VWAP', () => {
  it('should calculate volume-weighted average', () => {
    const entries = [
      { id: '1', wallet: '0x1', price: 0.20, quantity: 2, duration: 24, gpuHours: 48 },
      { id: '2', wallet: '0x2', price: 0.30, quantity: 4, duration: 24, gpuHours: 96 },
    ];
    const vwap = calculateVWAP(entries);
    expect(vwap).toBeCloseTo(0.2667, 3);
  });

  it('should return null for empty array', () => {
    expect(calculateVWAP([])).toBeNull();
  });
});
