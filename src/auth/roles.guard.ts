import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../common/enums/user-role.enum';
import { ROLES_KEY } from '../common/decorators/roles.decorator';

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
    // Platform super-admins manage all schools: bypass role checks.
    if (user?.userType === UserRole.SUPER_ADMIN) {
      return true;
    }
    return requiredRoles.some(
      (role) => user?.userType?.toUpperCase() === role.toUpperCase(),
    );
  }
}
