import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { RedisService } from '../../redis/redis.service';

export class FillOrdersCommand implements ICommand {
  constructor(
    public readonly orderIds: string[],
    public readonly batchId: number,
    public readonly clearingPrice: number,
    public readonly txHash: string,
  ) {}
}

@CommandHandler(FillOrdersCommand)
export class FillOrdersHandler implements ICommandHandler<FillOrdersCommand> {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private redis: RedisService,
  ) {}

  async execute(command: FillOrdersCommand): Promise<void> {
    const { orderIds, batchId, clearingPrice, txHash } = command;

    await this.orderRepo
      .createQueryBuilder()
      .update(Order)
      .set({
        status: 'FILLED',
        batchId,
        clearingPrice: clearingPrice.toFixed(6),
        txHash,
      })
      .whereInIds(orderIds)
      .execute();

    for (const orderId of orderIds) {
      const order = await this.orderRepo.findOne({ where: { id: orderId } });
      if (order) {
        await this.redis.publish(
          'adp:events:order',
          JSON.stringify({
            type: 'order:filled',
            userId: order.userId,
            orderId: order.id,
            status: 'FILLED',
            clearingPrice: clearingPrice.toFixed(6),
            batchId,
          }),
        );
      }
    }
  }
}
