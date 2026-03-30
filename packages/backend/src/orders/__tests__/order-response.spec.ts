import { OrderResponseDto } from '../dto/order-response.dto';
import { Order } from '../entities/order.entity';

describe('OrderResponseDto', () => {
  it('should map entity to response', () => {
    const entity = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: 'user-1',
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      side: 'BUY',
      gpuType: 'H100',
      quantity: 4,
      pricePerHour: '0.250000',
      duration: 24,
      escrowAmount: '24.000000',
      commitmentHash: '0x' + 'ab'.repeat(32),
      encryptedDetails: null,
      status: 'ACTIVE',
      batchId: null,
      clearingPrice: null,
      txHash: null,
      createdAt: new Date('2026-03-30T00:00:00Z'),
      updatedAt: new Date('2026-03-30T00:00:00Z'),
    } as Order;

    const response = OrderResponseDto.fromEntity(entity);

    expect(response.id).toBe(entity.id);
    expect(response.pricePerHour).toBe(0.25);
    expect(response.escrowAmount).toBe(24);
    expect(response.clearingPrice).toBeNull();
    expect(response.createdAt).toBe('2026-03-30T00:00:00.000Z');
  });

  it('should parse clearing price when filled', () => {
    const entity = {
      id: '123',
      side: 'SELL',
      gpuType: 'A100',
      quantity: 2,
      pricePerHour: '1.200000',
      duration: 48,
      escrowAmount: '115.200000',
      status: 'FILLED',
      batchId: 42,
      clearingPrice: '1.150000',
      txHash: '0x' + 'ff'.repeat(32),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Order;

    const response = OrderResponseDto.fromEntity(entity);
    expect(response.clearingPrice).toBe(1.15);
    expect(response.batchId).toBe(42);
  });
});
