import { Test, TestingModule } from '@nestjs/testing';
import { SettlementController } from '../settlement.controller';
import { SettlementService } from '../settlement.service';

describe('SettlementController', () => {
  let controller: SettlementController;
  const mockService = {
    getRecentSettlements: jest.fn(),
    getByBatchId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettlementController],
      providers: [{ provide: SettlementService, useValue: mockService }],
    }).compile();
    controller = module.get<SettlementController>(SettlementController);
    jest.clearAllMocks();
  });

  it('should return recent settlements', async () => {
    mockService.getRecentSettlements.mockResolvedValue([{ batchId: 1 }]);
    const result = await controller.getRecent('5');
    expect(mockService.getRecentSettlements).toHaveBeenCalledWith(5);
    expect(result).toHaveLength(1);
  });

  it('should return settlement by batch ID', async () => {
    mockService.getByBatchId.mockResolvedValue({ batchId: 42, clearingPrice: '0.22' });
    const result = await controller.getByBatchId('42');
    expect(result.batchId).toBe(42);
  });

  it('should return not found message for missing batch', async () => {
    mockService.getByBatchId.mockResolvedValue(null);
    const result = await controller.getByBatchId('999');
    expect(result.message).toContain('999');
  });
});
