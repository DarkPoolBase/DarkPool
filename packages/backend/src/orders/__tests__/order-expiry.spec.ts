import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderExpiryService } from '../services/order-expiry.service';
import { Order } from '../entities/order.entity';
import { RedisService } from '../../redis/redis.service';

describe('OrderExpiryService', () => {
  let service: OrderExpiryService;
  const mockRepo = {
    find: jest.fn(),
    save: jest.fn(),
  };
  const mockRedis = {
    publish: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderExpiryService,
        { provide: getRepositoryToken(Order), useValue: mockRepo },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<OrderExpiryService>(OrderExpiryService);
    jest.clearAllMocks();
  });

  it('should return 0 when no stale orders', async () => {
    mockRepo.find.mockResolvedValue([]);
    const count = await service.expireStaleOrders();
    expect(count).toBe(0);
  });

  it('should expire stale orders and publish events', async () => {
    const staleOrders = [
      { id: 'order-1', userId: 'user-1', status: 'ACTIVE' },
      { id: 'order-2', userId: 'user-2', status: 'ACTIVE' },
    ];
    mockRepo.find.mockResolvedValue(staleOrders);
    mockRepo.save.mockImplementation((o) => Promise.resolve(o));

    const count = await service.expireStaleOrders();

    expect(count).toBe(2);
    expect(mockRepo.save).toHaveBeenCalledTimes(2);
    expect(mockRedis.publish).toHaveBeenCalledTimes(2);
  });
});
