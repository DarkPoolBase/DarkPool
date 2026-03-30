export enum GpuType {
  H100 = 'H100',
  A100 = 'A100',
  RTX4090 = 'RTX4090',
  L40S = 'L40S',
  H200 = 'H200',
  A10G = 'A10G',
}

export const GPU_TYPE_SPECS: Record<GpuType, { vram: number; tier: string }> = {
  [GpuType.H100]: { vram: 80, tier: 'Premium' },
  [GpuType.A100]: { vram: 80, tier: 'Standard' },
  [GpuType.RTX4090]: { vram: 24, tier: 'Economy' },
  [GpuType.L40S]: { vram: 48, tier: 'Standard' },
  [GpuType.H200]: { vram: 141, tier: 'Premium' },
  [GpuType.A10G]: { vram: 24, tier: 'Economy' },
};
