import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';

export class GetOrderStatsQuery implements IQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetOrderStatsQuery)
export class GetOrderStatsHandler implements IQueryHandler<GetOrderStatsQuery> {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  async execute(query: GetOrderStatsQuery): Promise<Record<string, number>> {
    const result = await this.orderRepo
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('order.userId = :userId', { userId: query.userId })
      .groupBy('order.status')
      .getRawMany();

    const counts: Record<string, number> = {};
    for (const row of result) {
      counts[row.status] = parseInt(row.count);
    }
    return counts;
  }
}
