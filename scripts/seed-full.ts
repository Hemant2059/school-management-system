/* Full-coverage idempotent seed for every model/table.
 * Run: npx ts-node scripts/seed-full.ts
 * Uses .env (DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_NAME).
 */
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { NepaliDateUtil } from '../src/utils/nepali-date.util';
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5544', 10),
  user: process.env.DB_USERNAME || 'school',
  password: process.env.DB_PASSWORD || 'School@321',
  database: process.env.DB_NAME || 'sms_nepal',
});

async function q<T = any>(text: string, params?: any[]): Promise<T[]> {
  const r = await pool.query(text, params);
  return r.rows;
}
async function one<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}
async function count(table: string, where = '', params: any[] = []): Promise<number> {
  const r = await q(`SELECT COUNT(*)::int AS c FROM ${table} ${where}`, params);
  return r[0]?.c ?? 0;
}
async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`OK   ${name}`);
  } catch (e: any) {
    console.error(`FAIL ${name}: ${e.message.split('\n')[0]}`);
  }
}

async function main() {
  console.log('Seeding every model...');
  const todayBs = NepaliDateUtil.adToBs(new Date()).bsDate;

  // ---------- 0. reference data ----------
  await step('provinces/districts/local_bodies/wards', async () => {
    if ((await count('provinces')) === 0) {
      await q(`INSERT INTO provinces (name_en, name_np) VALUES
        ('Bagmati','बागमती'),('Gandaki','गण्डकी'),('Lumbini','लुम्बिनी')`);
    }
    const prov = await one(`SELECT id FROM provinces ORDER BY id LIMIT 1`);
    if ((await count('districts')) === 0 && prov) {
      await q(`INSERT INTO districts (province_id, name_en, name_np) VALUES
        ($1,'Kathmandu','काठमाडौं'),($1,'Lalitpur','ललितपुर'),($1,'Chitwan','चितवन')`, [prov.id]);
    }
    const dist = await one(`SELECT id FROM districts ORDER BY id LIMIT 1`);
    if ((await count('local_bodies')) === 0 && dist) {
      await q(`INSERT INTO local_bodies (district_id, type, name_en, name_np) VALUES
        ($1,'Municipality','Kathmandu Metro','काठमाडौं महानगर'),
        ($1,'Municipality','Lalitpur Metro','ललितपुर महानगर')`, [dist.id]);
    }
    const lb = await one(`SELECT id FROM local_bodies ORDER BY id LIMIT 1`);
    if ((await count('wards')) === 0 && lb) {
      await q(`INSERT INTO wards (local_body_id, ward_number) VALUES ($1,10),($1,11)`, [lb.id]);
    }
    if ((await count('caste_ethnicity_groups')) === 0) {
      await q(`INSERT INTO caste_ethnicity_groups (caste_code, name_en, name_np, category) VALUES
        ('01A','Brahmin','ब्राह्मण','Hill'),('02B','Chhetri','क्षेत्री','Hill'),('06C','Rai','राई','Janajati')`);
    }
  });

  await step('fiscal_years', async () => {
    if ((await count('fiscal_years')) === 0) {
      await q(`INSERT INTO fiscal_years (fy_code, start_bs, end_bs, start_ad, end_ad, is_current)
        VALUES ('2082/83','2082-04-01','2083-03-32','2025-07-17','2026-07-16',true),
               ('2081/82','2081-04-01','2082-03-31','2024-07-16','2025-07-16',false)`);
    }
  });

  // ---------- 1. schools ----------
  await step('schools', async () => {
    if ((await count('schools')) === 0) {
      await q(`INSERT INTO schools (name, name_np, address, address_np, phone, email, established_year, is_active, status, school_code)
        VALUES ('Shree Nepal Primary School','श्री नेपाल प्राथमिक विद्यालय','Baneshwor, Kathmandu','बानेश्वर, काठमाडौं','01-1234567','info@nepalprimary.edu.np',1995,true,'ACTIVE','SNP-001'),
               ('Little Stars Academy','लिटिल स्टार्स एकेडेमी','Lazimpat, Kathmandu','लाजिम्पाट, काठमाडौं','01-2345678','contact@litlestars.edu.np',2005,true,'ACTIVE','LSA-001')`);
    }
  });
  const school = await one(`SELECT school_id FROM schools ORDER BY school_id LIMIT 1`);
  const sid = school!.school_id;
  const school2 = await one(`SELECT school_id FROM schools ORDER BY school_id LIMIT 1 OFFSET 1`);

  // ---------- 1b. admin login per school ----------
  await step('school-admins', async () => {
    const adminHash = await bcrypt.hash('Admin123!', 10);
    const schools = await q<{ school_id: number }>(
      `SELECT school_id FROM schools ORDER BY school_id`,
    );
    for (const s of schools) {
      const uname = `admin_${s.school_id}`;
      const ex = await one<{ user_id: number }>(
        `SELECT user_id FROM users WHERE username = $1`,
        [uname],
      );
      let uid = ex?.user_id;
      if (!ex) {
        const created = await q<{ user_id: number }>(
          `INSERT INTO users (username, email, password, password_hash, full_name, full_name_np, phone, user_type, school_id, is_active, is_verified)
           VALUES ($1, $2, $3, $3, $4, $5, $6, 'ADMIN', $7, true, true)
           RETURNING user_id`,
          [
            uname,
            `${uname}@school.local`,
            adminHash,
            `School ${s.school_id} Admin`,
            `विद्यालय ${s.school_id} प्रशासक`,
            `984100000${s.school_id}`,
            s.school_id,
          ],
        );
        uid = created[0]?.user_id;
      }
      if (uid) {
        await q(
          `INSERT INTO school_members (user_id, school_id, status)
           VALUES ($1, $2, 'ACTIVE') ON CONFLICT DO NOTHING`,
          [uid, s.school_id],
        );
      }
    }
  });
  // ---------- 2. academic_years + terms ----------
  await step('academic_years+terms', async () => {
    const fy = await one(`SELECT fiscal_year_id FROM fiscal_years WHERE is_current=true LIMIT 1`);
    if ((await count('academic_years', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO academic_years (school_id, session_name, start_date_ad, end_date_ad, start_date_bs, end_date_bs, fiscal_year_id, is_current)
        VALUES ($1,'2082 Session','2025-04-14','2026-04-13','2082-01-01','2082-12-30',$2,true)`, [sid, fy?.fiscal_year_id ?? null]);
    }
    const ay = await one(`SELECT academic_year_id FROM academic_years WHERE school_id=$1 ORDER BY academic_year_id LIMIT 1`, [sid]);
    if (ay && (await count('terms', 'WHERE academic_year_id=$1', [ay.academic_year_id])) === 0) {
      await q(`INSERT INTO terms (academic_year_id, term_code, term_name, term_name_np, weight_pct, start_date_ad, end_date_ad, start_date_bs, end_date_bs, is_final, display_order)
        VALUES ($1,'FIRST','First Term','पहिलो त्रैमासिक',30,'2025-04-14','2025-08-15','2082-01-01','2082-04-31',false,1),
               ($1,'SECOND','Second Term','दोस्रो त्रैमासिक',30,'2025-08-16','2025-12-15','2082-05-01','2082-08-29',false,2),
               ($1,'ANNUAL','Final Term','वार्षिक',40,'2025-12-16','2026-04-13','2082-09-01','2082-12-30',true,3)`, [ay.academic_year_id]);
    }
  });
  const ay = await one(`SELECT academic_year_id FROM academic_years WHERE school_id=$1 LIMIT 1`, [sid]);

  // ---------- 3. users ----------
  await step('users', async () => {
    if ((await count('users', 'WHERE school_id=$1', [sid])) === 0) {
      const ph = await bcrypt.hash('password123', 10);
      await q(`INSERT INTO users (username, email, password, password_hash, full_name, full_name_np, phone, user_type, school_id, is_active, is_verified)
        VALUES ('admin','admin@test.com',$1,$1,'System Admin','सिस्टम एडमिन','9841000001','ADMIN',$2,true,true),
               ('principal','principal@nepalprimary.edu.np',$1,$1,'Ram Kumar Shrestha','रामकुमार श्रेष्ठ','9841000002','ADMIN',$2,true,true),
               ('teacher1','teacher1@nepalprimary.edu.np',$1,$1,'Shyam Bhatta','श्याम भट्ट','9841000003','TEACHER',$2,true,true),
               ('accountant','accountant@nepalprimary.edu.np',$1,$1,'Sita Sharma','सीता शर्मा','9841000004','ACCOUNTANT',$2,true,true)`,
        [ph, sid]);
    }
  });
  const admin = await one(`SELECT user_id FROM users WHERE school_id=$1 ORDER BY user_id LIMIT 1`, [sid]);

  // ---------- 4. rbac extras ----------
  await step('rbac user_roles/school_members/perm_versions', async () => {
    const role = await one(`SELECT role_id FROM roles ORDER BY role_id LIMIT 1`);
    if (role && admin && (await count('user_roles', 'WHERE user_id=$1', [admin.user_id])) === 0) {
      await q(`INSERT INTO user_roles (user_id, role_id, school_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [admin.user_id, role.role_id, sid]);
    }
    if (admin && (await count('school_members', 'WHERE user_id=$1 AND school_id=$2', [admin.user_id, sid])) === 0) {
      await q(`INSERT INTO school_members (user_id, school_id, status) VALUES ($1,$2,'ACTIVE') ON CONFLICT DO NOTHING`,
        [admin.user_id, sid]);
    }
    if ((await count('school_perm_versions', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO school_perm_versions (school_id, version) VALUES ($1,1) ON CONFLICT DO NOTHING`, [sid]);
    }
    // role_permissions: grant first permission to first role if empty for that role
    const perm = await one(`SELECT permission_id FROM permissions ORDER BY permission_id LIMIT 1`);
    if (role && perm && (await count('role_permissions', 'WHERE role_id=$1', [role.role_id])) === 0) {
      await q(`INSERT INTO role_permissions (role_id, permission_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [role.role_id, perm.permission_id]);
    }
  });

  await step('user_sessions', async () => {
    if (admin && (await count('user_sessions', 'WHERE user_id=$1', [admin.user_id])) === 0) {
      await q(`INSERT INTO user_sessions (session_id, user_id, school_id, refresh_token_hash, ip_address, user_agent, device_name, expires_at)
        VALUES ('seed-session-1',$1,$2,'hash-seed-1','127.0.0.1','seed-agent','Seed Laptop', NOW()+interval '7 days')`,
        [admin.user_id, sid]);
    }
  });

  // ---------- 5. classes/sections/subjects ----------
  await step('classes/sections/subjects/class_subjects', async () => {
    if ((await count('classes', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO classes (school_id, class_name, class_name_np, class_code, class_order, education_level, is_active)
        VALUES ($1,'Nursery','नर्सरी','NUR',0,'PRE_PRIMARY',true),($1,'Class 1','कक्षा १','1',3,'PRIMARY',true),
               ($1,'Class 2','कक्षा २','2',4,'PRIMARY',true),($1,'Class 3','कक्षा ३','3',5,'PRIMARY',true)`, [sid]);
    }
    const c1 = await one(`SELECT class_id FROM classes WHERE school_id=$1 AND class_code='1' LIMIT 1`, [sid]);
    const c2 = await one(`SELECT class_id FROM classes WHERE school_id=$1 AND class_code='2' LIMIT 1`, [sid]);
    if (c1 && (await count('sections', 'WHERE class_id=$1', [c1.class_id])) === 0) {
      await q(`INSERT INTO sections (school_id, class_id, section_name, section_name_np, section_code, section_order, capacity)
        VALUES ($1,$2,'A','क','A',1,30),($1,$2,'B','ख','B',2,30)`, [sid, c1.class_id]);
    }
    if (c2 && (await count('sections', 'WHERE class_id=$1', [c2.class_id])) === 0) {
      await q(`INSERT INTO sections (school_id, class_id, section_name, section_name_np, section_code, section_order, capacity)
        VALUES ($1,$2,'A','क','A',1,30)`, [sid, c2.class_id]);
    }
    if ((await count('subjects', 'WHERE school_id=$1', [sid])) === 0 && c1) {
      await q(`INSERT INTO subjects (school_id, subject_name_en, subject_name_np, subject_code, subject_type, class_id)
        VALUES ($1,'English','अंग्रेजी','ENG','CORE',$2),($1,'Nepali','नेपाली','NEP','CORE',$2),
               ($1,'Mathematics','गणित','MATH','CORE',$2),($1,'Science','विज्ञान','SCI','CORE',$2)`,
        [sid, c1.class_id]);
    }
    if (ay && c1 && (await count('class_subjects')) === 0) {
      const subs = await q(`SELECT subject_id FROM subjects WHERE school_id=$1 LIMIT 2`, [sid]);
      for (const s of subs) {
        await q(`INSERT INTO class_subjects (class_id, subject_id, academic_year_id, is_compulsory)
          VALUES ($1,$2,$3,true) ON CONFLICT DO NOTHING`, [c1.class_id, s.subject_id, ay.academic_year_id]);
      }
    }
  });
  const c1 = await one(`SELECT class_id FROM classes WHERE school_id=$1 ORDER BY class_id LIMIT 1`, [sid]);
  const sec1 = await one(`SELECT section_id FROM sections WHERE school_id=$1 ORDER BY section_id LIMIT 1`, [sid]);
  const subj1 = await one(`SELECT subject_id FROM subjects WHERE school_id=$1 ORDER BY subject_id LIMIT 1`, [sid]);

  // ---------- 6. teachers/staff ----------
  await step('teachers/staff/teacher_assignments', async () => {
    if ((await count('teachers', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO teachers (school_id, teacher_code, employee_id, first_name_en, last_name_en, first_name_np, last_name_np, gender, religion, religion_np, nationality, nationality_np, personal_mobile, official_email, joining_date, joining_date_bs, employment_type, employment_type_np)
        VALUES ($1,'TCH001','EMP001','Ram','Sharma','राम','शर्मा','Male','Hindu','हिन्दु','Nepali','नेपाली','9841000001','ram.sharma@school.edu.np','2015-01-01','2071-09-17','PERMANENT','स्थायी'),
               ($1,'TCH002','EMP002','Geeta','Joshi','गीता','जोशी','Female','Hindu','हिन्दु','Nepali','नेपाली','9841000003','geeta.joshi@school.edu.np','2017-07-01','2074-03-17','PERMANENT','स्थायी')`, [sid]);
    }
    if ((await count('staff', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO staff (school_id, employee_id, staff_code, first_name_en, last_name_en, first_name, first_name_np, last_name, last_name_np, gender, phone, mobile, email, department, department_np, designation, designation_np, joining_date, joining_date_bs, employment_type, employment_type_np, current_status)
        VALUES ($1,'STF001','STF001','Hari','Karki','Hari','हरि','Karki','कार्की','Male','01-4444444','9841000091','hari@school.edu.np','Admin','प्रशासन','Clerk','क्लर्क','2020-01-10','2076-09-25','PERMANENT','स्थायी','active'),
               ($1,'STF002','STF002','Mina','Thapa','Mina','मिना','Thapa','थापा','Female','01-5555555','9841000092','mina@school.edu.np','Accounts','लेखा','Accountant','लेखापाल','2021-03-01','2077-11-17','CONTRACT','करार','active')`, [sid]);
    }
    const t1 = await one(`SELECT teacher_id FROM teachers WHERE school_id=$1 ORDER BY teacher_id LIMIT 1`, [sid]);
    if (ay && c1 && sec1 && subj1 && t1 && (await count('teacher_assignments', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO teacher_assignments (school_id, teacher_id, academic_year_id, class_id, section_id, subject_id)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`, [sid, t1.teacher_id, ay.academic_year_id, c1.class_id, sec1.section_id, subj1.subject_id]);
    }
  });
  const teacher1 = await one(`SELECT teacher_id FROM teachers WHERE school_id=$1 ORDER BY teacher_id LIMIT 1`, [sid]);
  const staff1 = await one(`SELECT staff_id FROM staff WHERE school_id=$1 ORDER BY staff_id LIMIT 1`, [sid]);

  // ---------- 7. students/guardians ----------
  await step('students/guardians/links', async () => {
    if ((await count('students', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO students (school_id, student_code, admission_number, admission_date, admission_date_bs, admission_class_id,
        first_name_en, middle_name_en, last_name_en, first_name_np, middle_name_np, last_name_np, display_name,
        gender, date_of_birth_ad, date_of_birth_bs, nationality, nationality_np, religion, religion_np,
        mother_tongue, mother_tongue_np, caste_ethnicity, caste_ethnicity_np, caste_code,
        birthplace, birthplace_np, blood_group, student_email, student_mobile,
        permanent_province_id, permanent_district_id, permanent_municipality_id, permanent_ward_no,
        permanent_tole_en, permanent_tole_np,
        temporary_province_id, temporary_district_id, temporary_municipality_id, temporary_ward_no,
        temporary_tole_en, temporary_address_en, temporary_tole_np, temporary_address_np,
        created_by, updated_by, disability_type, disability_type_np,
        father_name, father_phone, father_name_np, mother_name, mother_phone, mother_name_np,
        profile_photo_url, roll_number, current_status, is_active, created_at, updated_at)
        VALUES ($1,'STU-2079-001','2079-001','2022-04-14','2079-04-01',1,'Kiran','','Sharma','किरण','','शर्मा','Kiran Sharma','MALE','2016-03-15','2072-12-02','Nepali','नेपाली','Hindu','हिन्दु','Nepali','नेपाली','Brahmin','ब्राह्मण','01A','','','','','',1,1,1,10,'','',0,0,0,0,'','','','',(SELECT user_id FROM users ORDER BY user_id LIMIT 1),(SELECT user_id FROM users ORDER BY user_id LIMIT 1),'NONE','कुनै छैन','','','','','','',1,'ACTIVE',true,NOW(),NOW()),
               ($1,'STU-2079-002','2079-002','2022-04-14','2079-04-01',1,'Sunita','','Khatri','सुनिता','','खत्री','Sunita Khatri','FEMALE','2016-05-20','2072-12-08','Nepali','नेपाली','Hindu','हिन्दु','Nepali','नेपाली','Chhetri','क्षेत्री','02B','','','','','',1,1,1,10,'','',0,0,0,0,'','','','',(SELECT user_id FROM users ORDER BY user_id LIMIT 1),(SELECT user_id FROM users ORDER BY user_id LIMIT 1),'NONE','कुनै छैन','','','','','','',2,'ACTIVE',true,NOW(),NOW()),
               ($1,'STU-2079-003','2079-003','2022-04-14','2079-04-01',1,'Raj','','Yadav','राज','','यादव','Raj Yadav','MALE','2016-07-10','2073-03-23','Nepali','नेपाली','Hindu','हिन्दु','Maithili','मैथिली','Yadav','यादव','03Y','','','','','',1,1,1,10,'','',0,0,0,0,'','','','',(SELECT user_id FROM users ORDER BY user_id LIMIT 1),(SELECT user_id FROM users ORDER BY user_id LIMIT 1),'NONE','कुनै छैन','','','','','','',3,'ACTIVE',true,NOW(),NOW())`, [sid]);
    }
    if ((await count('guardians', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO guardians (school_id, guardian_code, first_name_en, last_name_en, mobile, email, occupation, occupation_np, relation_to_student, relation_to_student_np)
        VALUES ($1,'GRD-01','Deepak','Sharma','9841001001','deepak@email.com','Business','व्यापार','FATHER','बुबा'),
               ($1,'GRD-02','Bikram','Khatri','9841001002','bikram@email.com','Teacher','शिक्षक','FATHER','बुबा')`, [sid]);
    }
    const st = await q(`SELECT student_id FROM students WHERE school_id=$1 ORDER BY student_id LIMIT 2`, [sid]);
    const gd = await q(`SELECT guardian_id FROM guardians WHERE school_id=$1 ORDER BY guardian_id LIMIT 2`, [sid]);
    if (st.length === 2 && gd.length === 2 && (await count('student_guardians')) === 0) {
      await q(`INSERT INTO student_guardians (student_id, guardian_id, relationship_type, is_primary, is_emergency_contact)
        VALUES ($1,$2,'FATHER',true,true),($3,$4,'FATHER',true,true) ON CONFLICT DO NOTHING`,
        [st[0].student_id, gd[0].guardian_id, st[1].student_id, gd[1].guardian_id]);
    }
  });
  const stu1 = await one(`SELECT student_id, admission_number FROM students WHERE school_id=$1 ORDER BY student_id LIMIT 1`, [sid]);
  const stu2 = await one(`SELECT student_id FROM students WHERE school_id=$1 ORDER BY student_id LIMIT 1 OFFSET 1`, [sid]);

  await step('enrollments/student_enrollments/promotions', async () => {
    if (ay && stu1 && c1 && sec1 && (await count('enrollments', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO enrollments (school_id, student_id, academic_year_id, class_id, section_id, roll_no, status)
        VALUES ($1,$2,$3,$4,$5,1,'ENROLLED') ON CONFLICT DO NOTHING`, [sid, stu1.student_id, ay.academic_year_id, c1.class_id, sec1.section_id]);
      if (stu2) {
        await q(`INSERT INTO enrollments (school_id, student_id, academic_year_id, class_id, section_id, roll_no, status)
          VALUES ($1,$2,$3,$4,$5,2,'ENROLLED') ON CONFLICT DO NOTHING`, [sid, stu2.student_id, ay.academic_year_id, c1.class_id, sec1.section_id]);
      }
    }
    if (stu1 && c1 && sec1 && (await count('student_enrollments', 'WHERE student_id=$1', [stu1.student_id])) === 0) {
      await q(`INSERT INTO student_enrollments (school_id, student_id, class_id, section_id, academic_year, enrollment_date, enrollment_date_bs, status, roll_number, is_current)
        VALUES ($1,$2,$3,$4,'2082',CURRENT_DATE,$5,'active',1,true)`, [sid, stu1.student_id, c1.class_id, sec1.section_id, todayBs]);
    }
    const c2 = await one(`SELECT class_id FROM classes WHERE school_id=$1 ORDER BY class_id LIMIT 1 OFFSET 1`, [sid]);
    if (stu1 && c1 && c2 && (await count('student_promotions', 'WHERE student_id=$1', [stu1.student_id])) === 0) {
      await q(`INSERT INTO student_promotions (school_id, student_id, from_class_id, to_class_id, academic_year, from_academic_year, to_academic_year, promotion_date, promotion_date_bs, status, promotion_status)
        VALUES ($1,$2,$3,$4,'2082','2081','2082',CURRENT_DATE,$5,'promoted','PROMOTED')`,
        [sid, stu1.student_id, c1.class_id, c2.class_id, todayBs]);
    }
  });

  await step('academic_calendars', async () => {
    if ((await count('academic_calendars', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO academic_calendars (school_id, title, title_np, description, description_np, event_type, start_date, end_date, start_date_bs, end_date_bs, is_holiday, academic_year)
        VALUES ($1,'Dashain Holiday','दशैं बिदा','Festival break','चाडपर्व बिदा','HOLIDAY','2025-10-01','2025-10-15','2082-06-15','2082-06-29',true,'2082'),
               ($1,'First Terminal Exam','पहिलो त्रैमासिक परीक्षा','Term exam','त्रैमासिक परीक्षा','EXAM','2025-08-01','2025-08-10','2082-04-16','2082-04-25',false,'2082')`, [sid]);
    }
  });

  // ---------- 8. HR extras ----------
  await step('leave_types/leave_requests/payrolls', async () => {
    if ((await count('leave_types', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO leave_types (school_id, name, name_np, max_days_per_year, is_paid) VALUES ($1,'Sick Leave','बिरामी बिदा',12,true),($1,'Casual Leave','आकस्मिक बिदा',10,false)`, [sid]);
    }
    const lt = await one(`SELECT id FROM leave_types WHERE school_id=$1 LIMIT 1`, [sid]);
    if (lt && staff1 && (await count('leave_requests', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO leave_requests (school_id, staff_id, leave_type_id, start_date, end_date, days_requested, reason, reason_np, status)
        VALUES ($1,$2,$3,CURRENT_DATE,CURRENT_DATE+2,3,'Family function','पारिवारिक काम','PENDING')`, [sid, staff1.staff_id, lt.id]);
    }
    if (staff1 && (await count('payrolls', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO payrolls (school_id, staff_id, salary_month_bs, basic_salary, gross_salary, total_deductions, net_salary)
        VALUES ($1,$2,'2082-06',40000,48000,3000,45000)`, [sid, staff1.staff_id]);
    }
  });

  // ---------- 9. fee master ----------
  await step('fee_categories/structures/installments/heads', async () => {
    if ((await count('fee_categories', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO fee_categories (school_id, category_name, category_name_np, description, description_np) VALUES ($1,'Tuition','ट्युसन','Monthly tuition','मासिक ट्युसन'),($1,'Transport','यातायात','Bus fee','बस शुल्क')`, [sid]);
    }
    const fc = await one(`SELECT id FROM fee_categories WHERE school_id=$1 LIMIT 1`, [sid]);
    if (fc && c1 && (await count('fee_structures', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO fee_structures (school_id, category_id, class_id, academic_year, amount, due_date, fee_type)
        VALUES ($1,$2,$3,'2082',12000,'2025-08-01','TUITION')`, [sid, fc.id, c1.class_id]);
    }
    const fs = await one(`SELECT id FROM fee_structures WHERE school_id=$1 LIMIT 1`, [sid]);
    if (fs && (await count('fee_installments', 'WHERE fee_structure_id=$1', [fs.id])) === 0) {
      await q(`INSERT INTO fee_installments (fee_structure_id, installment_number, amount, due_date, due_date_bs)
        VALUES ($1,1,6000,'2025-08-01','2082-04-16'),($1,2,6000,'2025-09-01','2082-05-16')`, [fs.id]);
    }
    if ((await count('fee_heads', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO fee_heads (school_id, code, name_en, name_np) VALUES ($1,'TUITION','Tuition Fee','शुल्क'),($1,'EXAM','Exam Fee','परीक्षा शुल्क')`, [sid]);
    }
    if ((await count('discount_rules', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO discount_rules (school_id, code, name_en, name_np, discount_type, value) VALUES ($1,'SIB10','Sibling Discount','दाजुभाइ छुट','PERCENT',10)`, [sid]);
    }
    if ((await count('late_fine_rules', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO late_fine_rules (school_id, rule_name, rule_name_np, fine_type, fine_amount, grace_period_days, applicable_from, applicable_from_bs) VALUES ($1,'Late Fee','ढिलो शुल्क','flat',100,5,CURRENT_DATE,$2)`, [sid, todayBs]);
    }
    const fh = await one(`SELECT fee_head_id FROM fee_heads WHERE school_id=$1 LIMIT 1`, [sid]);
    if ((await count('penalty_rules', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO penalty_rules (school_id, code, name_en, name_np, fee_head_id, grace_days, mode, amount, percent) VALUES ($1,'LATE1','Late Penalty','ढिलो जरिवाना',$2,5,'FLAT',50,0)`, [sid, fh?.fee_head_id ?? null]);
    }
    if ((await count('scholarship_schemes', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO scholarship_schemes (school_id, code, name_en, category) VALUES ($1,'MERIT-50','Merit Scholarship','MERIT')`, [sid]);
    }
  });

  // ---------- 10. invoices/fees ----------
  await step('fee_invoices/lines/fees/student_fees/balances', async () => {
    const fh = await one(`SELECT fee_head_id FROM fee_heads WHERE school_id=$1 LIMIT 1`, [sid]);
    const fy = await one(`SELECT fiscal_year_id FROM fiscal_years WHERE is_current=true LIMIT 1`);
    if (ay && stu1 && fh && (await count('fee_invoices', 'WHERE school_id=$1', [sid])) === 0) {
      const inv = await q(`INSERT INTO fee_invoices (school_id, student_id, academic_year_id, fiscal_year_id, invoice_no, due_date_ad, subtotal, status)
        VALUES ($1,$2,$3,$4,'INV-2082-001',CURRENT_DATE+30,12000,'ISSUED') RETURNING invoice_id`,
        [sid, stu1.student_id, ay.academic_year_id, fy?.fiscal_year_id ?? null]);
      const invId = inv[0]?.invoice_id;
      if (invId) {
        await q(`INSERT INTO fee_invoice_lines (invoice_id, fee_head_id, description, quantity, unit_amount)
          VALUES ($1,$2,'Tuition Aug',1,12000)`, [invId, fh.fee_head_id]);
      }
    }
    if (stu1 && c1 && (await count('fees', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO fees (school_id, student_id, fee_type, amount, total_amount, due_date, due_date_bs, status, academic_year, class_id, section_id, invoice_number)
        VALUES ($1,$2,'TUITION',12000,12000,'2025-08-01','2082-04-16','PENDING','2082',$3,$4,'INV-2082-001')`,
        [sid, stu1.student_id, c1.class_id, sec1?.section_id ?? null]);
    }
    const fee1 = await one(`SELECT fee_id FROM fees WHERE school_id=$1 LIMIT 1`, [sid]);
    const fstruct = await one(`SELECT id FROM fee_structures WHERE school_id=$1 LIMIT 1`, [sid]);
    if (stu1 && fstruct && (await count('student_fees', 'WHERE student_id=$1', [stu1.student_id])) === 0) {
      await q(`INSERT INTO student_fees (student_id, fee_structure_id, academic_year, total_amount, paid_amount, balance_amount, status)
        VALUES ($1,$2,'2082',12000,0,12000,'pending')`, [stu1.student_id, fstruct.id]);
    }
    if (stu1 && (await count('student_balances', 'WHERE student_id=$1', [stu1.student_id])) === 0) {
      await q(`INSERT INTO student_balances (school_id, student_id, academic_year, brought_forward_amount, total_paid, total_adjusted, total_due, current_balance)
        VALUES ($1,$2,'2082',0,0,0,12000,12000)`, [sid, stu1.student_id]);
    }
    const dr = await one(`SELECT discount_rule_id FROM discount_rules WHERE school_id=$1 LIMIT 1`, [sid]);
    const invAny = await one(`SELECT invoice_id FROM fee_invoices WHERE school_id=$1 LIMIT 1`, [sid]);
    if (stu1 && dr && ay && (await count('student_fee_discounts', 'WHERE student_id=$1', [stu1.student_id])) === 0) {
      await q(`INSERT INTO student_fee_discounts (school_id, student_id, discount_rule_id, academic_year_id, invoice_id, status)
        VALUES ($1,$2,$3,$4,$5,'APPROVED')`, [sid, stu1.student_id, dr.discount_rule_id, ay.academic_year_id, invAny?.invoice_id ?? null]);
    }
    if (stu1 && (await count('sibling_discounts', 'WHERE student_id=$1', [stu1.student_id])) === 0) {
      await q(`INSERT INTO sibling_discounts (school_id, student_id, sibling_count, discount_percent, discount_amount, academic_year)
        VALUES ($1,$2,1,10,1200,'2082')`, [sid, stu1.student_id]);
    }
    if (stu1 && (await count('scholarships', 'WHERE student_id=$1', [stu1.student_id])) === 0) {
      await q(`INSERT INTO scholarships (school_id, student_id, scholarship_type, discount_percent, academic_year, status)
        VALUES ($1,$2,'MERIT',25,'2082','approved')`, [sid, stu1.student_id]);
    }
    const schScheme = await one(`SELECT scholarship_id FROM scholarship_schemes WHERE school_id=$1 LIMIT 1`, [sid]);
    if (stu1 && schScheme && ay && (await count('student_scholarships', 'WHERE student_id=$1', [stu1.student_id])) === 0) {
      await q(`INSERT INTO student_scholarships (student_id, scholarship_id, academic_year_id, discount_percent, status)
        VALUES ($1,$2,$3,25,'APPROVED')`, [stu1.student_id, schScheme.scholarship_id, ay.academic_year_id]);
    }
    if (stu1 && fee1 && (await count('fee_waiver_requests', 'WHERE student_id=$1', [stu1.student_id])) === 0) {
      await q(`INSERT INTO fee_waiver_requests (school_id, student_id, fee_id, waiver_type, requested_amount, reason, reason_np, status)
        VALUES ($1,$2,$3,'NEED_BASED',2000,'Low income family','कम आय भएको परिवार','pending')`, [sid, stu1.student_id, fee1.fee_id]);
    }
  });

  await step('payments/allocations', async () => {
    const fee1 = await one(`SELECT fee_id, student_id FROM fees WHERE school_id=$1 LIMIT 1`, [sid]);
    if (fee1 && (await count('payments', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO payments (school_id, student_id, fee_id, amount, payment_date, payment_method, transaction_id, received_by, remarks, is_verified)
        VALUES ($1,$2,$3,5000,CURRENT_DATE,'CASH','TXN-SEED-001',$4,'Partial seed payment',true)`,
        [sid, fee1.student_id, fee1.fee_id, admin?.user_id ?? null]);
    }
    const pay1 = await one(`SELECT payment_id FROM payments WHERE school_id=$1 LIMIT 1`, [sid]);
    const inv1 = await one(`SELECT invoice_id FROM fee_invoices WHERE school_id=$1 LIMIT 1`, [sid]);
    if (pay1 && inv1 && (await count('payment_allocations', 'WHERE payment_id=$1', [pay1.payment_id])) === 0) {
      await q(`INSERT INTO payment_allocations (payment_id, invoice_id, amount) VALUES ($1,$2,5000)`, [pay1.payment_id, inv1.invoice_id]);
    }
  });

  // ---------- 11. attendance ----------
  await step('attendance/attendance_records', async () => {
    if (stu1 && (await count('attendance', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO attendance (school_id, student_id, class_id, section_id, attendance_date, status, academic_year, marked_by)
        VALUES ($1,$2,$3,$4,CURRENT_DATE,'PRESENT','2082',$5)`,
        [sid, stu1.student_id, c1?.class_id ?? null, sec1?.section_id ?? null, admin?.user_id ?? null]);
    }
    if (stu1 && (await count('attendance_records', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO attendance_records (school_id, student_id, date, date_bs, status, marked_by)
        VALUES ($1,$2,CURRENT_DATE,$3,'present',$4)`, [sid, stu1.student_id, todayBs, admin?.user_id ?? null]);
    }
  });

  // ---------- 12. exams/marks/results ----------
  await step('exams/schedules/marks/term_results/report_cards/grade_lines', async () => {
    if (c1 && (await count('exams', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO exams (school_id, exam_name, exam_name_np, exam_type, class_id, academic_year, start_date, start_date_bs, end_date, end_date_bs)
        VALUES ($1,'First Terminal','पहिलो त्रैमासिक','TERMINAL',$2,'2082','2025-08-01','2082-04-16','2025-08-10','2082-04-25')`, [sid, c1.class_id]);
    }
    const ex1 = await one(`SELECT exam_id FROM exams WHERE school_id=$1 LIMIT 1`, [sid]);
    if (ex1 && c1 && subj1 && (await count('exam_schedules', 'WHERE exam_id=$1', [ex1.exam_id])) === 0) {
      await q(`INSERT INTO exam_schedules (exam_id, class_id, subject_id, exam_date_ad, full_theory, full_practical, pass_theory, pass_practical)
        VALUES ($1,$2,$3,CURRENT_DATE,75,25,26,10)`, [ex1.exam_id, c1.class_id, subj1.subject_id]);
    }
    if (stu1 && ex1 && subj1 && c1 && (await count('marks', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO marks (school_id, student_id, exam_id, subject_id, class_id, academic_year, theory_marks, practical_marks, total_marks, grade)
        VALUES ($1,$2,$3,$4,$5,'2082',65,20,85,'A')`, [sid, stu1.student_id, ex1.exam_id, subj1.subject_id, c1.class_id]);
    }
    if (ay && stu1 && ex1 && c1 && (await count('student_term_results', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO student_term_results (school_id, exam_id, student_id, academic_year_id, class_id, section_id, total_obtained, total_full, percentage, gpa, overall_grade, is_pass)
        VALUES ($1,$2,$3,$4,$5,$6,340,400,85,3.6,'A',true)`,
        [sid, ex1.exam_id, stu1.student_id, ay.academic_year_id, c1.class_id, sec1?.section_id ?? null]);
    }
    if (stu1 && ex1 && (await count('report_cards', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO report_cards (school_id, student_id, exam_id, academic_year, total_gpa, total_percentage, teacher_remark, teacher_remark_np, is_published)
        VALUES ($1,$2,$3,'2082',3.6,85,'Good progress','राम्रो प्रगति',false)`, [sid, stu1.student_id, ex1.exam_id]);
    }
    const gs = await one(`SELECT scale_id FROM grade_scales ORDER BY scale_id LIMIT 1`);
    if (gs && (await count('grade_scale_lines', 'WHERE scale_id=$1', [gs.scale_id])) === 0) {
      await q(`INSERT INTO grade_scale_lines (scale_id, grade, grade_point, min_percent, max_percent, remark, remark_np)
        VALUES ($1,'A+',4.0,90,100,'Outstanding','उत्कृष्ट'),($1,'A',3.6,80,90,'Excellent','अति राम्रो'),($1,'B',3.0,70,80,'Good','राम्रो')`, [gs.scale_id]);
    }
  });

  // ---------- 13. teaching extras ----------
  await step('assignments/timetables/live_classes', async () => {
    if (c1 && subj1 && teacher1 && (await count('assignments', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO assignments (school_id, title, title_np, description, description_np, class_id, section_id, subject_id, teacher_id, due_date, total_marks, is_published)
        VALUES ($1,'Math Homework 1','गणित गृहकार्य १','Solve exercises 1-10','अभ्यास १-१० हल गर्नुहोस्',$2,$3,$4,$5,CURRENT_DATE+7,20,true)`,
        [sid, c1.class_id, sec1?.section_id ?? null, subj1.subject_id, teacher1.teacher_id]);
    }
    if (c1 && subj1 && teacher1 && (await count('timetables', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO timetables (school_id, class_id, section_id, subject_id, teacher_id, day_of_week, day_of_week_np, period_number, start_time, end_time, academic_year, room_number)
        VALUES ($1,$2,$3,$4,$5,'MONDAY','सोमबार',1,'10:00','10:45','2082','R-101')`,
        [sid, c1.class_id, sec1?.section_id ?? null, subj1.subject_id, teacher1.teacher_id]);
    }
    if (c1 && subj1 && teacher1 && (await count('live_classes', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO live_classes (school_id, class_name, class_name_np, description, description_np, teacher_id, subject_id, class_id, section_id, scheduled_at, duration, platform, meeting_url, status)
        VALUES ($1,'Class 1 Science Live','कक्षा १ विज्ञान लाइभ','Chapter 3 revision','पाठ ३ दोहोर्याउने',$2,$3,$4,$5,NOW()+interval '1 day',45,'JITSI','https://meet.jit.si/seed-class-1','scheduled')`,
        [sid, teacher1.teacher_id, subj1.subject_id, c1.class_id, sec1?.section_id ?? null]);
    }
  });

  // ---------- 14. library ----------
  await step('books/book_issues', async () => {
    if ((await count('books', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO books (school_id, isbn, title, title_en, author, publisher, publisher_np, category, category_np, total_copies, available_copies, shelf_location, price, acquisition_date, acquisition_date_bs)
        VALUES ($1,'978-9937-0-001','Muna Madan','Muna Madan','Laxmi Prasad Devkota','Sajha','साझा','Literature','साहित्य',5,5,'A-01',350,CURRENT_DATE,$2),
               ($1,'978-9937-0-002','Science Grade 5','Science Grade 5','CDC Nepal','Janak','जनक','Textbook','पाठ्यपुस्तक',10,10,'B-02',280,CURRENT_DATE,$2)`, [sid, todayBs]);
    }
    const b1 = await one(`SELECT book_id FROM books WHERE school_id=$1 LIMIT 1`, [sid]);
    if (b1 && stu1 && (await count('book_issues', 'WHERE book_id=$1', [b1.book_id])) === 0) {
      await q(`INSERT INTO book_issues (school_id, book_id, student_id, issue_date, due_date, status)
        VALUES ($1,$2,$3,CURRENT_DATE,CURRENT_DATE+14,'issued')`, [sid, b1.book_id, stu1.student_id]);
    }
  });

  // ---------- 15. transport ----------
  await step('transport routes/stops/vehicles/assignments/fees', async () => {
    if ((await count('transport_routes', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO transport_routes (school_id, route_code, route_name, route_name_np, start_point, start_point_np, end_point, end_point_np, distance_km, monthly_fee)
        VALUES ($1,'RT-01','Baneshwor Route','बानेश्वर रुट','Baneshwor','बानेश्वर','School Gate','विद्यालय गेट',4.5,1500)`, [sid]);
    }
    if ((await count('routes', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO routes (school_id, route_code, route_name, route_name_np, start_point, start_point_np, end_point, end_point_np, distance_km, fare)
        VALUES ($1,'RT-01','Baneshwor Route','बानेश्वर रुट','Baneshwor','बानेश्वर','School Gate','विद्यालय गेट',4.5,1500)`, [sid]);
    }
    const r1 = await one(`SELECT route_id FROM routes WHERE school_id=$1 LIMIT 1`, [sid]);
    if (r1 && (await count('route_stops', 'WHERE route_id=$1', [r1.route_id])) === 0) {
      await q(`INSERT INTO route_stops (school_id, route_id, stop_name, stop_name_np, stop_order, pickup_time, fare)
        VALUES ($1,$2,'Baneshwor Chowk','बानेश्वर चोक',1,'07:30',0),($1,$2,'Thapagaun','थापागाउँ',2,'07:40',0)`, [sid, r1.route_id]);
    }
    if ((await count('vehicles', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO vehicles (school_id, vehicle_number, vehicle_name, vehicle_name_np, vehicle_type, vehicle_type_np, capacity)
        VALUES ($1,'BA-1-KHA-1234','School Bus 1','स्कुल बस १','BUS','बस',35)`, [sid]);
    }
    const v1 = await one(`SELECT vehicle_id FROM vehicles WHERE school_id=$1 LIMIT 1`, [sid]);
    const stop1 = await one(`SELECT stop_id FROM route_stops WHERE school_id=$1 LIMIT 1`, [sid]);
    if (stu1 && r1 && (await count('transport_assignments', 'WHERE student_id=$1', [stu1.student_id])) === 0) {
      await q(`INSERT INTO transport_assignments (school_id, student_id, route_id, stop_id, vehicle_id, effective_from, effective_from_bs, assignment_date, assignment_date_bs)
        VALUES ($1,$2,$3,$4,$5,CURRENT_DATE,$6,CURRENT_DATE,$6)`,
        [sid, stu1.student_id, r1.route_id, stop1?.stop_id ?? null, v1?.vehicle_id ?? null, todayBs]);
    }
    if (r1 && (await count('transport_fees', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO transport_fees (school_id, route_id, academic_year, amount, monthly_fee, admission_fee, currency)
        VALUES ($1,$2,'2082',1500,1500,0,'NPR')`, [sid, r1.route_id]);
    }
  });

  // ---------- 16. hostel ----------
  await step('hostels/rooms/students/allocations', async () => {
    if ((await count('hostels', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO hostels (school_id, name, name_np, type, total_beds, available_beds, warden_name, warden_name_np, warden_contact, address, address_np)
        VALUES ($1,'Boys Hostel','छात्रावास','BOYS',40,38,'Kedar Nath','केदार नाथ','9841000111','School Premises','विद्यालय परिसर')`, [sid]);
    }
    const h1 = await one(`SELECT hostel_id FROM hostels WHERE school_id=$1 LIMIT 1`, [sid]);
    if (h1 && (await count('hostel_rooms', 'WHERE hostel_id=$1', [h1.hostel_id])) === 0) {
      await q(`INSERT INTO hostel_rooms (hostel_id, room_number, floor, capacity, available_beds, room_type, room_type_np, price)
        VALUES ($1,'101','Ground',4,4,'SHARED','साझा',2000),($1,'102','Ground',4,4,'SHARED','साझा',2000)`, [h1.hostel_id]);
    }
    const room1 = await one(`SELECT room_id FROM hostel_rooms WHERE hostel_id=$1 LIMIT 1`, [h1?.hostel_id ?? -1]);
    if (stu1 && h1 && (await count('hostel_students', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO hostel_students (school_id, hostel_id, room_id, student_id, admission_number, student_name, bed_number, contact_number, check_in_date, status)
        VALUES ($1,$2,$3,$4,$5,'Kiran Sharma','B-1','9841001001',CURRENT_DATE,'active')`,
        [sid, h1.hostel_id, room1?.room_id ?? null, stu1.student_id, stu1.admission_number]);
    }
    if (ay && stu1 && h1 && (await count('hostel_allocations', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO hostel_allocations (school_id, student_id, hostel_id, academic_year_id, room_no, bed_no, monthly_fee)
        VALUES ($1,$2,$3,$4,'101','B-1',2000)`, [sid, stu1.student_id, h1.hostel_id, ay.academic_year_id]);
    }
  });

  // ---------- 17. docs ----------
  await step('documents/student_documents/templates/exports', async () => {
    if ((await count('documents', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO documents (school_id, student_id, title, title_np, description, description_np, document_type, file_path, file_name, mime_type, uploaded_by)
        VALUES ($1,$2,'Birth Certificate','जन्म दर्ता','Seed birth certificate','नमुना जन्म दर्ता','BIRTH_CERT','/uploads/seed-bc.pdf','seed-bc.pdf','application/pdf',$3)`,
        [sid, stu1?.student_id ?? null, admin?.user_id ?? null]);
    }
    const d1 = await one(`SELECT document_id FROM documents WHERE school_id=$1 LIMIT 1`, [sid]);
    if (stu1 && d1 && (await count('student_documents', 'WHERE student_id=$1', [stu1.student_id])) === 0) {
      await q(`INSERT INTO student_documents (student_id, document_id, document_type, file_path)
        VALUES ($1,$2,'BIRTH_CERT','/uploads/seed-bc.pdf')`, [stu1.student_id, d1.document_id]);
    }
    if ((await count('document_templates', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO document_templates (school_id, name, name_np, template_type, template_content, template_content_np)
        VALUES ($1,'Bonafide Template','बोनाफाइड नमुना','BONAFIDE','This certifies {{name}} studies in {{class}}','यो प्रमाणित गर्दछ कि {{name}} {{class}} मा अध्ययनरत छन्।')`, [sid]);
    }
    if ((await count('data_exports', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO data_exports (school_id, export_type, file_path, status, created_by)
        VALUES ($1,'STUDENTS','/exports/students-seed.csv','completed',$2)`, [sid, admin?.user_id ?? null]);
    }
  });

  // ---------- 18. notifications ----------
  await step('notifications/sms', async () => {
    if (admin && (await count('notifications', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO notifications (school_id, user_id, title, title_np, message, message_np, type) VALUES
        ($1,$2,'Welcome','स्वागत छ','Seed notification for demo','नमुनाका लागि सूचना','INFO'),
        ($1,$2,'Fee Due','शुल्क बाँकी','Your fee is due next week','तपाईंको शुल्क अर्को हप्ता बुझाउनुपर्नेछ','FEE')`, [sid, admin.user_id]);
    }
    if ((await count('sms_templates', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO sms_templates (school_id, name, name_np, template_text, template_text_np, event_type) VALUES
        ($1,'Fee Reminder','शुल्क सम्झना','Dear parent, fee of Rs. {{amount}} is due.','अभिभावकज्यू, रु. {{amount}} शुल्क बुझाउन बाँकी छ।','FEE_DUE'),
        ($1,'Absent Alert','अनुपस्थिति सूचना','Your child was absent today.','तपाईंको बच्चा आज अनुपस्थित थियो।','ATTENDANCE')`, [sid]);
    }
    if ((await count('sms_logs', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO sms_logs (school_id, recipient_phone, recipient_name, message, status)
        VALUES ($1,'9841001001','Deepak Sharma','Fee reminder seed message','SENT')`, [sid]);
    }
  });

  // ---------- 19. certificates ----------
  await step('certificates/tc/bonafide/character', async () => {
    if (stu1 && (await count('certificates', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO certificates (school_id, student_id, certificate_type, certificate_type_np, certificate_number, issued_date, issued_by, certificate_data)
        VALUES ($1,$2,'BONAFIDE','बोनाफाइड','CERT-2082-001',CURRENT_DATE,$3,'{"class":"1"}')`,
        [sid, stu1.student_id, admin?.user_id ?? null]);
    }
    const cert1 = await one(`SELECT certificate_id FROM certificates WHERE school_id=$1 LIMIT 1`, [sid]);
    if (stu1 && (await count('transfer_certificates', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO transfer_certificates (school_id, student_id, certificate_id, tc_number, issue_date, issue_date_bs, last_class, last_class_np, status, issued_to, issued_to_np, is_conduct_certificate, signature_principal, signature_teacher)
        VALUES ($1,$2,$3,'TC-2082-001',CURRENT_DATE,$4,'Class 5','कक्षा ५','issued','Parent','अभिभावक',false,true,true)`,
        [sid, stu1.student_id, cert1?.certificate_id ?? null, todayBs]);
    }
    if (stu1 && (await count('bonafide_certificates', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO bonafide_certificates (school_id, student_id, certificate_id, certificate_number, issue_date, issue_date_bs, purpose, purpose_np)
        VALUES ($1,$2,$3,'BON-2082-001',CURRENT_DATE,$4,'Bank account opening','बैंक खाता खोल्न')`,
        [sid, stu1.student_id, cert1?.certificate_id ?? null, todayBs]);
    }
    if (stu1 && (await count('character_certificates', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO character_certificates (school_id, student_id, certificate_id, certificate_number, issue_date, issue_date_bs, character_remarks, character_remarks_np, character_grade)
        VALUES ($1,$2,$3,'CHAR-2082-001',CURRENT_DATE,$4,'Good conduct','राम्रो आचरण','A')`,
        [sid, stu1.student_id, cert1?.certificate_id ?? null, todayBs]);
    }
  });

  // ---------- 20. admissions ----------
  // No online-apply flow: admins admit directly via POST /students.
  // (online_admissions table dropped in migration 022.)

  // ---------- 21. system ----------
  await step('audit/sync/webhooks/rate_limits', async () => {
    if ((await count('audit_logs', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO audit_logs (school_id, user_id, user_name, action, entity_type, entity_id, description, ip_address)
        VALUES ($1,$2,'System Admin','CREATE','student',$3,'Seed student created','127.0.0.1')`,
        [sid, admin?.user_id ?? null, stu1?.student_id ?? 1]);
    }
    if ((await count('sync_queue', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO sync_queue (school_id, entity_type, entity_id, operation, data, status)
        VALUES ($1,'student',$2,'CREATE','{"seed":true}','pending')`, [sid, stu1?.student_id ?? 1]);
    }
    if ((await count('sync_log')) === 0) {
      await q(`INSERT INTO sync_log (school_id, sync_id, entity_type, entity_id, operation, status, message, success)
        VALUES ($1,'SYNC-SEED-1','student',$2,'CREATE','success','Seed sync ok',true)`, [sid, stu1?.student_id ?? 1]);
    }
    if ((await count('webhooks', 'WHERE school_id=$1', [sid])) === 0) {
      await q(`INSERT INTO webhooks (school_id, name, url, event_type, webhook_type, events, created_by)
        VALUES ($1,'Fee Webhook','https://example.com/hooks/fee','FEE_PAID','OUTGOING','["FEE_PAID"]',$2)`,
        [sid, admin?.user_id ?? null]);
    }
    const wh = await one(`SELECT id FROM webhooks WHERE school_id=$1 LIMIT 1`, [sid]);
    if (wh && (await count('webhook_logs', 'WHERE webhook_id=$1', [wh.id])) === 0) {
      await q(`INSERT INTO webhook_logs (webhook_id, payload, response_status, response_body, event_type, success)
        VALUES ($1,'{"event":"FEE_PAID"}',200,'OK','FEE_PAID',true)`, [wh.id]);
    }
    if ((await count('rate_limits', "WHERE endpoint='/api/students'")) === 0) {
      await q(`INSERT INTO rate_limits (ip_address, endpoint, request_count, window_start) VALUES ('127.0.0.1','/api/students',1,NOW())`);
    }
  });

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
