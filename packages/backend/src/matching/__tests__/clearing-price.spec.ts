import { findClearingPrice } from '../algorithms/clearing-price';

describe('findClearingPrice', () => {
  it('should find clearing price at supply-demand intersection', () => {
    const bids = [
      { price: 0.30, gpuHours: 48 },
      { price: 0.25, gpuHours: 48 },
      { price: 0.20, gpuHours: 48 },
    ];
    const asks = [
      { price: 0.18, gpuHours: 48 },
      { price: 0.22, gpuHours: 48 },
      { price: 0.28, gpuHours: 48 },
    ];
    const price = findClearingPrice(bids, asks);
    expect(price).toBe(0.22);
  });

  it('should return null when no overlap', () => {
    const bids = [{ price: 0.10, gpuHours: 48 }];
    const asks = [{ price: 0.50, gpuHours: 48 }];
    expect(findClearingPrice(bids, asks)).toBeNull();
  });

  it('should handle single bid and ask', () => {
    const bids = [{ price: 0.30, gpuHours: 24 }];
    const asks = [{ price: 0.20, gpuHours: 24 }];
    const price = findClearingPrice(bids, asks);
    expect(price).not.toBeNull();
    expect(price!).toBeGreaterThanOrEqual(0.20);
    expect(price!).toBeLessThanOrEqual(0.30);
  });

  it('should return null for empty order books', () => {
    expect(findClearingPrice([], [])).toBeNull();
    expect(findClearingPrice([{ price: 1, gpuHours: 10 }], [])).toBeNull();
    expect(findClearingPrice([], [{ price: 1, gpuHours: 10 }])).toBeNull();
  });

  it('should maximize volume not price', () => {
    const bids = [
      { price: 1.00, gpuHours: 10 },
      { price: 0.50, gpuHours: 100 },
    ];
    const asks = [
      { price: 0.40, gpuHours: 100 },
      { price: 0.90, gpuHours: 10 },
    ];
    const price = findClearingPrice(bids, asks);
    expect(price).toBe(0.50);
  });
});
