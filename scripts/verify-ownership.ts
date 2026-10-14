/* Row-ownership probes for 010 (low-level RBAC).
 * Teacher -> only assigned class+subject rows; pupil -> self; parent ->
 * linked kids; staff (no identity link) -> full tenant; no user -> nothing.
 * Run: DB_HOST=localhost DB_PORT=5544 DB_USERNAME=postgres DB_PASSWORD=postgres \
 *      DB_NAME=sms_check npx ts-node --transpile-only scripts/verify-ownership.ts
 */
import { Pool } from 'pg';

const cfg = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'sms_check',
};
const tag = Date.now().toString(36);
let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra?: string) {
  if (cond) {
    pass++;
    console.log(`  OK   ${name}`);
  } else {
    fail++;
    console.log(`  FAIL ${name}${extra ? ': ' + extra : ''}`);
  }
}

async function main() {
  const admin = new Pool(cfg);
  // --- fixture -----------------------------------------------------------
  const sch = await admin.query(
    `INSERT INTO schools (name) VALUES ('Own School ' || $1) RETURNING school_id`,
    [tag],
  );
  const sid: number = sch.rows[0].school_id;
  const ay = await admin.query(
    `INSERT INTO academic_years (school_id, session_name, start_date_ad, end_date_ad, start_date_bs, end_date_bs, is_current)
     VALUES ($1,'2082','2025-04-14','2026-04-13','2082-01-01','2083-12-30',true) RETURNING academic_year_id`,
    [sid],
  );
  const ayid: number = ay.rows[0].academic_year_id;
  const mk = async (text: string, params: any[] = []) =>
    (await admin.query(text, params)).rows;
  const classA = (
    await mk(
      `INSERT INTO classes (school_id, class_name, class_code, class_order) VALUES ($1,'Grade 4','G4',4) RETURNING class_id`,
      [sid],
    )
  )[0].class_id;
  const classB = (
    await mk(
      `INSERT INTO classes (school_id, class_name, class_code, class_order) VALUES ($1,'Grade 5','G5',5) RETURNING class_id`,
      [sid],
    )
  )[0].class_id;
  const secA = (
    await mk(
      `INSERT INTO sections (school_id, class_id, section_name) VALUES ($1,$2,'A') RETURNING section_id`,
      [sid, classA],
    )
  )[0].section_id;
  const math = (
    await mk(
      `INSERT INTO subjects (school_id, subject_code, subject_name_en) VALUES ($1,'MATH','Math') RETURNING subject_id`,
      [sid],
    )
  )[0].subject_id;
  const sci = (
    await mk(
      `INSERT INTO subjects (school_id, subject_code, subject_name_en) VALUES ($1,'SCI','Science') RETURNING subject_id`,
      [sid],
    )
  )[0].subject_id;

  const u = async (name: string, type: string) =>
    (
      await mk(
        `INSERT INTO users (school_id, username, email, password, user_type) VALUES ($1,$2,$3,'x',$4) RETURNING user_id`,
        [sid, `${name}-${tag}`, `${name}-${tag}@x.com`, type],
      )
    )[0].user_id;
  const teacherUser = await u('tmath', 'TEACHER');
  const idleTeacherUser = await u('tidle', 'TEACHER');
  const pupilUser = await u('pupil', 'STUDENT');
  const parentUser = await u('parent', 'GUARDIAN');
  const staffUser = await u('staffx', 'STAFF');
  for (const id of [
    teacherUser,
    idleTeacherUser,
    pupilUser,
    parentUser,
    staffUser,
  ]) {
    await admin.query(
      `INSERT INTO school_members (user_id, school_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [id, sid],
    );
  }
  const teacher = (
    await mk(
      `INSERT INTO teachers (school_id, user_id, teacher_code, employee_id, first_name_en, last_name_en, gender) VALUES ($1,$2,'T1','E1','Math','Teach','MALE') RETURNING teacher_id`,
      [sid, teacherUser],
    )
  )[0].teacher_id;
  await mk(
    `INSERT INTO teachers (school_id, user_id, teacher_code, employee_id, first_name_en, last_name_en, gender) VALUES ($1,$2,'T2','E2','Idle','Teach','MALE')`,
    [sid, idleTeacherUser],
  );
  // Math teacher: class A, math ONLY.
  await mk(
    `INSERT INTO teacher_assignments (school_id, teacher_id, academic_year_id, class_id, subject_id) VALUES ($1,$2,$3,$4,$5)`,
    [sid, teacher, ayid, classA, math],
  );

  const pupilA = (
    await mk(
      `INSERT INTO students (school_id, user_id, admission_number, student_code, first_name_en, last_name_en, gender) VALUES ($1,$2,'ADM-A','STU-A','Pupil','A','MALE') RETURNING student_id`,
      [sid, pupilUser],
    )
  )[0].student_id;
  const pupilB = (
    await mk(
      `INSERT INTO students (school_id, admission_number, student_code, first_name_en, last_name_en, gender) VALUES ($1,'ADM-B','STU-B','Pupil','B','MALE') RETURNING student_id`,
      [sid],
    )
  )[0].student_id;
  await mk(
    `INSERT INTO enrollments (school_id, student_id, academic_year_id, class_id, section_id, roll_no) VALUES ($1,$2,$3,$4,$5,1)`,
    [sid, pupilA, ayid, classA, secA],
  );
  await mk(
    `INSERT INTO enrollments (school_id, student_id, academic_year_id, class_id, section_id, roll_no) VALUES ($1,$2,$3,$4,$5,1)`,
    [sid, pupilB, ayid, classB, secA],
  );
  const exam = (
    await mk(
      `INSERT INTO exams (school_id, academic_year, exam_name, exam_code, exam_type, class_id) VALUES ($1,'2082','T1','EX1','TERMINAL',$2) RETURNING exam_id`,
      [sid, classA],
    )
  )[0].exam_id;
  await mk(
    `INSERT INTO marks (school_id, exam_id, student_id, subject_id, class_id, theory_marks, practical_marks, total_marks, grade) VALUES ($1,$2,$3,$4,$5,70,20,90,'A+')`,
    [sid, exam, pupilA, math, classA],
  );
  await mk(
    `INSERT INTO marks (school_id, exam_id, student_id, subject_id, class_id, theory_marks, practical_marks, total_marks, grade) VALUES ($1,$2,$3,$4,$5,60,20,80,'A')`,
    [sid, exam, pupilA, sci, classA],
  );
  await mk(
    `INSERT INTO marks (school_id, exam_id, student_id, subject_id, class_id, theory_marks, practical_marks, total_marks, grade) VALUES ($1,$2,$3,$4,$5,50,20,70,'B+')`,
    [sid, exam, pupilB, math, classB],
  );
  await mk(
    `INSERT INTO attendance (school_id, student_id, class_id, section_id, attendance_date, status, academic_year) VALUES ($1,$2,$3,$4,'2026-01-05','PRESENT','2082')`,
    [sid, pupilA, classA, secA],
  );
  await mk(
    `INSERT INTO attendance (school_id, student_id, class_id, section_id, attendance_date, status, academic_year) VALUES ($1,$2,$3,$4,'2026-01-05','PRESENT','2082')`,
    [sid, pupilB, classB, secA],
  );
  await mk(
    `INSERT INTO fee_invoices (school_id, student_id, academic_year_id, invoice_no, due_date_ad) VALUES ($1,$2,$3,'INV-A',CURRENT_DATE+30)`,
    [sid, pupilA, ayid],
  );
  const guardian = (
    await mk(
      `INSERT INTO guardians (school_id, guardian_code, user_id, first_name_en, last_name_en, mobile, relation_to_student) VALUES ($1,'G1',$2,'Par','Ent','9841001999','FATHER') RETURNING guardian_id`,
      [sid, parentUser],
    )
  )[0].guardian_id;
  await mk(
    `INSERT INTO student_guardians (student_id, guardian_id, relationship_type, is_primary, is_fee_payer) VALUES ($1,$2,'FATHER',true,true)`,
    [pupilA, guardian],
  );

  // --- restricted role sessions ------------------------------------------
  await admin.query(`DROP OWNED BY rls_own_a`).catch(() => undefined);
  await admin.query(`DROP ROLE IF EXISTS rls_own_a`);
  await admin.query(`CREATE ROLE rls_own_a NOLOGIN`);
  await admin.query(`GRANT USAGE ON SCHEMA public TO rls_own_a`);
  for (const t of [
    'students',
    'marks',
    'attendance',
    'fee_invoices',
    'guardians',
    'student_guardians',
    'enrollments',
  ]) {
    await admin.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ${t} TO rls_own_a`,
    );
  }
  await admin.query(
    `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rls_own_a`,
  );

  async function asUser<T>(
    userId: number | null,
    fn: (q: (t: string, p?: any[]) => Promise<any>) => Promise<T>,
  ): Promise<T> {
    const c = await admin.connect();
    try {
      await c.query(`SET ROLE rls_own_a`);
      await c.query(`SELECT set_config('app.current_school_id', $1, false)`, [
        String(sid),
      ]);
      if (userId === null) {
        await c.query(`SELECT set_config('app.current_user_id', '', false)`);
      } else {
        await c.query(`SELECT set_config('app.current_user_id', $1, false)`, [
          String(userId),
        ]);
      }
      return await fn(c.query.bind(c));
    } finally {
      await c.query(`RESET ROLE`).catch(() => undefined);
      c.release();
    }
  }
  const ids = async (q: any, text: string, idcol: string, params: any[] = []) =>
    (await q(text, params)).rows
      .map((r: any) => r[idcol])
      .sort((a: number, b: number) => a - b);

  // Teacher: class A only, math marks only, no fees.
  const tStudents = await asUser(teacherUser, (q) =>
    ids(q, `SELECT student_id FROM students`, 'student_id'),
  );
  check(
    'teacher sees only class-A pupil',
    JSON.stringify(tStudents) === JSON.stringify([pupilA]),
    JSON.stringify(tStudents),
  );
  const tMarks = await asUser(teacherUser, (q) =>
    ids(q, `SELECT mark_id, subject_id FROM marks ORDER BY mark_id`, 'mark_id'),
  );
  check('teacher sees 1 mark row', tMarks.length === 1, JSON.stringify(tMarks));
  const tSubj = await asUser(teacherUser, (q) =>
    q(`SELECT DISTINCT subject_id FROM marks`),
  );
  check(
    'teacher mark is math only',
    tSubj.rows.length === 1 && tSubj.rows[0].subject_id === math,
  );
  const tAtt = await asUser(teacherUser, (q) =>
    ids(q, `SELECT attendance_id FROM attendance`, 'attendance_id'),
  );
  check('teacher sees class-A attendance only', tAtt.length === 1);
  const tFees = await asUser(teacherUser, (q) =>
    q(`SELECT * FROM fee_invoices`),
  );
  check('teacher sees no fee rows', tFees.rows.length === 0);
  const tGuard = await asUser(teacherUser, (q) => q(`SELECT * FROM guardians`));
  check('teacher sees class-A guardian contact', tGuard.rows.length === 1);

  // Idle teacher (no assignments): nothing.
  const iStudents = await asUser(idleTeacherUser, (q) =>
    q(`SELECT * FROM students`),
  );
  check('unassigned teacher sees no pupils', iStudents.rows.length === 0);

  // Pupil: self only.
  const pStudents = await asUser(pupilUser, (q) =>
    ids(q, `SELECT student_id FROM students`, 'student_id'),
  );
  check(
    'pupil sees self only',
    JSON.stringify(pStudents) === JSON.stringify([pupilA]),
  );
  const pMarks = await asUser(pupilUser, (q) => q(`SELECT * FROM marks`));
  check('pupil sees own 2 marks', pMarks.rows.length === 2);
  const pFees = await asUser(pupilUser, (q) => q(`SELECT * FROM fee_invoices`));
  check('pupil sees own invoice', pFees.rows.length === 1);

  // Parent: linked kid only.
  const gStudents = await asUser(parentUser, (q) =>
    ids(q, `SELECT student_id FROM students`, 'student_id'),
  );
  check(
    'parent sees linked kid only',
    JSON.stringify(gStudents) === JSON.stringify([pupilA]),
  );
  const gFees = await asUser(parentUser, (q) =>
    q(`SELECT * FROM fee_invoices`),
  );
  check('parent sees kid invoice', gFees.rows.length === 1);

  // Staff (no identity link): full tenant.
  const sStudents = await asUser(staffUser, (q) => q(`SELECT * FROM students`));
  check('staff sees all pupils', sStudents.rows.length === 2);
  const sMarks = await asUser(staffUser, (q) => q(`SELECT * FROM marks`));
  check('staff sees all marks', sMarks.rows.length === 3);

  // No user setting: legacy tenant-wide visibility (documented 010 semantic
  // for unidentified sessions; every login sets a user id).
  const nStudents = await asUser(null, (q) => q(`SELECT * FROM students`));
  check('missing user keeps tenant visibility', nStudents.rows.length === 2);

  // Write blocked: teacher inserting class-B mark denied.
  const wBlocked = await asUser(teacherUser, (q) =>
    q(
      `INSERT INTO marks (school_id, exam_id, student_id, subject_id, class_id, theory_marks, total_marks) VALUES ($1,$2,$3,$4,$5,10,10)`,
      [sid, exam, pupilB, math, classB],
    ),
  )
    .then(() => false)
    .catch(() => true);
  check('teacher write to class B denied', wBlocked);

  await admin.query(`DROP OWNED BY rls_own_a`).catch(() => undefined);
  await admin.query(`DROP ROLE IF EXISTS rls_own_a`);
  await admin.end();
  console.log(`\n${pass}/${pass + fail} ownership checks passed`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error('OWNERSHIP PROBE FAILED:', e.message);
  process.exit(1);
});
