import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import {
  ROLES_KEY,
  ROLE_PERMISSIONS,
  PERMISSIONS_KEY,
} from '../decorators/roles.decorator';
import { RbacService } from '../../database/rbac.service';
import { TenantService } from '../../database/tenant.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userRole = user.userType as UserRole;

    if (requiredRoles.includes(userRole)) {
      return true;
    }

    throw new ForbiddenException(
      `Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${userRole}`,
    );
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbac: RbacService,
    private tenants: TenantService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Legacy super-admin bypass (unchanged behavior).
    if ((user.userType as UserRole) === UserRole.ADMIN) {
      return true;
    }

    // Same tenant resolution as the interceptor (guards run first).
    const schoolId = await this.tenants.resolveSchoolId({
      userId: user.userId,
      jwtSchoolId:
        user.schoolId !== undefined ? Number(user.schoolId) : undefined,
      headerSchoolId: this.tenants.parseHeader(
        request.headers?.['x-school-id'],
      ),
    });

    const dbPerms = await this.rbac.getUserPermissions(user.userId, schoolId);
    // Transitional fallback: users without any DB role keep the legacy
    // static map. Remove once role assignment is wired into user creation.
    const effective =
      dbPerms.length > 0
        ? dbPerms
        : ROLE_PERMISSIONS[user.userType as UserRole] || [];

    const hasPermission = requiredPermissions.some((perm) =>
      effective.includes(perm as any),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied. Required permissions: ${requiredPermissions.join(', ')}. Your role: ${user.userType}`,
      );
    }

    return true;
  }
}

@Injectable()
export class SchoolTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.userType === UserRole.ADMIN) {
      return true;
    }

    const requestSchoolId =
      request.params?.schoolId ||
      request.query?.schoolId ||
      request.body?.schoolId;

    if (!requestSchoolId) {
      return true;
    }

    const userSchoolId = user.schoolId?.toString();

    if (userSchoolId && userSchoolId !== requestSchoolId.toString()) {
      throw new ForbiddenException(
        `Access denied. You can only access data for school ID: ${userSchoolId}`,
      );
    }

    return true;
  }
}
