export interface OrderStatusEvent {
  type: 'order:status' | 'order:filled' | 'order:cancelled';
  userId: string;
  orderId: string;
  status: string;
  side?: string;
  gpuType?: string;
  escrowAmount?: string;
  clearingPrice?: string;
  batchId?: number;
  timestamp?: number;
}

export interface BatchSettlementEvent {
  type: 'batch:settled';
  batchId: number;
  clearingPrice: string;
  matchedVolume: string;
  protocolFee: string;
  gpuType: string;
  fillCount: number;
  txHash: string;
  timestamp: number;
}

