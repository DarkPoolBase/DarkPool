import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface GpuPrice {
  gpuType: string;
  price: string;
  change24h: number;
  volume24h: string;
}

interface MarketStats {
  totalProviders: number;
  totalVolume24h: string;
  totalTrades: number;
  avgClearingPrice: string;
}

interface PriceHistoryPoint {
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

interface VolumeData {
  [gpuType: string]: {
    volume24h: string;
    volume7d: string;
    volume30d: string;
  };
}

export function useMarketPrices() {
  return useQuery<GpuPrice[]>({
    queryKey: ['market', 'prices'],
    queryFn: () => api.get<GpuPrice[]>('/api/market/prices'),
    refetchInterval: 10000,
    placeholderData: [
      { gpuType: 'H100', price: '2.50', change24h: 3.2, volume24h: '15000' },
      { gpuType: 'A100', price: '1.20', change24h: -1.5, volume24h: '28000' },
      { gpuType: 'L40S', price: '0.85', change24h: 0.8, volume24h: '9500' },
      { gpuType: 'H200', price: '3.80', change24h: 5.1, volume24h: '4200' },
      { gpuType: 'A10G', price: '0.35', change24h: -0.3, volume24h: '12000' },
    ],
  });
}

export function useMarketStats() {
  return useQuery<MarketStats>({
    queryKey: ['market', 'stats'],
    queryFn: () => api.get<MarketStats>('/api/market/stats'),
    refetchInterval: 10000,
    placeholderData: {
      totalProviders: 42,
      totalVolume24h: '68700',
      totalTrades: 1247,
      avgClearingPrice: '1.85',
    },
  });
}

export function usePriceHistory(gpuType: string = 'H100', interval: string = '1h') {
  return useQuery<PriceHistoryPoint[]>({
    queryKey: ['market', 'history', gpuType, interval],
    queryFn: () =>
      api.get<PriceHistoryPoint[]>('/api/market/prices/history', {
        params: { gpuType, interval },
      }),
    refetchInterval: 30000,
  });
}

export function useMarketVolume() {
  return useQuery<VolumeData>({
    queryKey: ['market', 'volume'],
    queryFn: () => api.get<VolumeData>('/api/market/volume'),
    refetchInterval: 30000,
  });
}
