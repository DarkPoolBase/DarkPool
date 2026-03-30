import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrdersService } from '../orders.service';
import { Order } from '../entities/order.entity';
import { RedisService } from '../../redis/redis.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockRedis = {
  publish: jest.fn().mockResolvedValue(undefined),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockRepository },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validInput = {
      side: 'BUY',
      gpuType: 'H100',
      quantity: 4,
      pricePerHour: 0.25,
      duration: 24,
      commitmentHash: '0x' + 'ab'.repeat(32),
    };

    it('should create an order with correct escrow amount', async () => {
      const savedOrder = { id: 'order-1', ...validInput, escrowAmount: '24.000000', status: 'ACTIVE' };
      mockRepository.create.mockReturnValue(savedOrder);
      mockRepository.save.mockResolvedValue(savedOrder);

      const result = await service.create('user-1', '0x1234', validInput);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          escrowAmount: '24.000000',
          status: 'ACTIVE',
        }),
      );
      expect(mockRedis.publish).toHaveBeenCalledWith(
        'adp:events:order',
        expect.stringContaining('order-1'),
      );
    });

    it('should reject invalid side', async () => {
      await expect(
        service.create('user-1', '0x1234', { ...validInput, side: 'INVALID' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid GPU type', async () => {
      await expect(
        service.create('user-1', '0x1234', { ...validInput, gpuType: 'RTX9090' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject quantity out of range', async () => {
      await expect(
        service.create('user-1', '0x1234', { ...validInput, quantity: 0 }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create('user-1', '0x1234', { ...validInput, quantity: 1001 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid commitment hash', async () => {
      await expect(
        service.create('user-1', '0x1234', { ...validInput, commitmentHash: 'not-a-hash' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should cancel an active order', async () => {
      const order = { id: 'order-1', userId: 'user-1', status: 'ACTIVE' };
      mockRepository.findOne.mockResolvedValue(order);
      mockRepository.save.mockResolvedValue({ ...order, status: 'CANCELLED' });

      const result = await service.cancel('order-1', 'user-1');
      expect(result.status).toBe('CANCELLED');
      expect(mockRedis.publish).toHaveBeenCalled();
    });

    it('should reject cancelling non-active order', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 'order-1', userId: 'user-1', status: 'FILLED' });
      await expect(service.cancel('order-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if order not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.cancel('order-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return order', async () => {
      const order = { id: 'order-1', userId: 'user-1' };
      mockRepository.findOne.mockResolvedValue(order);
      const result = await service.findById('order-1', 'user-1');
      expect(result.id).toBe('order-1');
    });

    it('should throw if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findById('order-1')).rejects.toThrow(NotFoundException);
    });
  });
});
