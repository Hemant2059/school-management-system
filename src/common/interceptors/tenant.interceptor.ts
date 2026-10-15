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

    const headerSchoolId = this.tenants.parseHeader(
      req.headers['x-school-id'] as string | undefined,
    );
    const jwtSchoolId =
      user.schoolId == null || user.schoolId === 0
        ? undefined
        : Number(user.schoolId);
    if (headerSchoolId === undefined && jwtSchoolId === undefined) {
      // Platform super-admins may work without a school context (e.g.
      // cross-school overview); the service pins per-school tenants itself.
      if ((user.userType as string) === 'SUPER_ADMIN') {
        return next.handle();
      }
    }

    const schoolId = await this.tenants.resolveSchoolId({
      userId: user.userId,
      jwtSchoolId,
      headerSchoolId,
    });
    req.tenantSchoolId = schoolId;
    return runWithTenant(schoolId, () => next.handle(), user.userId);
  }
}
