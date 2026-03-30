import { PaginatedResponseDto } from '../dto/paginated-response.dto';

describe('PaginatedResponseDto', () => {
  it('should calculate total pages correctly', () => {
    const result = PaginatedResponseDto.create([1, 2, 3], 25, 1, 10);
    expect(result.totalPages).toBe(3);
    expect(result.data).toHaveLength(3);
    expect(result.total).toBe(25);
  });

  it('should handle single page', () => {
    const result = PaginatedResponseDto.create(['a', 'b'], 2, 1, 20);
    expect(result.totalPages).toBe(1);
  });

  it('should handle empty results', () => {
    const result = PaginatedResponseDto.create([], 0, 1, 20);
    expect(result.totalPages).toBe(0);
    expect(result.data).toHaveLength(0);
  });
});
