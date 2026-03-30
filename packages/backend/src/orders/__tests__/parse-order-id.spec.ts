import { ParseOrderIdPipe } from '../pipes/parse-order-id.pipe';
import { BadRequestException } from '@nestjs/common';

describe('ParseOrderIdPipe', () => {
  const pipe = new ParseOrderIdPipe();

  it('should accept valid UUID', () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';
    expect(pipe.transform(id)).toBe(id);
  });

  it('should reject non-UUID string', () => {
    expect(() => pipe.transform('not-a-uuid')).toThrow(BadRequestException);
  });

  it('should reject empty string', () => {
    expect(() => pipe.transform('')).toThrow(BadRequestException);
  });
});
