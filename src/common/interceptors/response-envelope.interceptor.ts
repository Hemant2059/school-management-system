import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Global response envelope: EVERY endpoint returns
 *   { data: [], total: number, page: number, limit: number }
 *
 * - Array results honour ?page= & ?limit= (in-memory slice; total = full
 *   length). Without query params the whole array is returned.
 * - Single objects are wrapped as data: [obj] with total/limit 1.
 * - null/undefined (e.g. DELETEs) become an empty envelope.
 * - Already-enveloped payloads ({ data: [], total }) pass through with
 *   page/limit defaulted, never double-wrapped.
 * - Buffers/streams pass through untouched (file downloads).
 * - Errors bypass interceptors and keep the exception-filter shape.
 */
const MAX_LIMIT = 500;

function isEnvelope(value: any): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Buffer.isBuffer(value) &&
    Array.isArray(value.data) &&
    typeof value.total === 'number'
  );
}

function isStream(value: any): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.pipe === 'function'
  );
}

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    let page = 1;
    let limit = 0; // 0 = no slicing requested
    try {
      const req = context.switchToHttp().getRequest();
      const q = (req && req.query) || {};
      page = Math.max(1, parseInt(String(q.page), 10) || 1);
      const parsed = parseInt(String(q.limit), 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = Math.min(parsed, MAX_LIMIT);
      }
    } catch {
      // non-HTTP context (ws/microservice): wrap with defaults
    }

    return next.handle().pipe(
      map((value) => {
        if (value === undefined || value === null) {
          return { data: [], total: 0, page: 1, limit: 0 };
        }
        if (Buffer.isBuffer(value) || isStream(value)) {
          return value;
        }
        if (isEnvelope(value)) {
          return {
            data: value.data,
            total: value.total,
            page: typeof value.page === 'number' ? value.page : page,
            limit:
              typeof value.limit === 'number'
                ? value.limit
                : limit > 0
                  ? limit
                  : value.data.length,
          };
        }
        if (Array.isArray(value)) {
          if (limit <= 0) {
            return {
              data: value,
              total: value.length,
              page: 1,
              limit: value.length,
            };
          }
          const start = (page - 1) * limit;
          return {
            data: value.slice(start, start + limit),
            total: value.length,
            page,
            limit,
          };
        }
        return { data: [value], total: 1, page: 1, limit: 1 };
      }),
    );
  }
}
