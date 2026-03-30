import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { OrderResponse, CreateOrderDto } from '../../packages/backend/src/shared/types';

export function useOrders(filters?: { status?: string; side?: string; gpuType?: string }) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => api.get<OrderResponse[]>('/api/v1/orders', { params: filters as Record<string, string> }),
    enabled: false, // Enable when backend is ready
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => api.get<OrderResponse>(`/api/v1/orders/${orderId}`),
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: CreateOrderDto) => api.post<OrderResponse>('/api/v1/orders', order),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.delete<void>(`/api/v1/orders/${orderId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}
