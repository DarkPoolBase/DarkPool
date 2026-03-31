import { OrderBookEntry } from '../types/order-book.interface';

interface DepthLevel {
  price: number;
  volume: number;
  cumulativeVolume: number;
  orderCount: number;
}

/**
 * Aggregate order book entries into price levels for depth chart display.
 * Used by the Market Module for anonymized depth visualization.
 */
export function aggregateDepth(
  entries: OrderBookEntry[],
  side: 'bids' | 'asks',
  bucketSize: number = 0.01,
): DepthLevel[] {
  const buckets = new Map<number, { volume: number; count: number }>();

  for (const entry of entries) {
    const bucket = Math.round(entry.price / bucketSize) * bucketSize;
    const existing = buckets.get(bucket) || { volume: 0, count: 0 };
    existing.volume += entry.gpuHours;
    existing.count += 1;
    buckets.set(bucket, existing);
  }

  const levels = Array.from(buckets.entries())
    .map(([price, data]) => ({ price, volume: data.volume, cumulativeVolume: 0, orderCount: data.count }))
    .sort((a, b) => side === 'bids' ? b.price - a.price : a.price - b.price);

  let cumulative = 0;
  for (const level of levels) {
    cumulative += level.volume;
    level.cumulativeVolume = cumulative;
  }

  return levels;
}

