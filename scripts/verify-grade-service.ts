/* Scratch verification for the rewritten GradeService (canonical tables).
 * Run: DB_HOST=localhost DB_PORT=5544 DB_USERNAME=postgres DB_PASSWORD=postgres \
 *      DB_NAME=sms_check npx ts-node --transpile-only scripts/verify-grade-service.ts
 */
import { DatabaseService } from '../src/database/database.service';
import { GradeService } from '../src/grade/grade.service';

async function main() {
  const db = new DatabaseService();
  await db.onModuleInit();
  const grades = new GradeService(db as any);

  // School 1 has MIGRATED bands (A+, A only).
  const s1 = await grades.findAll(1);
  console.log('school1 bands:', s1.map((b) => b.grade).join(','));

  // Boundary behavior on a full NEB scale (fresh school -> template fallback).
  const fresh = await db.queryOne<{ school_id: number }>(
    `INSERT INTO schools (name) VALUES ('Grade Svc School') RETURNING school_id`,
  );
  const freshId = fresh!.school_id;
  const tpl = await grades.findAll(freshId);
  console.log('fresh-school fallback bands:', tpl.length);
  const checks: Array<[number, string]> = [
    [100, 'A+'],
    [90, 'A+'],
    [89.99, 'A'],
    [70, 'B+'],
    [35, 'D'],
    [34.99, 'NG'],
    [0, 'NG'],
  ];
  for (const [pct, want] of checks) {
    const got = grades.calculateGrade(pct, tpl);
    console.log(
      `  ${pct} -> ${got.grade} (want ${want}) ${got.grade === want ? 'OK' : 'MISMATCH'}`,
    );
  }

  // Clone path: effective bands exist but school owns none -> creates + clones.
  const cloned = await grades.getOrCreateDefaultGradeScales(freshId);
  console.log('cloned bands:', cloned.length);
  const ownHeader = await db.query(
    `SELECT scale_code, is_default FROM grade_scales WHERE school_id = $1`,
    [freshId],
  );
  console.log('own headers:', JSON.stringify(ownHeader));

  // CRUD on own scale.
  const created = await grades
    .create({
      schoolId: freshId,
      gradeName: 'A++',
      minPercentage: 95,
      maxPercentage: 100,
      gradePoint: 4.0,
    })
    .catch((e) => `CREATE-REJECTED (overlap guard): ${e.message}`);
  console.log('create overlapping band:', JSON.stringify(created));

  // Duplicate grade name rejected.
  const dup = await grades
    .create({
      schoolId: 1,
      gradeName: 'A+',
      minPercentage: 90,
      maxPercentage: 100,
      gradePoint: 4.0,
    })
    .then(() => 'DUP-ACCEPTED (BAD)')
    .catch(() => 'dup rejected OK');
  console.log(dup);

  // Remove a band from school 1's own scale.
  const lineA = s1.find((b) => b.grade === 'A')!;
  await grades.remove(lineA.line_id, 1);
  const after = await grades.findAll(1);
  console.log('school1 after remove:', after.map((b) => b.grade).join(','));

  await db.onModuleDestroy();
}

main().catch((e) => {
  console.error('VERIFY FAILED:', e.message);
  process.exit(1);
});
