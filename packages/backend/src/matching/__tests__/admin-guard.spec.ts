import { AdminOnlyGuard } from '../guards/admin-only.guard';
import { ForbiddenException } from '@nestjs/common';

describe('AdminOnlyGuard', () => {
  const guard = new AdminOnlyGuard();
  const mockContext = (roles: string[]) => ({
    switchToHttp: () => ({
      getRequest: () => ({ user: { roles } }),
    }),
  } as any);

  it('should allow admin users', () => {
    expect(guard.canActivate(mockContext(['ADMIN']))).toBe(true);
  });

  it('should reject non-admin users', () => {
    expect(() => guard.canActivate(mockContext(['TRADER']))).toThrow(ForbiddenException);
  });

  it('should reject users with no roles', () => {
    expect(() => guard.canActivate(mockContext([]))).toThrow(ForbiddenException);
  });
});
