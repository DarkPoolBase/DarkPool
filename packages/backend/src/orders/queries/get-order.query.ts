import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { Order } from '../entities/order.entity';

export class GetOrderQuery implements IQuery {
  constructor(
    public readonly orderId: string,
    public readonly userId?: string,
  ) {}
}

@QueryHandler(GetOrderQuery)
export class GetOrderHandler implements IQueryHandler<GetOrderQuery> {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  async execute(query: GetOrderQuery): Promise<Order> {
    const where: Record<string, unknown> = { id: query.orderId };
    if (query.userId) {
      where.userId = query.userId;
    }
    const order = await this.orderRepo.findOne({ where });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
