import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface GpuPrice {
  gpuType: string;
  price: string;
  change24h: number;
  volume24h: string;
}

@Injectable()
export class MarketService {
  private readonly CACHE_TTL = 10; // seconds

  constructor(private redis: RedisService) {}

  async getPrices(): Promise<GpuPrice[]> {
    const cached = await this.redis.get('adp:market:prices');
    if (cached) return JSON.parse(cached);

    // TODO: Aggregate from settlements table once indexer is running
    const prices: GpuPrice[] = [
      { gpuType: 'H100', price: '2.50', change24h: 3.2, volume24h: '15000' },
      { gpuType: 'A100', price: '1.20', change24h: -1.5, volume24h: '28000' },
      { gpuType: 'L40S', price: '0.85', change24h: 0.8, volume24h: '9500' },
      { gpuType: 'H200', price: '3.80', change24h: 5.1, volume24h: '4200' },
      { gpuType: 'A10G', price: '0.35', change24h: -0.3, volume24h: '12000' },
    ];

    await this.redis.set('adp:market:prices', JSON.stringify(prices), this.CACHE_TTL);
    return prices;
  }

  async getPriceHistory(
    gpuType: string,
    interval: string = '1h',
    limit: number = 100,
  ): Promise<{ timestamp: string; open: string; high: string; low: string; close: string; volume: string }[]> {
    const cacheKey = `adp:market:history:${gpuType}:${interval}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // TODO: Query from settlements table once indexer is running
    // Map interval to milliseconds for proper time spacing
    const intervalMs: Record<string, number> = {
      '1h': 3600000,
      '4h': 4 * 3600000,
      '1d': 24 * 3600000,
      '1w': 7 * 24 * 3600000,
    };
    const stepMs = intervalMs[interval] || 3600000;

    // Use a seeded approach so the same interval+gpuType returns consistent data
    const basePrices: Record<string, number> = {
      H100: 2.5, A100: 1.2, L40S: 0.85, H200: 3.8, A10G: 0.35,
    };
    const base = basePrices[gpuType] || 1.0;

    // Generate deterministic-ish data using the timestamp as seed
    const history = Array.from({ length: limit }, (_, i) => {
      const time = new Date(Date.now() - (limit - i) * stepMs);
      // Use day-of-year + index as a simple seed for consistency
      const seed = (time.getDate() * 100 + i * 7 + time.getHours()) % 100;
      const variance = ((seed / 100) - 0.5) * 0.4 * base;
      const price = Math.max(0.01, base + variance);
      return {
        timestamp: time.toISOString(),
        open: price.toFixed(4),
        high: (price + base * 0.02).toFixed(4),
        low: (price - base * 0.02).toFixed(4),
        close: price.toFixed(4),
        volume: Math.floor(200 + seed * 5).toString(),
      };
    });

    await this.redis.set(cacheKey, JSON.stringify(history), this.CACHE_TTL);
    return history;
  }

  async getVolume(): Promise<Record<string, { volume24h: string; volume7d: string; volume30d: string }>> {
    const cached = await this.redis.get('adp:market:volume');
    if (cached) return JSON.parse(cached);

    // TODO: Aggregate from settlements table
    const volume = {
      H100: { volume24h: '15000', volume7d: '98000', volume30d: '380000' },
      A100: { volume24h: '28000', volume7d: '185000', volume30d: '720000' },
      L40S: { volume24h: '9500', volume7d: '62000', volume30d: '245000' },
      H200: { volume24h: '4200', volume7d: '28000', volume30d: '105000' },
      A10G: { volume24h: '12000', volume7d: '78000', volume30d: '310000' },
    };

    await this.redis.set('adp:market:volume', JSON.stringify(volume), this.CACHE_TTL);
    return volume;
  }

  async getStats(): Promise<{
    totalProviders: number;
    totalVolume24h: string;
    totalTrades: number;
    avgClearingPrice: string;
  }> {
    const cached = await this.redis.get('adp:market:stats');
    if (cached) return JSON.parse(cached);

    // TODO: Aggregate from real data
    const stats = {
      totalProviders: 42,
      totalVolume24h: '68700',
      totalTrades: 1247,
      avgClearingPrice: '1.85',
    };

    await this.redis.set('adp:market:stats', JSON.stringify(stats), this.CACHE_TTL);
    return stats;
  }
}


