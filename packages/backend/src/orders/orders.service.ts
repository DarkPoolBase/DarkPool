import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Order } from './entities/order.entity';
import { CreateOrderCommand } from './commands/create-order.command';
import { CancelOrderCommand } from './commands/cancel-order.command';
import { FillOrdersCommand } from './commands/fill-orders.command';
import { GetOrdersQuery } from './queries/get-orders.query';
import { GetOrderQuery } from './queries/get-order.query';
import { GetOrderStatsQuery } from './queries/get-order-stats.query';
import { GetActiveOrdersByGpuQuery } from './queries/get-active-orders-by-gpu.query';

export interface CreateOrderInput {
  side: string;
  gpuType: string;
  quantity: number;
  pricePerHour: number;
  duration: number;
  commitmentHash: string;
  encryptedDetails?: string;
}

export interface OrderFilters {
  status?: string;
  side?: string;
  gpuType?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async create(
    userId: string,
    walletAddress: string,
    input: CreateOrderInput,
  ): Promise<Order> {
    return this.commandBus.execute(
      new CreateOrderCommand(userId, walletAddress, input),
    );
  }

  async findAllForUser(
    userId: string,
    filters: OrderFilters,
  ): Promise<{ data: Order[]; total: number; page: number; limit: number }> {
    return this.queryBus.execute(new GetOrdersQuery(userId, filters));
  }

  async findById(orderId: string, userId?: string): Promise<Order> {
    return this.queryBus.execute(new GetOrderQuery(orderId, userId));
  }

  async cancel(orderId: string, userId: string): Promise<Order> {
    return this.commandBus.execute(new CancelOrderCommand(orderId, userId));
  }

  async getActiveOrdersByGpuType(gpuType: string): Promise<Order[]> {
    return this.queryBus.execute(new GetActiveOrdersByGpuQuery(gpuType));
  }

  async fillOrders(
    orderIds: string[],
    batchId: number,
    clearingPrice: number,
    txHash: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new FillOrdersCommand(orderIds, batchId, clearingPrice, txHash),
    );
  }

  async countByStatus(userId: string): Promise<Record<string, number>> {
    return this.queryBus.execute(new GetOrderStatsQuery(userId));
  }
}
