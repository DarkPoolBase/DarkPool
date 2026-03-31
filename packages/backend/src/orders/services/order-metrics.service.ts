import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';

export interface OrderMetrics {
  totalOrders: number;
  activeOrders: number;
  filledOrders24h: number;
  totalVolume24h: number;
  avgClearingPrice: number;
  ordersByGpuType: Record<string, number>;
}

@Injectable()
export class OrderMetricsService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  async getMetrics(): Promise<OrderMetrics> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [totalOrders, activeOrders] = await Promise.all([
      this.orderRepo.count(),
      this.orderRepo.count({ where: { status: 'ACTIVE' } }),
    ]);

    const filled24h = await this.orderRepo
      .createQueryBuilder('order')
      .where('order.status = :status', { status: 'FILLED' })
      .andWhere('order.updatedAt >= :since', { since: yesterday })
      .getMany();

    const totalVolume24h = filled24h.reduce(
      (sum, o) => sum + parseFloat(o.escrowAmount),
      0,
    );

    const avgClearingPrice =
      filled24h.length > 0
        ? filled24h.reduce((sum, o) => sum + parseFloat(o.clearingPrice || '0'), 0) / filled24h.length
        : 0;

    const gpuCounts = await this.orderRepo
      .createQueryBuilder('order')
      .select('order.gpuType', 'gpuType')
      .addSelect('COUNT(*)', 'count')
      .where('order.status = :status', { status: 'ACTIVE' })
      .groupBy('order.gpuType')
      .getRawMany();

    const ordersByGpuType: Record<string, number> = {};
    for (const row of gpuCounts) {
      ordersByGpuType[row.gpuType] = parseInt(row.count);
    }

    return {
      totalOrders,
      activeOrders,
      filledOrders24h: filled24h.length,
      totalVolume24h,
      avgClearingPrice,
      ordersByGpuType,
    };
  }
}

