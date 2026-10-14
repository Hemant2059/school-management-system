import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from './database.service';

export interface TenantRequestUser {
  userId: number;
  schoolId?: number;
  userType?: string;
}

/**
 * Single home for tenant resolution (used by TenantInterceptor AND
 * PermissionsGuard — guards run before interceptors in Nest, so the guard
 * cannot rely on interceptor-set context).
 *
 * Source: JWT schoolId by default, overridable via X-School-Id header.
 * The effective school is verified against school_members, except for
 * system users (users.is_system) who may roam for administration.
 */
@Injectable()
export class TenantService {
  constructor(private readonly db: DatabaseService) {}

  parseHeader(value: unknown): number | undefined {
    if (value == null || value === '') return undefined;
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : undefined;
  }

  async resolveSchoolId(args: {
    userId: number;
    jwtSchoolId?: number;
    headerSchoolId?: number;
  }): Promise<number> {
    const requested = args.headerSchoolId ?? args.jwtSchoolId;
    if (!requested) {
      throw new UnauthorizedException('No school context on request');
    }
    const allowed = await this.db.tenantTransaction(
      requested,
      async (client) => {
        const rows = await client.query(
          `SELECT (SELECT is_system FROM users WHERE user_id = $1) AS is_system,
                EXISTS (SELECT 1 FROM school_members
                         WHERE user_id = $1 AND school_id = $2
                           AND status = 'ACTIVE') AS is_member`,
          [args.userId, requested],
        );
        const row = rows.rows[0] as
          | { is_system: boolean | null; is_member: boolean }
          | undefined;
        return row?.is_system === true || row?.is_member === true;
      },
    );
    if (!allowed) {
      throw new ForbiddenException(
        'Access denied for the requested school (X-School-Id)',
      );
    }
    return requested;
  }
}
