import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Order {
  id: string;
  userId: string;
  walletAddress: string;
  side: string;
  gpuType: string;
  quantity: number;
  pricePerHour: string;
  duration: number;
  escrowAmount: string;
  commitmentHash: string;
  status: string;
  batchId: number | null;
  clearingPrice: string | null;
  txHash: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedOrders {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

interface OrderMetrics {
  totalOrders: number;
  activeOrders: number;
  filledOrders24h: number;
  totalVolume24h: number;
  avgClearingPrice: number;
  ordersByGpuType: Record<string, number>;
}

interface CreateOrderInput {
  side: string;
  gpuType: string;
  quantity: number;
  pricePerHour: number;
  duration: number;
  commitmentHash: string;
  encryptedDetails?: string;
}

export type { Order, PaginatedOrders, OrderMetrics, CreateOrderInput };

export function useOrders(
  filters?: { status?: string; side?: string; gpuType?: string; page?: number; limit?: number },
  enabled = true,
) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (filters?.status && filters.status !== 'ALL') params.status = filters.status;
      if (filters?.side) params.side = filters.side;
      if (filters?.gpuType) params.gpuType = filters.gpuType;
      if (filters?.page) params.page = String(filters.page);
      if (filters?.limit) params.limit = String(filters.limit);
      return api.get<PaginatedOrders>('/api/orders', { params });
    },
    enabled,
    refetchInterval: 15000, // Refresh every 15s
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => api.get<Order>(`/api/orders/${orderId}`),
    enabled: !!orderId,
  });
}

export function useOrderStats(enabled = true) {
  return useQuery({
    queryKey: ['orderStats'],
    queryFn: () => api.get<Record<string, number>>('/api/orders/stats'),
    enabled,
    refetchInterval: 15000,
  });
}

export function useOrderMetrics() {
  return useQuery({
    queryKey: ['orderMetrics'],
    queryFn: () => api.get<OrderMetrics>('/api/orders/metrics'),
    refetchInterval: 30000,
  });
}

export function useSettlements(limit = 10) {
  return useQuery({
    queryKey: ['settlements', limit],
    queryFn: () => api.get<any[]>('/api/settlements', { params: { limit: String(limit) } }),
    refetchInterval: 30000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: CreateOrderInput) => api.post<Order>('/api/orders', order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
      queryClient.invalidateQueries({ queryKey: ['orderMetrics'] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.delete<Order>(`/api/orders/${orderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
      queryClient.invalidateQueries({ queryKey: ['orderMetrics'] });
    },
  });
}

