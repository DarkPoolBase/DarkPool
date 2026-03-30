import { Order } from '../entities/order.entity';

export class OrderResponseDto {
  id!: string;
  side!: string;
  gpuType!: string;
  quantity!: number;
  pricePerHour!: number;
  duration!: number;
  escrowAmount!: number;
  status!: string;
  batchId?: number | null;
  clearingPrice?: number | null;
  txHash?: string | null;
  createdAt!: string;
  updatedAt!: string;

  static fromEntity(order: Order): OrderResponseDto {
    return {
      id: order.id,
      side: order.side,
      gpuType: order.gpuType,
      quantity: order.quantity,
      pricePerHour: parseFloat(order.pricePerHour),
      duration: order.duration,
      escrowAmount: parseFloat(order.escrowAmount),
      status: order.status,
      batchId: order.batchId,
      clearingPrice: order.clearingPrice ? parseFloat(order.clearingPrice) : null,
      txHash: order.txHash,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
