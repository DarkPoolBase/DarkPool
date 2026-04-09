import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Order } from '../entities/order.entity';
import { RedisService } from '../../redis/redis.service';

export class CancelOrderCommand implements ICommand {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
  ) {}
}

@CommandHandler(CancelOrderCommand)
export class CancelOrderHandler implements ICommandHandler<CancelOrderCommand> {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private redis: RedisService,
  ) {}

  async execute(command: CancelOrderCommand): Promise<Order> {
    const { orderId, userId } = command;

    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.userId !== userId) {
      throw new ForbiddenException('Not authorized to cancel this order');
    }

    if (order.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Cannot cancel order with status: ${order.status}. Only ACTIVE orders can be cancelled.`,
      );
    }

    order.status = 'CANCELLED';
    const saved = await this.orderRepo.save(order);

    await this.redis.publish(
      'adp:events:order',
      JSON.stringify({
        type: 'order:status',
        userId,
        orderId: saved.id,
        status: 'CANCELLED',
      }),
    );

    return saved;
  }
}
