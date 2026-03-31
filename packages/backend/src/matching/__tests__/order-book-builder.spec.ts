import { buildOrderBook } from '../algorithms/order-book-builder';

describe('buildOrderBook', () => {
  const makeOrder = (side: string, price: string, qty: number) => ({
    id: `order-${Math.random().toString(36).slice(2, 8)}`,
    walletAddress: '0xtest',
    side,
    pricePerHour: price,
    quantity: qty,
    duration: 24,
    status: 'ACTIVE',
  } as any);

  it('should separate and sort bids and asks', () => {
    const orders = [
      makeOrder('BUY', '0.25', 2),
      makeOrder('BUY', '0.30', 4),
      makeOrder('SELL', '0.22', 3),
      makeOrder('SELL', '0.18', 1),
    ];

    const book = buildOrderBook('H100', orders);

    expect(book.bids).toHaveLength(2);
    expect(book.asks).toHaveLength(2);
    expect(book.bids[0].price).toBe(0.30); // Highest first
    expect(book.asks[0].price).toBe(0.18); // Lowest first
    expect(book.bestBid).toBe(0.30);
    expect(book.bestAsk).toBe(0.18);
    expect(book.spread).toBe(-0.12); // Negative = overlap
  });

  it('should handle empty order list', () => {
    const book = buildOrderBook('A100', []);
    expect(book.bids).toHaveLength(0);
    expect(book.asks).toHaveLength(0);
    expect(book.bestBid).toBeNull();
    expect(book.bestAsk).toBeNull();
    expect(book.spread).toBeNull();
  });
});
