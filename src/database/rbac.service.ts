import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { DatabaseService } from './database.service';

// Provided globally via DatabaseModule (with TenantService) so every
// controller's PermissionsGuard can inject it without module wiring churn.
@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);
  private static readonly CACHE_TTL_MS = 3600000;

  constructor(
    private readonly db: DatabaseService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private versionKey(schoolId: number): string {
    return `rbac:ver:${schoolId}`;
  }

  private permsKey(schoolId: number, userId: number): string {
    return `rbac:perms:${schoolId}:${userId}`;
  }

  /** Current permission-set version (DB is source of truth, Redis mirrors). */
  async getSchoolVersion(schoolId: number): Promise<number> {
    try {
      const cached = await this.cache.get<number>(this.versionKey(schoolId));
      if (cached !== undefined && cached !== null) return Number(cached);
    } catch (error) {
      this.logger.warn(`perm version cache miss: ${error}`);
    }
    const row = await this.db.queryOne<{ version: string }>(
      `INSERT INTO school_perm_versions (school_id) VALUES ($1)
       ON CONFLICT (school_id) DO UPDATE SET school_id = EXCLUDED.school_id
       RETURNING version`,
      [schoolId],
    );
    const version = parseInt(row?.version || '1', 10);
    try {
      await this.cache.set(
        this.versionKey(schoolId),
        version,
        RbacService.CACHE_TTL_MS,
      );
    } catch (error) {
      this.logger.warn(`perm version cache write failed: ${error}`);
    }
    return version;
  }

  /** Bump after any role/grant change (called in the same txn as the change). */
  async bumpSchoolVersion(
    schoolId: number,
    client?: { query: (t: string, p?: any[]) => Promise<any> },
  ): Promise<number> {
    const q = client
      ? (t: string, p?: any[]) => client.query(t, p)
      : (t: string, p?: any[]) => this.db.query(t, p);
    const row = await q(
      `INSERT INTO school_perm_versions (school_id, version, updated_at)
       VALUES ($1, 1, NOW())
       ON CONFLICT (school_id) DO UPDATE
         SET version = school_perm_versions.version + 1, updated_at = NOW()
       RETURNING version`,
      [schoolId],
    );
    const version = parseInt(
      row.rows?.[0]?.version ?? row[0]?.version ?? '1',
      10,
    );
    try {
      await this.cache.set(
        this.versionKey(schoolId),
        version,
        RbacService.CACHE_TTL_MS,
      );
    } catch (error) {
      this.logger.warn(`perm version cache write failed: ${error}`);
    }
    return version;
  }

  /**
   * Effective permission codes for a user in a school. ADMIN holders
   * (template or custom role carrying admin:full) expand to the catalog.
   * Never throws on cache failure — degrades to direct DB reads.
   */
  async getUserPermissions(
    userId: number,
    schoolId: number,
  ): Promise<string[]> {
    const version = await this.getSchoolVersion(schoolId);
    try {
      const hit = await this.cache.get<{ v: number; perms: string[] }>(
        this.permsKey(schoolId, userId),
      );
      if (hit && hit.v === version) return hit.perms;
    } catch (error) {
      this.logger.warn(`perms cache miss: ${error}`);
    }
    const rows = await this.db.query<{ code: string }>(
      `SELECT DISTINCT p.code FROM user_roles ur
         JOIN roles r ON r.role_id = ur.role_id
         JOIN role_permissions rp ON rp.role_id = r.role_id
         JOIN permissions p ON p.permission_id = rp.permission_id
        WHERE ur.user_id = $1 AND ur.school_id = $2 AND r.is_active = true`,
      [userId, schoolId],
    );
    let perms = [...new Set(rows.map((r) => r.code))];
    if (perms.includes('admin:full')) {
      const all = await this.db.query<{ code: string }>(
        `SELECT code FROM permissions`,
      );
      perms = [...new Set([...perms, ...all.map((r) => r.code)])];
    }
    try {
      await this.cache.set(
        this.permsKey(schoolId, userId),
        { v: version, perms },
        RbacService.CACHE_TTL_MS,
      );
    } catch (error) {
      this.logger.warn(`perms cache write failed: ${error}`);
    }
    return perms;
  }

  async hasAnyDbRole(userId: number, schoolId: number): Promise<boolean> {
    return this.db.exists(`user_roles`, `user_id = $1 AND school_id = $2`, [
      userId,
      schoolId,
    ]);
  }

  // ------------------------------------------------------------------
  // Administration (all writers bump the school version atomically)
  // --------------------------------------------------------------------------

  async listRoles(schoolId: number): Promise<any[]> {
    return this.db.query(
      `SELECT role_id, school_id, code, name_en, name_np, is_system, is_active,
              created_at, updated_at,
              (SELECT COUNT(*)::int FROM role_permissions rp WHERE rp.role_id = roles.role_id) AS permission_count,
              (SELECT COUNT(*)::int FROM user_roles ur WHERE ur.role_id = roles.role_id AND ur.school_id = $1) AS member_count
         FROM roles
        WHERE (school_id = $1 OR school_id IS NULL) AND is_active = true
        ORDER BY school_id NULLS FIRST, code`,
      [schoolId],
    );
  }

  async listPermissions(): Promise<any[]> {
    return this.db.query(
      `SELECT permission_id, code, resource, action, description
         FROM permissions ORDER BY resource, action`,
    );
  }

  async getRole(roleId: number, schoolId: number): Promise<any> {
    const role = await this.db.queryOne(
      `SELECT * FROM roles WHERE role_id = $1 AND (school_id = $2 OR school_id IS NULL)`,
      [roleId, schoolId],
    );
    if (!role) return null;
    const perms = await this.db.query(
      `SELECT p.code FROM role_permissions rp
         JOIN permissions p ON p.permission_id = rp.permission_id
        WHERE rp.role_id = $1 ORDER BY p.code`,
      [roleId],
    );
    return { ...role, permissions: perms.map((p: any) => p.code) };
  }

  private static readonly TEMPLATE_CODES = [
    'ADMIN',
    'PRINCIPAL',
    'TEACHER',
    'ACCOUNTANT',
    'LIBRARIAN',
    'STAFF',
    'STUDENT',
    'PARENT',
  ];

  async createRole(
    schoolId: number,
    dto: {
      code: string;
      nameEn: string;
      nameNp?: string;
      copyFromRoleId?: number;
    },
  ): Promise<any> {
    const code = dto.code.trim().toUpperCase();
    if (RbacService.TEMPLATE_CODES.includes(code)) {
      throw new Error(`Role code ${code} is reserved for system templates`);
    }
    return this.db.tenantTransaction(schoolId, async (client) => {
      const created = await client.query(
        `INSERT INTO roles (school_id, code, name_en, name_np, is_system, is_active)
         VALUES ($1, $2, $3, $4, false, true)
         ON CONFLICT (school_id, code) DO NOTHING
         RETURNING *`,
        [schoolId, code, dto.nameEn, dto.nameNp || null],
      );
      const role = created.rows[0];
      if (!role) throw new Error(`Role ${code} already exists`);
      if (dto.copyFromRoleId) {
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           SELECT $1, permission_id FROM role_permissions WHERE role_id = $2
           ON CONFLICT (role_id, permission_id) DO NOTHING`,
          [role.role_id, dto.copyFromRoleId],
        );
      }
      await this.bumpSchoolVersion(schoolId, client);
      return role;
    });
  }

  async updateRole(
    roleId: number,
    schoolId: number,
    dto: { nameEn?: string; nameNp?: string; isActive?: boolean },
  ): Promise<any> {
    return this.db.tenantTransaction(schoolId, async (client) => {
      const own = await client.query(
        `SELECT * FROM roles WHERE role_id = $1 AND school_id = $2`,
        [roleId, schoolId],
      );
      if (!own.rows[0]) {
        throw new Error('Role not found or is a locked system template');
      }
      const sets: string[] = [];
      const params: any[] = [];
      if (dto.nameEn !== undefined) {
        sets.push(`name_en = $${sets.length + 1}`);
        params.push(dto.nameEn);
      }
      if (dto.nameNp !== undefined) {
        sets.push(`name_np = $${sets.length + 1}`);
        params.push(dto.nameNp);
      }
      if (dto.isActive !== undefined) {
        sets.push(`is_active = $${sets.length + 1}`);
        params.push(dto.isActive);
      }
      if (sets.length > 0) {
        sets.push(`updated_at = NOW()`);
        params.push(roleId);
        await client.query(
          `UPDATE roles SET ${sets.join(', ')} WHERE role_id = $${params.length}`,
          params,
        );
      }
      await this.bumpSchoolVersion(schoolId, client);
      return (
        await client.query(`SELECT * FROM roles WHERE role_id = $1`, [roleId])
      ).rows[0];
    });
  }

  async deleteRole(roleId: number, schoolId: number): Promise<void> {
    await this.db.tenantTransaction(schoolId, async (client) => {
      const res = await client.query(
        `DELETE FROM roles WHERE role_id = $1 AND school_id = $2`,
        [roleId, schoolId],
      );
      if ((res.rowCount ?? 0) === 0) {
        throw new Error('Role not found or is a locked system template');
      }
      await this.bumpSchoolVersion(schoolId, client);
    });
  }

  async grantPermission(
    roleId: number,
    schoolId: number,
    permCode: string,
  ): Promise<void> {
    await this.db.tenantTransaction(schoolId, async (client) => {
      const own = await client.query(
        `SELECT role_id FROM roles WHERE role_id = $1 AND school_id = $2`,
        [roleId, schoolId],
      );
      if (!own.rows[0]) {
        throw new Error('Role not found or is a locked system template');
      }
      const perm = await client.query(
        `SELECT permission_id FROM permissions WHERE code = $1`,
        [permCode],
      );
      if (!perm.rows[0]) throw new Error(`Unknown permission ${permCode}`);
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [roleId, perm.rows[0].permission_id],
      );
      await this.bumpSchoolVersion(schoolId, client);
    });
  }

  async revokePermission(
    roleId: number,
    schoolId: number,
    permCode: string,
  ): Promise<void> {
    await this.db.tenantTransaction(schoolId, async (client) => {
      await client.query(
        `DELETE FROM role_permissions WHERE role_id = $1
           AND permission_id = (SELECT permission_id FROM permissions WHERE code = $2)
           AND EXISTS (SELECT 1 FROM roles WHERE role_id = $1 AND school_id = $3)`,
        [roleId, permCode, schoolId],
      );
      await this.bumpSchoolVersion(schoolId, client);
    });
  }

  async assignRole(
    userId: number,
    roleId: number,
    schoolId: number,
    assignedBy?: number,
  ): Promise<void> {
    await this.db.tenantTransaction(schoolId, async (client) => {
      const target = await client.query(
        `SELECT user_id FROM users WHERE user_id = $1`,
        [userId],
      );
      if (!target.rows[0]) throw new Error('User not found');
      const role = await client.query(
        `SELECT role_id FROM roles
          WHERE role_id = $1 AND (school_id = $2 OR school_id IS NULL) AND is_active = true`,
        [roleId, schoolId],
      );
      if (!role.rows[0]) throw new Error('Role not found in this school');
      await client.query(
        `INSERT INTO user_roles (user_id, role_id, school_id, assigned_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, role_id, school_id) DO NOTHING`,
        [userId, roleId, schoolId, assignedBy || null],
      );
      // Role assignment also unlocks the tenant (membership may predate RBAC).
      await client.query(
        `INSERT INTO school_members (user_id, school_id, status)
         VALUES ($1, $2, 'ACTIVE')
         ON CONFLICT (user_id, school_id) DO NOTHING`,
        [userId, schoolId],
      );
      await this.bumpSchoolVersion(schoolId, client);
    });
  }

  async revokeRole(
    userId: number,
    roleId: number,
    schoolId: number,
  ): Promise<void> {
    await this.db.tenantTransaction(schoolId, async (client) => {
      await client.query(
        `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2 AND school_id = $3`,
        [userId, roleId, schoolId],
      );
      await this.bumpSchoolVersion(schoolId, client);
    });
  }
}
