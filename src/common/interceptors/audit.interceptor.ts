import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { AuditLog } from '../../user/entities/audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private auditLogRepository: Repository<AuditLog>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;

    let ip: string;
    let userAgent: string;

    if (request.get && request.get('user-agent')) {
      ip =
        request.ip ||
        request.get('X-Forwarded-For') ||
        request.connection?.remoteAddress;
      userAgent = request.get('user-agent');
    } else {
      ip =
        (request.headers['x-forwarded-for'] as string) ||
        request.ip ||
        'unknown';
      userAgent = (request.headers['user-agent'] as string) || 'unknown';
    }

    // Only log state-changing operations
    const auditMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!auditMethods.includes(method)) {
      return next.handle();
    }

    // Skip sensitive paths like login
    if (url.includes('/auth/login') || url.includes('/auth/register')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          void (async () => {
            try {
              const module = this.extractModule(url);
              const action = this.extractAction(method);
              const resourceId = this.extractResourceId(url, data);

              // Scrape sensitive data from details
              const details = { ...body };
              delete details.password;
              delete details.oldPassword;
              delete details.newPassword;

              const auditEntry = this.auditLogRepository.create({
                userId: user?.userId ? Number(user.userId) : undefined,
                action,
                module,
                resourceId: resourceId || undefined,
                details,
                ipAddress: ip,
                userAgent,
              } as any);

              await this.auditLogRepository.save(auditEntry);
            } catch (error) {
              this.logger.error('Failed to save audit log', error.stack);
            }
          })();
        },
      }),
    );
  }

  private extractModule(url: string): string {
    const parts = url.split('/');
    // api/v1/student -> student
    const apiIndex = parts.indexOf('api');
    if (apiIndex !== -1 && parts[apiIndex + 2]) {
      return parts[apiIndex + 2].toUpperCase();
    }
    return 'UNKNOWN';
  }

  private extractAction(method: string): string {
    if (method === 'POST') return 'CREATE';
    if (method === 'DELETE') return 'DELETE';
    if (method === 'PUT' || method === 'PATCH') return 'UPDATE';
    return method;
  }

  private extractResourceId(url: string, responseData: any): string | null {
    // Extract ID from URL for PUT/PATCH/DELETE
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    if (!isNaN(Number(lastPart))) {
      return lastPart;
    }

    // Extract ID from response for POST
    if (
      responseData &&
      (responseData.id || responseData.userId || responseData.studentId)
    ) {
      return String(
        responseData.id || responseData.userId || responseData.studentId,
      );
    }

    return null;
  }
}
