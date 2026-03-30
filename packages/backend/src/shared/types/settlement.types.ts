import { GpuType } from './order.types';

export interface BatchResult {
  batchId: number;
  gpuType: GpuType;
  clearingPrice: number;
  matchedBuyOrders: string[];
  matchedSellOrders: string[];
  matchedVolume: number;
  totalValueUSDC: number;
  protocolFee: number;
}

export interface SettlementEvent {
  type: 'batch:settled' | 'order:filled' | 'order:cancelled';
  payload: BatchResult | { orderId: string; clearingPrice?: number };
  timestamp: number;
}
