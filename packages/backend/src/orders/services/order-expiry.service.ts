import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Order } from '../entities/order.entity';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class OrderExpiryService {
  private readonly logger = new Logger(OrderExpiryService.name);

  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private redis: RedisService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async expireStaleOrders(): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const staleOrders = await this.orderRepo.find({
      where: {
        status: 'ACTIVE',
        createdAt: LessThan(sevenDaysAgo),
      },
    });

    if (staleOrders.length === 0) return 0;

    for (const order of staleOrders) {
      order.status = 'EXPIRED';
      await this.orderRepo.save(order);

      await this.redis.publish(
        'adp:events:order',
        JSON.stringify({
          type: 'order:status',
          userId: order.userId,
          orderId: order.id,
          status: 'EXPIRED',
        }),
      );
    }

    this.logger.log(`Expired ${staleOrders.length} stale orders`);
    return staleOrders.length;
  }
}

