import { GpuType } from './order.types';

export interface MarketStats {
  totalVolume24h: number;
  totalProviders: number;
  totalGpuHours: number;
  avgClearingPrices: Record<GpuType, number>;
  batchCount24h: number;
}

export interface PriceHistoryPoint {
  timestamp: string;
  price: number;
  volume: number;
}
