import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderMetricsService } from '../services/order-metrics.service';
import { Order } from '../entities/order.entity';

describe('OrderMetricsService', () => {
  let service: OrderMetricsService;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getRawMany: jest.fn().mockResolvedValue([]),
  };

  const mockRepo = {
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderMetricsService,
        { provide: getRepositoryToken(Order), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<OrderMetricsService>(OrderMetricsService);
  });

  it('should return zero metrics when no orders', async () => {
    const metrics = await service.getMetrics();
    expect(metrics.totalOrders).toBe(0);
    expect(metrics.activeOrders).toBe(0);
    expect(metrics.totalVolume24h).toBe(0);
  });
});
