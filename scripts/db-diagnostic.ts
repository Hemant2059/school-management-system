/* Scratch diagnostic: boots DatabaseService (legacy inline DDL + file
 * migrations) against an empty DB and reports table/policy counts.
 * Run: DB_HOST=localhost DB_PORT=5544 DB_USERNAME=postgres DB_PASSWORD=postgres \
 *      DB_NAME=sms_check npx ts-node --transpile-only scripts/db-diagnostic.ts
 */
import { DatabaseService } from '../src/database/database.service';

async function main() {
  const db = new DatabaseService();
  await db.onModuleInit();

  const tables = await db.queryOne<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
  );
  console.log('base tables:', tables?.c);

  const migs = await db.query<{ filename: string; note: string | null }>(
    `SELECT filename, note FROM schema_migrations ORDER BY filename`,
  );
  console.log('migrations:', JSON.stringify(migs));

  const rls = await db.query<{ enforced: string; total: string }>(
    `SELECT COUNT(*) FILTER (WHERE c.relrowsecurity)::text AS enforced,
            COUNT(*)::text AS total
       FROM pg_tables t
       JOIN information_schema.columns col
         ON col.table_schema = t.schemaname AND col.table_name = t.tablename
        AND col.column_name = 'school_id'
       JOIN pg_class c ON c.relname = t.tablename
       JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
      WHERE t.schemaname = 'public' AND t.tablename NOT IN ('users','schools')`,
  );
  console.log('school_id tables RLS enforced/total:', JSON.stringify(rls[0]));

  const members = await db.query(
    `SELECT to_regclass('public.school_members') AS tbl`,
  );
  console.log('school_members:', JSON.stringify(members[0]));

  await db.onModuleDestroy();
}

main().catch((e) => {
  console.error('DIAGNOSTIC FAILED:', e.message);
  process.exit(1);
});
