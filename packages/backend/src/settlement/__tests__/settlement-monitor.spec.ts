import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SettlementMonitorService } from '../services/settlement-monitor.service';
import { Settlement } from '../../indexer/entities/settlement.entity';

describe('SettlementMonitorService', () => {
  let service: SettlementMonitorService;
  const mockRepo = {
    count: jest.fn().mockResolvedValue(10),
    find: jest.fn().mockResolvedValue([
      { clearingPrice: '0.22', totalVolume: '96.0', protocolFee: '0.17' },
      { clearingPrice: '0.25', totalVolume: '48.0', protocolFee: '0.10' },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettlementMonitorService,
        { provide: getRepositoryToken(Settlement), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<SettlementMonitorService>(SettlementMonitorService);
  });

  it('should return settlement stats', async () => {
    const stats = await service.getStats();
    expect(stats.totalSettlements).toBe(10);
    expect(stats.settlements24h).toBe(2);
    expect(stats.totalVolume24h).toBe(144);
    expect(stats.avgClearingPrice24h).toBeCloseTo(0.235);
    expect(stats.totalProtocolFees24h).toBeCloseTo(0.27);
  });
});
