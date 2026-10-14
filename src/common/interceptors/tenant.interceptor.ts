import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { FastifyRequest } from 'fastify';
import { TenantService } from '../../database/tenant.service';
import { runWithTenant } from '../../database/tenant-context';

interface RequestUser {
  userId: number;
  schoolId?: number;
  userType?: string;
}

/**
 * Resolves the tenant school for the request and pins it for its duration.
 * Public routes (no req.user) pass through untouched. Resolution itself
 * lives in TenantService (shared with PermissionsGuard, which runs earlier).
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenants: TenantService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest<
      FastifyRequest & {
        user?: RequestUser;
        tenantSchoolId?: number;
      }
    >();
    const user = req.user;
    if (!user?.userId) {
      return next.handle();
    }

    const schoolId = await this.tenants.resolveSchoolId({
      userId: user.userId,
      jwtSchoolId:
        user.schoolId !== undefined ? Number(user.schoolId) : undefined,
      headerSchoolId: this.tenants.parseHeader(
        req.headers['x-school-id'] as string | undefined,
      ),
    });
    req.tenantSchoolId = schoolId;
    return runWithTenant(schoolId, () => next.handle(), user.userId);
  }
}
