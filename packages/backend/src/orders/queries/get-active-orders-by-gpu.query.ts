import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';

export class GetActiveOrdersByGpuQuery implements IQuery {
  constructor(public readonly gpuType: string) {}
}

@QueryHandler(GetActiveOrdersByGpuQuery)
export class GetActiveOrdersByGpuHandler implements IQueryHandler<GetActiveOrdersByGpuQuery> {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  async execute(query: GetActiveOrdersByGpuQuery): Promise<Order[]> {
    return this.orderRepo.find({
      where: { gpuType: query.gpuType, status: 'ACTIVE' },
      order: { createdAt: 'ASC' },
    });
  }
}
