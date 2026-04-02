import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

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
  const query = useQuery<GpuPrice[]>({
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

  // Check price alerts whenever prices update
  const triggeredRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!query.data) return;
    try {
      const alerts = JSON.parse(localStorage.getItem('darkpool_price_alerts') || '[]');
      const priceMap: Record<string, number> = {};
      for (const p of query.data) {
        priceMap[p.gpuType] = parseFloat(p.price);
      }
      for (const alert of alerts) {
        if (!alert.active) continue;
        const current = priceMap[alert.gpuType];
        if (current === undefined) continue;
        const triggered =
          (alert.direction === 'below' && current < alert.threshold) ||
          (alert.direction === 'above' && current > alert.threshold);
        if (triggered && !triggeredRef.current.has(alert.id)) {
          triggeredRef.current.add(alert.id);
          toast(`${alert.gpuType} is now $${current.toFixed(2)}/hr`, {
            description: `${alert.direction === 'below' ? 'Below' : 'Above'} your $${alert.threshold.toFixed(2)} alert`,
          });
          // Reset after 5 min so it can trigger again
          setTimeout(() => triggeredRef.current.delete(alert.id), 300000);
        }
      }
    } catch { /* ignore */ }
  }, [query.data]);

  return query;
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

export type AvailabilityMap = Record<string, { available: number; inStock: boolean }>;

export function useGpuAvailability() {
  return useQuery<AvailabilityMap>({
    queryKey: ['market', 'availability'],
    queryFn: () => api.get<AvailabilityMap>('/api/market/availability'),
    refetchInterval: 120_000, // matches backend 2-min cache
    staleTime: 60_000,
  });
}
