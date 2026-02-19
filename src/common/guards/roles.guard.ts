import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { ROLES_KEY, ROLE_PERMISSIONS } from '../decorators/roles.decorator';

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
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'permissions',
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

    const userRole = user.userType as UserRole;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    const hasPermission = requiredPermissions.some((perm) =>
      userPermissions.includes(perm as any),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied. Required permissions: ${requiredPermissions.join(', ')}. Your role: ${userRole}`,
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
    const path = request.route?.path || '';
    const method = request.method;

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
