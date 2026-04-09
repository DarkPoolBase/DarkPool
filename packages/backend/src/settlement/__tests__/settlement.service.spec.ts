import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SettlementService } from '../settlement.service';
import { Settlement } from '../../indexer/entities/settlement.entity';
import { OrdersService } from '../../orders/orders.service';
import { RedisService } from '../../redis/redis.service';

describe('SettlementService', () => {
  let service: SettlementService;
  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };
  const mockOrders = {
    fillOrders: jest.fn().mockResolvedValue(undefined),
  };
  const mockRedis = {
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
  };
  const mockConfig = {
    get: jest.fn().mockReturnValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettlementService,
        { provide: getRepositoryToken(Settlement), useValue: mockRepo },
        { provide: OrdersService, useValue: mockOrders },
        { provide: RedisService, useValue: mockRedis },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get<SettlementService>(SettlementService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process a batch settlement', async () => {
    const batch = {
      batchId: 1,
      gpuType: 'H100',
      clearingPrice: 0.22,
      matchedPairs: [
        { buyOrderId: 'b1', sellOrderId: 's1', buyerWallet: '0x1', sellerWallet: '0x2', quantity: 2, duration: 24 },
      ],
      matchedVolume: 48,
      totalValueUSDC: 10.56,
      protocolFee: 0.08,
      unmatchedBuyOrders: [],
      unmatchedSellOrders: [],
      timestamp: Date.now(),
    };

    mockRepo.create.mockReturnValue({ ...batch, id: 'settle-1' });
    mockRepo.save.mockResolvedValue({ ...batch, id: 'settle-1' });

    await service.processSettlement(batch);

    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockOrders.fillOrders).toHaveBeenCalledWith(
      ['b1', 's1'], 1, 0.22, expect.any(String),
    );
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'adp:events:settlement',
      expect.stringContaining('"batchId":1'),
    );
  });

  it('should handle duplicate settlement idempotently', async () => {
    mockRepo.create.mockReturnValue({});
    mockRepo.save.mockRejectedValue({ code: '23505' });

    const batch = {
      batchId: 1, gpuType: 'H100', clearingPrice: 0.22,
      matchedPairs: [{ buyOrderId: 'b1', sellOrderId: 's1', buyerWallet: '0x1', sellerWallet: '0x2', quantity: 2, duration: 24 }],
      matchedVolume: 48, totalValueUSDC: 10.56, protocolFee: 0.08,
      unmatchedBuyOrders: [], unmatchedSellOrders: [], timestamp: Date.now(),
    };

    await service.processSettlement(batch);
    expect(mockOrders.fillOrders).not.toHaveBeenCalled();
  });

  // Query tests moved to settlement/queries/ handlers
});
