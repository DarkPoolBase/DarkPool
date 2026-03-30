export interface OrderQueryOptions {
  userId?: string;
  status?: string;
  side?: string;
  gpuType?: string;
  batchId?: number;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'escrowAmount' | 'pricePerHour';
  sortOrder?: 'ASC' | 'DESC';
}

export interface OrderStatsResult {
  status: string;
  count: number;
}

export interface OrderVolumeResult {
  gpuType: string;
  totalVolume: number;
  orderCount: number;
  avgPrice: number;
}
