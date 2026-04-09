import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';

const VALID_STATUSES = ['PENDING', 'ACTIVE', 'FILLED', 'CANCELLED', 'EXPIRED'];
const VALID_SIDES = ['BUY', 'SELL'];
const VALID_GPU_TYPES = ['H100', 'A100', 'RTX4090', 'L40S', 'H200', 'A10G'];

export class GetOrdersQuery implements IQuery {
  constructor(
    public readonly userId: string,
    public readonly filters: {
      status?: string;
      side?: string;
      gpuType?: string;
      page?: number;
      limit?: number;
    },
  ) {}
}

@QueryHandler(GetOrdersQuery)
export class GetOrdersHandler implements IQueryHandler<GetOrdersQuery> {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  async execute(query: GetOrdersQuery) {
    const { userId, filters } = query;
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);

    const where: Record<string, unknown> = { userId };

    if (filters.status && VALID_STATUSES.includes(filters.status)) {
      where.status = filters.status;
    }
    if (filters.side && VALID_SIDES.includes(filters.side)) {
      where.side = filters.side;
    }
    if (filters.gpuType && VALID_GPU_TYPES.includes(filters.gpuType)) {
      where.gpuType = filters.gpuType;
    }

    const [data, total] = await this.orderRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }
}
