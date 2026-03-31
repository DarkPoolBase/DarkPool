import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { RedisService } from '../redis/redis.service';

const VALID_SIDES = ['BUY', 'SELL'];
const VALID_GPU_TYPES = ['H100', 'A100', 'RTX4090', 'L40S', 'H200', 'A10G'];
const VALID_STATUSES = ['PENDING', 'ACTIVE', 'FILLED', 'CANCELLED', 'EXPIRED'];
const MIN_PRICE = 0.001;
const MAX_PRICE = 100;
const MIN_QUANTITY = 1;
const MAX_QUANTITY = 1000;
const MIN_DURATION = 1;
const MAX_DURATION = 720; // 30 days

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
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private redis: RedisService,
  ) {}

  async create(
    userId: string,
    walletAddress: string,
    input: CreateOrderInput,
  ): Promise<Order> {
    // Validate side
    if (!VALID_SIDES.includes(input.side)) {
      throw new BadRequestException(`Invalid side: ${input.side}. Must be BUY or SELL`);
    }

    // Validate GPU type
    if (!VALID_GPU_TYPES.includes(input.gpuType)) {
      throw new BadRequestException(
        `Invalid gpuType: ${input.gpuType}. Must be one of: ${VALID_GPU_TYPES.join(', ')}`,
      );
    }

    // Validate quantity
    if (input.quantity < MIN_QUANTITY || input.quantity > MAX_QUANTITY) {
      throw new BadRequestException(
        `Quantity must be between ${MIN_QUANTITY} and ${MAX_QUANTITY}`,
      );
    }

    // Validate price
    if (input.pricePerHour < MIN_PRICE || input.pricePerHour > MAX_PRICE) {
      throw new BadRequestException(
        `Price must be between ${MIN_PRICE} and ${MAX_PRICE} USDC/hr`,
      );
    }

    // Validate duration
    if (input.duration < MIN_DURATION || input.duration > MAX_DURATION) {
      throw new BadRequestException(
        `Duration must be between ${MIN_DURATION} and ${MAX_DURATION} hours`,
      );
    }

    // Validate commitment hash format
    if (!input.commitmentHash || !/^0x[a-fA-F0-9]{64}$/.test(input.commitmentHash)) {
      throw new BadRequestException('Invalid commitment hash format');
    }

    // Calculate escrow amount: quantity * pricePerHour * duration
    const escrowAmount = input.quantity * input.pricePerHour * input.duration;

    const order = this.orderRepo.create({
      userId,
      walletAddress: walletAddress.toLowerCase(),
      side: input.side,
      gpuType: input.gpuType,
      quantity: input.quantity,
      pricePerHour: input.pricePerHour.toString(),
      duration: input.duration,
      escrowAmount: escrowAmount.toFixed(6),
      commitmentHash: input.commitmentHash,
      encryptedDetails: input.encryptedDetails ?? null,
      status: 'ACTIVE',
    });

    const saved = await this.orderRepo.save(order);

    // Publish order event for WebSocket relay
    await this.redis.publish(
      'adp:events:order',
      JSON.stringify({
        type: 'order:status',
        userId,
        orderId: saved.id,
        status: 'ACTIVE',
        side: saved.side,
        gpuType: saved.gpuType,
        escrowAmount: saved.escrowAmount,
      }),
    );

    return saved;
  }

  async findAllForUser(
    userId: string,
    filters: OrderFilters,
  ): Promise<{ data: Order[]; total: number; page: number; limit: number }> {
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

  async findById(orderId: string, userId?: string): Promise<Order> {
    const where: Record<string, unknown> = { id: orderId };
    if (userId) {
      where.userId = userId;
    }
    const order = await this.orderRepo.findOne({ where });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async cancel(orderId: string, userId: string): Promise<Order> {
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

    // Publish cancellation event for WebSocket relay
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

  /**
   * Get active orders for a specific GPU type (used by Matching Engine)
   */
  async getActiveOrdersByGpuType(gpuType: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { gpuType, status: 'ACTIVE' },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Bulk update order statuses after batch settlement (used by Settlement Service)
   */
  async fillOrders(
    orderIds: string[],
    batchId: number,
    clearingPrice: number,
    txHash: string,
  ): Promise<void> {
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

    // Publish fill events for each order
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

  /**
   * Count active orders (used by Dashboard stats)
   */
  async countByStatus(userId: string): Promise<Record<string, number>> {
    const result = await this.orderRepo
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('order.userId = :userId', { userId })
      .groupBy('order.status')
      .getRawMany();

    const counts: Record<string, number> = {};
    for (const row of result) {
      counts[row.status] = parseInt(row.count);
    }
    return counts;
  }
}

