import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class MultiTenancyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    const schoolId = user.schoolId;

    if (!schoolId) {
      return next.handle();
    }

    if (
      request.method === 'POST' ||
      request.method === 'PUT' ||
      request.method === 'PATCH'
    ) {
      const body = request.body;

      if (Array.isArray(body)) {
        request.body = body.map((item) => ({
          ...item,
          school_id: schoolId,
        }));
      } else if (body && typeof body === 'object') {
        request.body = {
          ...body,
          school_id: schoolId,
          schoolId: schoolId,
        };
      }
    }

    return next.handle();
  }
}

@Injectable()
export class MultiTenancyGuard {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const userSchoolId = user.schoolId;
    const paramSchoolId = request.params.schoolId || request.query.schoolId;
    const bodySchoolId = request.body?.school_id || request.body?.schoolId;

    if (paramSchoolId && parseInt(paramSchoolId) !== userSchoolId) {
      return false;
    }

    if (bodySchoolId && parseInt(bodySchoolId) !== userSchoolId) {
      request.body.school_id = userSchoolId;
      request.body.schoolId = userSchoolId;
    }

    return true;
  }
}
