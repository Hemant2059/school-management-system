/* Scratch verification for dynamic RBAC (009 + guard + services).
 * Run: DB_HOST=localhost DB_PORT=5544 DB_USERNAME=postgres DB_PASSWORD=postgres \
 *      DB_NAME=sms_check npx ts-node --transpile-only scripts/verify-rbac.ts
 */
import { DatabaseService } from '../src/database/database.service';
import { RbacService } from '../src/database/rbac.service';
import { TenantService } from '../src/database/tenant.service';

async function main() {
  const db = new DatabaseService();
  await db.onModuleInit();
  const tenants = new TenantService(db);
  // RbacService needs CACHE_MANAGER; a minimal in-memory stand-in is enough
  // to prove logic (real Redis path is exercised by app boot, not here).
  const mem = new Map<string, any>();
  const fakeCache = {
    get: async (k: string) => mem.get(k),
    set: async (k: string, v: any) => void mem.set(k, v),
  };
  const rbac = new RbacService(db, fakeCache as any);

  const perms = await db.queryOne<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM permissions`,
  );
  console.log('permission catalog:', perms?.c);
  const templates = await db.query(
    `SELECT code FROM roles WHERE school_id IS NULL ORDER BY code`,
  );
  console.log('templates:', templates.map((r: any) => r.code).join(','));

  const tag = Date.now().toString(36);
  const school = await db.queryOne<{ school_id: number }>(
    `INSERT INTO schools (name) VALUES ('RBAC School ' || $1) RETURNING school_id`,
    [tag],
  );
  const sid = school!.school_id;
  const user = await db.queryOne<{ user_id: number }>(
    `INSERT INTO users (school_id, username, email, password, user_type) VALUES ($1,'rbac_teacher-${tag}','rbac_t-${tag}@x.com','x','TEACHER') RETURNING user_id`,
    [sid],
  );
  const uid = user!.user_id;
  await db.query(
    `INSERT INTO school_members (user_id, school_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [uid, sid],
  );

  // Tenant resolution: header override + JWT default + stranger rejected.
  const viaHeader = await tenants.resolveSchoolId({
    userId: uid,
    jwtSchoolId: sid,
    headerSchoolId: sid,
  });
  console.log('tenant resolve ok:', viaHeader === sid);
  const stranger = await tenants
    .resolveSchoolId({ userId: 999999, jwtSchoolId: sid })
    .then(() => 'STRANGER ACCEPTED (BAD)')
    .catch(() => 'stranger rejected OK');
  console.log(stranger);

  // Backfill only covers pre-migration users; this post-migration user gets
  // its template assigned explicitly (also exercises assignRole).
  const teacherTplPre = await db.queryOne<{ role_id: number }>(
    `SELECT role_id FROM roles WHERE school_id IS NULL AND code = 'TEACHER'`,
  );
  await rbac.assignRole(uid, teacherTplPre!.role_id, sid, uid);
  const base = await rbac.getUserPermissions(uid, sid);
  console.log(
    'backfilled perms include result:enter:',
    base.includes('result:enter'),
  );

  // Custom role cloned from TEACHER, extended, assigned to a fresh user.
  const teacherTpl = await db.queryOne<{ role_id: number }>(
    `SELECT role_id FROM roles WHERE school_id IS NULL AND code = 'TEACHER'`,
  );
  const custom = await rbac.createRole(sid, {
    code: 'VICEPRINCIPAL',
    nameEn: 'Vice Principal',
    copyFromRoleId: teacherTpl!.role_id,
  });
  await rbac.grantPermission(custom.role_id, sid, 'result:verify');
  const u2 = await db.queryOne<{ user_id: number }>(
    `INSERT INTO users (school_id, username, email, password, user_type) VALUES ($1,'rbac_vp-${tag}','rbac_vp-${tag}@x.com','x','STAFF') RETURNING user_id`,
    [sid],
  );
  await rbac.assignRole(u2!.user_id, custom.role_id, sid, uid);
  const eff = await rbac.getUserPermissions(u2!.user_id, sid);
  console.log(
    'custom role perms (enter+verify, no publish):',
    eff.includes('result:enter') &&
      eff.includes('result:verify') &&
      !eff.includes('result:publish'),
  );

  // Revoke reflects immediately (version bump defeats the cache).
  await rbac.revokePermission(custom.role_id, sid, 'result:verify');
  const eff2 = await rbac.getUserPermissions(u2!.user_id, sid);
  console.log('revoke reflected:', !eff2.includes('result:verify'));

  // Reserved template codes rejected; system templates immutable/deletable-proof.
  const reserved = await rbac
    .createRole(sid, { code: 'TEACHER', nameEn: 'X' })
    .then(() => 'RESERVED ACCEPTED (BAD)')
    .catch(() => 'reserved code rejected OK');
  console.log(reserved);
  const sysDel = await rbac
    .deleteRole(teacherTpl!.role_id, sid)
    .then(() => 'SYSTEM DELETE ACCEPTED (BAD)')
    .catch(() => 'system template delete rejected OK');
  console.log(sysDel);

  // No-DB-role user falls back (guard path); user with roles does not.
  console.log(
    'hasAnyDbRole (assigned):',
    await rbac.hasAnyDbRole(u2!.user_id, sid),
  );
  const u3 = await db.queryOne<{ user_id: number }>(
    `INSERT INTO users (school_id, username, email, password, user_type) VALUES ($1,'rbac_none-${tag}','rbac_n-${tag}@x.com','x','STAFF') RETURNING user_id`,
    [sid],
  );
  console.log(
    'hasAnyDbRole (none):',
    await rbac.hasAnyDbRole(u3!.user_id, sid),
  );

  // Cross-tenant write blocked by RLS. NOTE: must run as a restricted role
  // (superusers bypass RLS by design) — same technique as rls-matrix.spec.
  const pool2 = new (await import('pg')).Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'sms_check',
  });
  await pool2.query(`DROP OWNED BY rls_rbac_a`).catch(() => undefined);
  await pool2.query(`DROP ROLE IF EXISTS rls_rbac_a`);
  await pool2.query(`CREATE ROLE rls_rbac_a NOLOGIN`);
  await pool2.query(`GRANT USAGE ON SCHEMA public TO rls_rbac_a`);
  await pool2.query(`GRANT SELECT, INSERT ON roles TO rls_rbac_a`);
  await pool2.query(
    `GRANT USAGE, SELECT ON SEQUENCE roles_role_id_seq TO rls_rbac_a`,
  );
  const evilClient = await pool2.connect();
  let evil: string;
  try {
    await evilClient.query(`SET ROLE rls_rbac_a`);
    await evilClient.query(
      `SELECT set_config('app.current_school_id', $1, false)`,
      [String(sid + 9999)],
    );
    await evilClient.query(
      `INSERT INTO roles (school_id, code, name_en) VALUES ($1,'EVIL','x')`,
      [sid],
    );
    evil = 'CROSS-TENANT WRITE ACCEPTED (BAD)';
  } catch {
    evil = 'cross-tenant write rejected OK';
  } finally {
    await evilClient.query(`RESET ROLE`).catch(() => undefined);
    evilClient.release();
  }
  await pool2.query(`DROP OWNED BY rls_rbac_a`).catch(() => undefined);
  await pool2.query(`DROP ROLE IF EXISTS rls_rbac_a`);
  await pool2.end();
  console.log(evil);

  await db.onModuleDestroy();
}

main().catch((e) => {
  console.error('VERIFY FAILED:', e.message);
  process.exit(1);
});
