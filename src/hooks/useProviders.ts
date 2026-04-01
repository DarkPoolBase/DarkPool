import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ProviderData {
  id: string;
  userId: string;
  walletAddress: string | null;
  name: string;
  gpuTypes: { type: string; count: number; available: number }[];
  region: string | null;
  minPricePerHour: string;
  totalEarnings: string;
  pendingEarnings: string;
  uptimePct: number;
  reputation: number;
  totalJobs: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ProviderEarning {
  id: string;
  providerId: string;
  orderId: string;
  batchId: number;
  gpuType: string;
  amount: string;
  clearingPrice: string;
  createdAt: string;
}

interface EarningsResponse {
  earnings: ProviderEarning[];
  totalEarnings: string;
  pendingEarnings: string;
}

interface ProviderListResponse {
  data: ProviderData[];
  total: number;
}

export function useMyProvider(enabled = true) {
  return useQuery<ProviderData | null>({
    queryKey: ['providers', 'me'],
    queryFn: () => api.get<ProviderData | null>('/api/providers/me'),
    enabled,
    retry: false,
    placeholderData: null,
  });
}

export function useMyEarnings(enabled = true) {
  return useQuery<EarningsResponse>({
    queryKey: ['providers', 'me', 'earnings'],
    queryFn: () => api.get<EarningsResponse>('/api/providers/me/earnings'),
    enabled,
    placeholderData: { earnings: [], totalEarnings: '0', pendingEarnings: '0' },
    refetchInterval: 30_000,
  });
}

export function useProviders(page = 1, limit = 20) {
  return useQuery<ProviderListResponse>({
    queryKey: ['providers', page, limit],
    queryFn: () =>
      api.get<ProviderListResponse>('/api/providers', {
        params: { page: String(page), limit: String(limit) },
      }),
    placeholderData: { data: [], total: 0 },
  });
}

export function useProvider(id: string) {
  return useQuery<ProviderData>({
    queryKey: ['providers', id],
    queryFn: () => api.get<ProviderData>(`/api/providers/${id}`),
    enabled: !!id,
  });
}

export function useRegisterProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      gpuTypes: { type: string; count: number; available: number }[];
      region?: string;
      minPricePerHour?: number;
    }) => api.post<ProviderData>('/api/providers', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
    },
  });
}

export function useUpdateCapacity(providerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (gpuTypes: { type: string; count: number; available: number }[]) =>
      api.patch<ProviderData>(`/api/providers/${providerId}/capacity`, { gpuTypes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['providers'] }),
  });
}

export function useUpdateMinPrice(providerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (minPricePerHour: number) =>
      api.patch<ProviderData>(`/api/providers/${providerId}/min-price`, { minPricePerHour }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['providers'] }),
  });
}
