import { matchOrders } from '../algorithms/order-matcher';

describe('matchOrders', () => {
  const makeBid = (id: string, price: number) => ({
    id, wallet: '0xbuyer', price, quantity: 2, duration: 24, gpuHours: 48,
  });
  const makeAsk = (id: string, price: number) => ({
    id, wallet: '0xseller', price, quantity: 2, duration: 24, gpuHours: 48,
  });

  it('should match eligible orders at clearing price', () => {
    const bids = [makeBid('b1', 0.30), makeBid('b2', 0.25)];
    const asks = [makeAsk('s1', 0.18), makeAsk('s2', 0.22)];
    const result = matchOrders(bids, asks, 0.22);

    expect(result.matchedPairs).toHaveLength(2);
    expect(result.matchedPairs[0].buyOrderId).toBe('b1');
    expect(result.matchedPairs[0].sellOrderId).toBe('s1');
  });

  it('should leave unmatched orders when counts differ', () => {
    const bids = [makeBid('b1', 0.30), makeBid('b2', 0.25), makeBid('b3', 0.22)];
    const asks = [makeAsk('s1', 0.20)];
    const result = matchOrders(bids, asks, 0.22);

    expect(result.matchedPairs).toHaveLength(1);
    expect(result.unmatchedBids).toHaveLength(2);
    expect(result.unmatchedAsks).toHaveLength(0);
  });

  it('should filter out ineligible orders', () => {
    const bids = [makeBid('b1', 0.15)]; // Below clearing
    const asks = [makeAsk('s1', 0.30)]; // Above clearing
    const result = matchOrders(bids, asks, 0.22);

    expect(result.matchedPairs).toHaveLength(0);
  });

  it('should handle empty inputs', () => {
    const result = matchOrders([], [], 0.22);
    expect(result.matchedPairs).toHaveLength(0);
  });
});
