import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from '../orders.controller';
import { OrdersService } from '../orders.service';

const mockService = {
  create: jest.fn(),
  findAllForUser: jest.fn(),
  findById: jest.fn(),
  cancel: jest.fn(),
  countByStatus: jest.fn(),
};

describe('OrdersController', () => {
  let controller: OrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: mockService }],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should pass user info from JWT to service', async () => {
      const req = { user: { sub: 'user-1', wallet: '0x1234' } };
      const body = {
        side: 'BUY',
        gpuType: 'H100',
        quantity: 4,
        pricePerHour: 0.25,
        duration: 24,
        commitmentHash: '0x' + 'ab'.repeat(32),
      };
      mockService.create.mockResolvedValue({ id: 'order-1' });

      await controller.create(req, body);

      expect(mockService.create).toHaveBeenCalledWith('user-1', '0x1234', body);
    });
  });

  describe('findAll', () => {
    it('should pass filters and pagination', async () => {
      const req = { user: { sub: 'user-1' } };
      mockService.findAllForUser.mockResolvedValue({ data: [], total: 0 });

      await controller.findAll(req, 'ACTIVE', 'BUY', 'H100', '2', '10');

      expect(mockService.findAllForUser).toHaveBeenCalledWith('user-1', {
        status: 'ACTIVE',
        side: 'BUY',
        gpuType: 'H100',
        page: 2,
        limit: 10,
      });
    });
  });

  describe('cancel', () => {
    it('should call service with order ID and user ID', async () => {
      const req = { user: { sub: 'user-1' } };
      mockService.cancel.mockResolvedValue({ id: 'order-1', status: 'CANCELLED' });

      await controller.cancel('order-1', req);

      expect(mockService.cancel).toHaveBeenCalledWith('order-1', 'user-1');
    });
  });

  describe('getStats', () => {
    it('should return status counts', async () => {
      const req = { user: { sub: 'user-1' } };
      mockService.countByStatus.mockResolvedValue({ ACTIVE: 5, FILLED: 12, CANCELLED: 2 });

      const result = await controller.getStats(req);

      expect(result).toEqual({ ACTIVE: 5, FILLED: 12, CANCELLED: 2 });
    });
  });
});
