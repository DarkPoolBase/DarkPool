import { Test, TestingModule } from '@nestjs/testing';
import { MatchingService } from '../matching.service';
import { OrdersService } from '../../orders/orders.service';
import { RedisService } from '../../redis/redis.service';

describe('MatchingService', () => {
  let service: MatchingService;
  const mockOrdersService = {
    getActiveOrdersByGpuType: jest.fn(),
  };
  const mockRedis = {
    publish: jest.fn().mockResolvedValue(undefined),
    getClient: jest.fn().mockReturnValue({
      set: jest.fn().mockResolvedValue('OK'),
      incr: jest.fn().mockResolvedValue(1),
    }),
    del: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();
    service = module.get<MatchingService>(MatchingService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return null when less than 2 orders', async () => {
    mockOrdersService.getActiveOrdersByGpuType.mockResolvedValue([]);
    const result = await service.runAuctionForGpuType('H100');
    expect(result).toBeNull();
  });

  it('should return null when no buy-sell overlap', async () => {
    mockOrdersService.getActiveOrdersByGpuType.mockResolvedValue([
      { id: '1', side: 'BUY', walletAddress: '0x1', pricePerHour: '0.10', quantity: 2, duration: 24 },
      { id: '2', side: 'SELL', walletAddress: '0x2', pricePerHour: '0.50', quantity: 2, duration: 24 },
    ]);
    const result = await service.runAuctionForGpuType('H100');
    expect(result).toBeNull();
  });

  it('should match orders when overlap exists', async () => {
    mockOrdersService.getActiveOrdersByGpuType.mockResolvedValue([
      { id: 'b1', side: 'BUY', walletAddress: '0x1', pricePerHour: '0.30', quantity: 2, duration: 24 },
      { id: 's1', side: 'SELL', walletAddress: '0x2', pricePerHour: '0.20', quantity: 2, duration: 24 },
    ]);
    const result = await service.runAuctionForGpuType('H100');
    expect(result).not.toBeNull();
    expect(result!.matchedPairs).toHaveLength(1);
    expect(result!.clearingPrice).toBeGreaterThanOrEqual(0.20);
    expect(result!.clearingPrice).toBeLessThanOrEqual(0.30);
  });
});
