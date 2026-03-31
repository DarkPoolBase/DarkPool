export interface SettlementConfirmedEvent {
  type: 'batch:settled';
  batchId: number;
  gpuType: string;
  clearingPrice: string;
  matchedVolume: string;
  numFills: number;
  protocolFee: string;
  txHash: string | null;
  timestamp: number;
}

export interface SettlementFailedEvent {
  type: 'batch:failed';
  batchId: number;
  gpuType: string;
  reason: string;
  timestamp: number;
}
