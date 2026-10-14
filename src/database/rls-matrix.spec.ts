/**
 * RLS tenancy matrix — integration spec for 002_tenancy_rls.sql.
 *
 * Gated: runs only with RLS_TEST=1, and refuses unless the database name
 * looks like a scratch DB (test|check|spec|scratch). Never point it at prod:
 * it creates roles + fixture rows (cleaned up in afterAll) and applies 002.
 *
 * Run: RLS_TEST=1 DB_PORT=5544 DB_NAME=sms_check npx jest src/database/rls-matrix.spec.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

const run = process.env.RLS_TEST === '1' ? describe : describe.skip;

run('RLS tenancy matrix (002_tenancy_rls)', () => {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'sms_nepal',
  });

  const schoolIds: number[] = [];
  const userIds: number[] = [];

  beforeAll(async () => {
    const dbName = process.env.DB_NAME || 'sms_nepal';
    if (!/test|check|spec|scratch/i.test(dbName)) {
      throw new Error(
        `Refusing to run RLS matrix against non-scratch DB "${dbName}"`,
      );
    }

    // Minimal directory tables (no-op when the real ones exist).
    await pool.query(
      `CREATE TABLE IF NOT EXISTS schools (school_id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL)`,
    );
    await pool.query(
      `CREATE TABLE IF NOT EXISTS users (user_id SERIAL PRIMARY KEY, username VARCHAR(50), school_id INTEGER REFERENCES schools(school_id), is_system BOOLEAN NOT NULL DEFAULT false)`,
    );
    const s1 = await pool.query(
      `INSERT INTO schools (name) VALUES ('RLS Matrix A') RETURNING school_id`,
    );
    const s2 = await pool.query(
      `INSERT INTO schools (name) VALUES ('RLS Matrix B') RETURNING school_id`,
    );
    schoolIds.push(s1.rows[0].school_id, s2.rows[0].school_id);
    // Shape-agnostic user insert (000 vs legacy-initSchema shapes differ):
    // intersect desired values with columns that actually exist.
    const tag = `rls_a_${Date.now()}`;
    const userCols = (
      await pool.query(
        `SELECT column_name FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users'`,
      )
    ).rows.map((r: any) => r.column_name as string);
    const want: Record<string, any> = {
      username: tag,
      email: `${tag}@example.com`,
      password: 'x',
      password_hash: 'x',
      full_name: 'RLS User A',
      user_type: 'STUDENT',
      school_id: schoolIds[0],
      is_system: false,
      is_active: true,
      is_verified: true,
    };
    const useCols = Object.keys(want).filter((c) => userCols.includes(c));
    const u1 = await pool.query(
      `INSERT INTO users (${useCols.join(', ')}) VALUES (${useCols.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING user_id`,
      useCols.map((c) => want[c]),
    );
    userIds.push(u1.rows[0].user_id);

    // Probe tenant table + rows, then apply the REAL 002 file (exercises
    // the dynamic school_id loop on at least this table).
    await pool.query(
      `CREATE TABLE IF NOT EXISTS rls_probe (id SERIAL PRIMARY KEY, school_id INTEGER NOT NULL, note TEXT)`,
    );
    await pool.query(`DELETE FROM rls_probe`);
    await pool.query(
      `INSERT INTO rls_probe (school_id, note) VALUES ($1, 'a1'), ($1, 'a2'), ($2, 'b1')`,
      schoolIds,
    );

    const migration = await fs.promises.readFile(
      path.join(__dirname, 'migrations', '002_tenancy_rls.sql'),
      'utf8',
    );
    await pool.query(migration);

    // Restricted roles: NOLOGIN, reachable via SET ROLE from superuser.
    for (const role of ['rls_tenant_a', 'rls_tenant_b']) {
      await pool.query(`DROP OWNED BY ${role}`).catch(() => undefined);
      await pool.query(`DROP ROLE IF EXISTS ${role}`);
    }
    await pool.query(`CREATE ROLE rls_tenant_a NOLOGIN`);
    await pool.query(`CREATE ROLE rls_tenant_b NOLOGIN`);
    await pool.query(
      `GRANT USAGE ON SCHEMA public TO rls_tenant_a, rls_tenant_b`,
    );
    await pool.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON rls_probe TO rls_tenant_a, rls_tenant_b`,
    );
    await pool.query(
      `GRANT USAGE, SELECT ON SEQUENCE rls_probe_id_seq TO rls_tenant_a, rls_tenant_b`,
    );
  });

  afterAll(async () => {
    await pool.query(`DROP TABLE IF EXISTS rls_probe`);
    for (const role of ['rls_tenant_a', 'rls_tenant_b']) {
      // Clear residual grants before dropping (idempotent, superuser path).
      await pool.query(`DROP OWNED BY ${role}`).catch(() => undefined);
      await pool.query(`DROP ROLE IF EXISTS ${role}`);
    }
    if (userIds.length) {
      await pool.query(`DELETE FROM school_members WHERE user_id = ANY($1)`, [
        userIds,
      ]);
      await pool.query(`DELETE FROM users WHERE user_id = ANY($1)`, [userIds]);
    }
    if (schoolIds.length) {
      await pool.query(`DELETE FROM schools WHERE school_id = ANY($1)`, [
        schoolIds,
      ]);
    }
    await pool.end();
  });

  /** Run fn as a restricted role with a given tenant setting. */
  async function asRole<T>(
    role: string,
    setting: string | null,
    fn: (q: (text: string, params?: any[]) => Promise<any>) => Promise<T>,
  ): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query(`SET ROLE ${role}`);
      if (setting === null) {
        await client.query(`RESET app.current_school_id`);
      } else {
        // SET via set_config with a bound param: never interpolated.
        await client.query(
          `SELECT set_config('app.current_school_id', $1, false)`,
          [setting],
        );
      }
      return await fn(client.query.bind(client));
    } finally {
      await client.query(`RESET ROLE`).catch(() => undefined);
      client.release();
    }
  }

  it('membership backfill mirrors users.school_id', async () => {
    const r = await pool.query(
      `SELECT COUNT(*)::int AS c FROM school_members WHERE user_id = $1 AND school_id = $2 AND status = 'ACTIVE'`,
      [userIds[0], schoolIds[0]],
    );
    expect(r.rows[0].c).toBe(1);
  });

  it('tenant A session sees only school A rows', async () => {
    const rows = await asRole(
      'rls_tenant_a',
      String(schoolIds[0]),
      async (q) => {
        const r = await q(`SELECT note FROM rls_probe ORDER BY note`);
        return r.rows.map((x: any) => x.note);
      },
    );
    expect(rows).toEqual(['a1', 'a2']);
  });

  it('cross-tenant write is rejected by WITH CHECK', async () => {
    await expect(
      asRole('rls_tenant_a', String(schoolIds[0]), async (q) =>
        q(`INSERT INTO rls_probe (school_id, note) VALUES ($1, 'evil')`, [
          schoolIds[1],
        ]),
      ),
    ).rejects.toThrow(/row-level security|policy/i);
  });

  it('missing tenant setting is fail-closed (zero rows)', async () => {
    const rows = await asRole('rls_tenant_b', null, async (q) => {
      const r = await q(`SELECT * FROM rls_probe`);
      return r.rows;
    });
    expect(rows).toEqual([]);
  });

  it('garbage tenant setting is fail-closed', async () => {
    const rows = await asRole('rls_tenant_b', 'not-a-school', async (q) => {
      const r = await q(`SELECT * FROM rls_probe`);
      return r.rows;
    });
    expect(rows).toEqual([]);
  });

  it('non-member has no membership row (interceptor 403 path)', async () => {
    const r = await pool.query(
      `SELECT EXISTS (SELECT 1 FROM school_members WHERE user_id = $1 AND school_id = $2 AND status = 'ACTIVE') AS ok`,
      [userIds[0], schoolIds[1]],
    );
    expect(r.rows[0].ok).toBe(false);
  });

  it('every school_id table is RLS-enforced with a policy', async () => {
    const r = await pool.query(
      `SELECT t.tablename AS table,
              c.relrowsecurity AS rls_enabled,
              c.relforcerowsecurity AS forced,
              COUNT(p.polname) AS policies
         FROM pg_tables t
         JOIN information_schema.columns col
           ON col.table_schema = t.schemaname AND col.table_name = t.tablename
          AND col.column_name = 'school_id'
         JOIN pg_class c ON c.relname = t.tablename
         JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
         LEFT JOIN pg_policy p ON p.polrelid = c.oid
        WHERE t.schemaname = 'public'
          AND t.tablename NOT IN ('users','schools','school_members','grade_scales',
                                  'provinces','districts','local_bodies','wards',
                                  'fiscal_years','caste_ethnicity_groups')
        GROUP BY t.tablename, c.relrowsecurity, c.relforcerowsecurity
        ORDER BY t.tablename`,
    );
    expect(r.rows.length).toBeGreaterThan(0);
    for (const row of r.rows) {
      expect({
        table: row.table,
        rls_enabled: row.rls_enabled,
        forced: row.forced,
      }).toEqual({
        table: row.table,
        rls_enabled: true,
        forced: true,
      });
      expect(Number(row.policies)).toBeGreaterThanOrEqual(1);
    }
  });
});
