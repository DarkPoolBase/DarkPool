import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ProviderData {
  id: string;
  userId: string;
  name: string;
  gpuTypes: { type: string; count: number; available: number }[];
  region: string | null;
  uptimePct: number;
  reputation: number;
  totalJobs: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ProviderListResponse {
  data: ProviderData[];
  total: number;
}

export function useProviders(page = 1, limit = 20) {
  return useQuery<ProviderListResponse>({
    queryKey: ['providers', page, limit],
    queryFn: () =>
      api.get<ProviderListResponse>('/api/providers', {
        params: { page: String(page), limit: String(limit) },
      }),
    placeholderData: {
      data: [],
      total: 0,
    },
  });
}

export function useProvider(id: string) {
  return useQuery<ProviderData>({
    queryKey: ['providers', id],
    queryFn: () => api.get<ProviderData>(`/api/providers/${id}`),
    enabled: !!id,
  });
}

export function useProviderReputation(id: string) {
  return useQuery<{ reputation: number; uptimePct: number; totalJobs: number }>({
    queryKey: ['providers', id, 'reputation'],
    queryFn: () =>
      api.get(`/api/providers/${id}/reputation`),
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
    }) => api.post<ProviderData>('/api/providers', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['providers'] }),
  });
}

export function useUpdateCapacity(providerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (gpuTypes: { type: string; count: number; available: number }[]) =>
      api.post<ProviderData>(`/api/providers/${providerId}/capacity`, { gpuTypes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['providers', providerId] }),
  });
}
