import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { Order } from '../entities/order.entity';
import { RedisService } from '../../redis/redis.service';
import { CreateOrderInput } from '../orders.service';

const VALID_SIDES = ['BUY', 'SELL'];
const VALID_GPU_TYPES = ['H100', 'A100', 'RTX4090', 'L40S', 'H200', 'A10G'];
const MIN_PRICE = 0.001;
const MAX_PRICE = 100;
const MIN_QUANTITY = 1;
const MAX_QUANTITY = 1000;
const MIN_DURATION = 1;
const MAX_DURATION = 720;

export class CreateOrderCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly walletAddress: string,
    public readonly input: CreateOrderInput,
  ) {}
}

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private redis: RedisService,
  ) {}

  async execute(command: CreateOrderCommand): Promise<Order> {
    const { userId, walletAddress, input } = command;

    if (!VALID_SIDES.includes(input.side)) {
      throw new BadRequestException(`Invalid side: ${input.side}. Must be BUY or SELL`);
    }
    if (!VALID_GPU_TYPES.includes(input.gpuType)) {
      throw new BadRequestException(
        `Invalid gpuType: ${input.gpuType}. Must be one of: ${VALID_GPU_TYPES.join(', ')}`,
      );
    }
    if (input.quantity < MIN_QUANTITY || input.quantity > MAX_QUANTITY) {
      throw new BadRequestException(`Quantity must be between ${MIN_QUANTITY} and ${MAX_QUANTITY}`);
    }
    if (input.pricePerHour < MIN_PRICE || input.pricePerHour > MAX_PRICE) {
      throw new BadRequestException(`Price must be between ${MIN_PRICE} and ${MAX_PRICE} USDC/hr`);
    }
    if (input.duration < MIN_DURATION || input.duration > MAX_DURATION) {
      throw new BadRequestException(`Duration must be between ${MIN_DURATION} and ${MAX_DURATION} hours`);
    }
    if (!input.commitmentHash || !/^0x[a-fA-F0-9]{64}$/.test(input.commitmentHash)) {
      throw new BadRequestException('Invalid commitment hash format');
    }

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
}
