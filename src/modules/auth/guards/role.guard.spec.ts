import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoleGuard } from './role.guard.js';
import { Role } from '../../profile/enums/enum.js';
import { ForbiddenException } from '@nestjs/common';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let mockReflector: any;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: vi.fn(),
    };
    guard = new RoleGuard(mockReflector);
  });

  function createMockExecutionContext(user?: any) {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  }

  it('should allow access if no roles are required', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockExecutionContext({ role: Role.USER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has the required role', () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const context = createMockExecutionContext({ role: Role.ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks the required role', () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const context = createMockExecutionContext({ role: Role.USER });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user is not present on request', () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const context = createMockExecutionContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
