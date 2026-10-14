import { AsyncLocalStorage } from 'async_hooks';

/** Tenant store carried per request: verified school + acting user. */
export interface TenantStore {
  schoolId: number;
  /** Auth user id; unset outside requests (scripts/migrations). */
  userId?: number;
}

export const tenantContext = new AsyncLocalStorage<TenantStore>();

/** Name of the Postgres session setting RLS policies read. */
export const TENANT_SETTING = 'app.current_school_id';

/** Name of the Postgres session setting ownership policies read. */
export const TENANT_USER_SETTING = 'app.current_user_id';

/** Current tenant school id, or undefined outside a tenant scope. */
export function getTenantSchoolId(): number | undefined {
  return tenantContext.getStore()?.schoolId;
}

/** Current acting user id, or undefined outside a request scope. */
export function getTenantUserId(): number | undefined {
  return tenantContext.getStore()?.userId;
}

/** Run fn inside a tenant scope (used by interceptor + tests). */
export function runWithTenant<T>(
  schoolId: number,
  fn: () => T,
  userId?: number,
): T {
  return tenantContext.run({ schoolId, userId }, fn);
}
