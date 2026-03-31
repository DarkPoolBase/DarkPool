import { OrderBookEntry } from '../types/order-book.interface';

/**
 * Calculate bid-ask spread metrics for a GPU type
 */
export function calculateSpread(bids: OrderBookEntry[], asks: OrderBookEntry[]) {
  if (bids.length === 0 || asks.length === 0) {
    return { spread: null, spreadPct: null, midPrice: null };
  }

  const bestBid = bids[0].price;
  const bestAsk = asks[0].price;
  const spread = bestAsk - bestBid;
  const midPrice = (bestBid + bestAsk) / 2;
  const spreadPct = midPrice > 0 ? (spread / midPrice) * 100 : null;

  return { spread, spreadPct, midPrice };
}

/**
 * Calculate volume-weighted average price (VWAP) for bids
 */
export function calculateVWAP(entries: OrderBookEntry[]): number | null {
  if (entries.length === 0) return null;
  const totalValue = entries.reduce((sum, e) => sum + e.price * e.gpuHours, 0);
  const totalVolume = entries.reduce((sum, e) => sum + e.gpuHours, 0);
  return totalVolume > 0 ? totalValue / totalVolume : null;
}
