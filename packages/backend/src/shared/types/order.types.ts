export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum GpuType {
  H100 = 'H100',
  A100 = 'A100',
  RTX4090 = 'RTX4090',
  L40S = 'L40S',
}

export interface CreateOrderDto {
  side: OrderSide;
  gpuType: GpuType;
  quantity: number;
  pricePerHour: number;
  duration: number;
  commitmentHash: string;
  encryptedDetails: string;
}

export interface OrderResponse {
  id: string;
  side: OrderSide;
  gpuType: GpuType;
  quantity: number;
  pricePerHour: number;
  duration: number;
  escrowAmount: number;
  status: OrderStatus;
  batchId?: number;
  clearingPrice?: number;
  txHash?: string;
  createdAt: string;
}
