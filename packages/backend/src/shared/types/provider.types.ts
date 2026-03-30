import { GpuType } from './order.types';

export interface RegisterProviderDto {
  gpuModel: GpuType;
  gpuCount: number;
  vram: number;
  bandwidth: number;
  location: string;
}

export interface ProviderResponse {
  id: string;
  gpuModel: GpuType;
  gpuCount: number;
  reputationScore: number;
  totalEarnings: number;
  uptime: number;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
}
