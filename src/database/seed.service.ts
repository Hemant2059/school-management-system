import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from './database.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);
  private seeded = false;

  constructor(private db: DatabaseService) {}

  async onModuleInit() {
    if (this.seeded) {
      this.logger.log('Seed already completed, skipping...');
      return;
    }

    await this.waitForSchema();
    await this.seedAll();
    await this.resetAdminPassword();
    this.seeded = true;
  }

  private async waitForSchema(): Promise<void> {
    this.logger.log('Waiting for database schema to be ready...');
    let retries = 30;
    while (retries > 0) {
      try {
        await this.db.query('SELECT 1 FROM schools LIMIT 1');
        this.logger.log('Database schema is ready');
        return;
      } catch {
        retries--;
        if (retries === 0) {
          throw new Error('Database schema initialization timeout');
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Demo-school resolution: prefer Shree Nepal Primary School, else the
   * oldest school, else create Default School. Every seed method below uses
   * this instead of a hardcoded school_id, so seeds survive non-fresh DBs.
   */
  async seedSchoolId(): Promise<number> {
    const named = await this.db.query(
      `SELECT school_id FROM schools WHERE name = 'Shree Nepal Primary School' LIMIT 1`,
    );
    if (named.length > 0) return named[0].school_id;
    const first = await this.db.query(
      `SELECT school_id FROM schools ORDER BY school_id LIMIT 1`,
    );
    if (first.length > 0) return first[0].school_id;
    const created = await this.db.query(
      `INSERT INTO schools (name, address, phone, email, is_active, created_at, updated_at)
       VALUES ('Default School', 'Kathmandu', '01-1234567', 'info@school.edu.np', true, NOW(), NOW())
       RETURNING school_id`,
    );
    return created[0].school_id;
  }

  async seedAll() {
    this.logger.log('Starting seed data...');
    try {
      await this.seedSchools();
      await this.seedUsers();
      await this.seedClasses();
      await this.seedSections();
      await this.seedSubjects();
      await this.seedStudents();
      await this.seedGuardians();
      await this.seedStudentGuardians();
      await this.seedFees();
      await this.seedPayments();
      await this.seedAttendance();
      await this.seedExams();
      await this.seedMarks();
      await this.seedTeachers();
      this.logger.log('Seed data completed successfully');
    } catch (error) {
      this.logger.error('Seed error: ' + error.message);
    }
  }

  async resetAdminPassword() {
    try {
      const passwordHash = await bcrypt.hash('Admin123!', 10);

      // First ensure a school exists
      const schools = await this.db.query(
        `SELECT school_id FROM schools LIMIT 1`,
      );
      let schoolId = 1;
      if (schools.length === 0) {
        const newSchool = await this.db.query(
          `INSERT INTO schools (name, address, phone, email, is_active, created_at, updated_at)
           VALUES ('Default School', 'Kathmandu', '01-1234567', 'info@school.edu.np', true, NOW(), NOW())
           RETURNING school_id`,
        );
        schoolId = newSchool[0].school_id;
        this.logger.log('Created default school with id: ' + schoolId);
      } else {
        schoolId = schools[0].school_id;
      }

      // Check if admin already exists
      const existingAdmin = await this.db.query(
        `SELECT user_id FROM users WHERE user_type = 'ADMIN' AND school_id = $1 LIMIT 1`,
        [schoolId],
      );

      if (existingAdmin.length > 0) {
        this.logger.log('Admin user already exists, skipping creation');
        return;
      }

      // Create new admin
      await this.db.query(
        `INSERT INTO users (username, email, password, password_hash, full_name, phone, user_type, school_id, is_active, is_verified, created_at, updated_at)
         VALUES ('admin', 'admin@test.com', $1, $1, 'System Admin', '9841000001', 'ADMIN', $2, true, true, NOW(), NOW())`,
        [passwordHash, schoolId],
      );

      this.logger.log(
        'Admin user created with password: Admin123! for school: ' + schoolId,
      );
    } catch (error) {
      this.logger.error('Failed to reset admin password: ' + error.message);
    }
  }

  async seedSchools() {
    const existing = await this.db.query(
      'SELECT school_id FROM schools WHERE name = $1',
      ['Shree Nepal Primary School'],
    );
    if (existing.length > 0) {
      this.logger.log('Schools already seeded');
      return;
    }

    await this.db.query(`
      INSERT INTO schools (name, address, phone, email, is_active, created_at, updated_at)
      VALUES 
        ('Shree Nepal Primary School', 'Baneshwor, Kathmandu', '01-1234567', 'info@nepalprimary.edu.np', true, NOW(), NOW()),
        ('Little Stars Academy', 'Lazimpat, Kathmandu', '01-2345678', 'contact@litlestars.edu.np', true, NOW(), NOW()),
        ('Garden View School', 'Kumaripati, Lalitpur', '01-3456789', 'info@gardenview.edu.np', true, NOW(), NOW()),
        ('Everest International School', 'Pokhara, Kaski', '061-123456', 'admin@everest.edu.np', true, NOW(), NOW()),
        ('Bharatpur Model College', 'Bharatpur, Chitwan', '056-123456', 'info@bharatpurmodel.edu.np', true, NOW(), NOW())
    `);
    this.logger.log('Schools seeded');
  }

  async seedUsers() {
    const existing = await this.db.query(
      'SELECT user_id FROM users WHERE username = $1',
      ['principal'],
    );
    if (existing.length > 0) {
      this.logger.log('Users already seeded');
      return;
    }

    const passwordHash = await bcrypt.hash('password123', 10);
    const sid = await this.seedSchoolId();

    const users = [
      [
        'principal',
        'principal@nepalprimary.edu.np',
        passwordHash,
        'Ram Kumar Shrestha',
        '9841000001',
        'ADMIN',
        1,
      ],
      [
        'teacher1',
        'teacher1@nepalprimary.edu.np',
        passwordHash,
        'Shyam Prasad Bhatta',
        '9841000002',
        'TEACHER',
        1,
      ],
      [
        'teacher2',
        'teacher2@nepalprimary.edu.np',
        passwordHash,
        'Geeta Kumari Joshi',
        '9841000003',
        'TEACHER',
        1,
      ],
      [
        'teacher3',
        'teacher3@nepalprimary.edu.np',
        passwordHash,
        'Dipak Kumar Yadav',
        '9841000004',
        'TEACHER',
        1,
      ],
      [
        'accountant',
        'accountant@nepalprimary.edu.np',
        passwordHash,
        'Sita Devi Sharma',
        '9841000005',
        'ACCOUNTANT',
        1,
      ],
    ];

    for (const u of users) {
      u[u.length - 1] = sid;
      await this.db.query(
        `INSERT INTO users (username, email, password, password_hash, full_name, phone, user_type, school_id, is_active, is_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $3, $4, $5, $6, $7, true, true, NOW(), NOW())`,
        u,
      );
    }
    this.logger.log('Users seeded');
  }

  async seedClasses() {
    const sid = await this.seedSchoolId();
    const existing = await this.db.query(
      'SELECT class_id FROM classes WHERE school_id = $1 AND class_name = $2',
      [sid, 'Nursery'],
    );
    if (existing.length > 0) {
      this.logger.log('Classes already seeded');
      return;
    }

    const schoolIds = await this.db.query<{ school_id: number; name: string }>(
      `SELECT school_id, name FROM schools WHERE name = ANY($1)`,
      [
        [
          'Shree Nepal Primary School',
          'Little Stars Academy',
          'Garden View School',
        ],
      ],
    );
    const byName = new Map(schoolIds.map((s) => [s.name, s.school_id]));
    // (schoolName, class_name, class_code, class_order, education_level)
    const rows: Array<[string, string, string, number, string]> = [
      ['Shree Nepal Primary School', 'Nursery', 'NUR', 0, 'PRE_PRIMARY'],
      ['Shree Nepal Primary School', 'L.K.G', 'LKG', 1, 'PRE_PRIMARY'],
      ['Shree Nepal Primary School', 'U.K.G', 'UKG', 2, 'PRE_PRIMARY'],
      ['Shree Nepal Primary School', 'Class 1', '1', 3, 'PRIMARY'],
      ['Shree Nepal Primary School', 'Class 2', '2', 4, 'PRIMARY'],
      ['Shree Nepal Primary School', 'Class 3', '3', 5, 'PRIMARY'],
      ['Shree Nepal Primary School', 'Class 4', '4', 6, 'PRIMARY'],
      ['Shree Nepal Primary School', 'Class 5', '5', 7, 'PRIMARY'],
      ['Little Stars Academy', 'Nursery', 'NUR', 0, 'PRE_PRIMARY'],
      ['Little Stars Academy', 'L.K.G', 'LKG', 1, 'PRE_PRIMARY'],
      ['Little Stars Academy', 'U.K.G', 'UKG', 2, 'PRE_PRIMARY'],
      ['Little Stars Academy', 'Class 1', '1', 3, 'PRIMARY'],
      ['Little Stars Academy', 'Class 2', '2', 4, 'PRIMARY'],
      ['Garden View School', 'Nursery', 'NUR', 0, 'PRE_PRIMARY'],
      ['Garden View School', 'Class 1', '1', 1, 'PRIMARY'],
    ];
    for (const [schoolName, className, classCode, classOrder, level] of rows) {
      const schoolId =
        byName.get(schoolName) ??
        (schoolName === 'Shree Nepal Primary School' ? sid : undefined);
      if (!schoolId) {
        this.logger.warn(`Skipping classes for missing school ${schoolName}`);
        continue;
      }
      await this.db.query(
        `INSERT INTO classes (school_id, class_name, class_code, class_order, education_level, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW())
         ON CONFLICT DO NOTHING`,
        [schoolId, className, classCode, classOrder, level],
      );
    }
    this.logger.log('Classes seeded');
  }

  async seedSections() {
    const sid = await this.seedSchoolId();
    const existing = await this.db.query(
      'SELECT section_id FROM sections WHERE school_id = $1 LIMIT 1',
      [sid],
    );
    if (existing.length > 0) {
      this.logger.log('Sections already seeded');
      return;
    }

    // (schoolName, class_code, section_name, section_order)
    const rows: Array<[string, string, string, number]> = [
      ['Shree Nepal Primary School', 'UKG', 'A', 1],
      ['Shree Nepal Primary School', 'UKG', 'B', 2],
      ['Shree Nepal Primary School', '1', 'A', 1],
      ['Shree Nepal Primary School', '1', 'B', 2],
      ['Shree Nepal Primary School', '2', 'A', 1],
      ['Shree Nepal Primary School', '3', 'A', 1],
      ['Shree Nepal Primary School', '4', 'A', 1],
      ['Shree Nepal Primary School', '5', 'A', 1],
      ['Little Stars Academy', 'NUR', 'A', 1],
      ['Little Stars Academy', 'LKG', 'A', 1],
      ['Little Stars Academy', 'UKG', 'A', 1],
      ['Garden View School', '1', 'A', 1],
    ];
    const schoolIds = await this.db.query<{ school_id: number; name: string }>(
      `SELECT school_id, name FROM schools WHERE name = ANY($1)`,
      [Array.from(new Set(rows.map((r) => r[0])))],
    );
    const byName = new Map(schoolIds.map((s) => [s.name, s.school_id]));
    for (const [schoolName, classCode, sectionName, sectionOrder] of rows) {
      const schoolId =
        byName.get(schoolName) ??
        (schoolName === 'Shree Nepal Primary School' ? sid : undefined);
      if (!schoolId) {
        this.logger.warn(
          `Skipping section ${sectionName} for missing school ${schoolName}`,
        );
        continue;
      }
      const cls = await this.db.query(
        `SELECT class_id FROM classes WHERE school_id = $1 AND class_code = $2 LIMIT 1`,
        [schoolId, classCode],
      );
      if (cls.length === 0) {
        this.logger.warn(
          `Skipping section ${sectionName}: class ${classCode} missing`,
        );
        continue;
      }
      await this.db.query(
        `INSERT INTO sections (school_id, class_id, section_name, section_code, section_order, is_active, created_at)
         VALUES ($1, $2, $3, $3, $4, true, NOW())
         ON CONFLICT DO NOTHING`,
        [schoolId, cls[0].class_id, sectionName, sectionOrder],
      );
    }
    this.logger.log('Sections seeded');
  }

  async seedSubjects() {
    const sid = await this.seedSchoolId();
    const existing = await this.db.query(
      'SELECT subject_id FROM subjects WHERE school_id = $1 LIMIT 1',
      [sid],
    );
    if (existing.length > 0) {
      this.logger.log('Subjects already seeded');
      return;
    }

    // (class_code, name_en, name_np, subject_code) for the seed school
    const catalog: Array<[string, string, string, string]> = [
      ['1', 'English', 'अंग्रेजी', 'ENG'],
      ['1', 'Nepali', 'नेपाली', 'NEP'],
      ['1', 'Mathematics', 'गणित', 'MATH'],
      ['1', 'Science', 'विज्ञान', 'SCI'],
      ['1', 'Social Studies', 'सामाजिक अध्ययन', 'SST'],
      ['2', 'English', 'अंग्रेजी', 'ENG'],
      ['2', 'Nepali', 'नेपाली', 'NEP'],
      ['2', 'Mathematics', 'गणित', 'MATH'],
      ['2', 'Science', 'विज्ञान', 'SCI'],
      ['2', 'Social Studies', 'सामाजिक अध्ययन', 'SST'],
      ['3', 'English', 'अंग्रेजी', 'ENG'],
      ['3', 'Nepali', 'नेपाली', 'NEP'],
      ['3', 'Mathematics', 'गणित', 'MATH'],
      ['3', 'Science', 'विज्ञान', 'SCI'],
      ['3', 'Social Studies', 'सामाजिक अध्ययन', 'SST'],
    ];
    for (const [classCode, nameEn, nameNp, subjectCode] of catalog) {
      const cls = await this.db.query(
        `SELECT class_id FROM classes WHERE school_id = $1 AND class_code = $2 LIMIT 1`,
        [sid, classCode],
      );
      if (cls.length === 0) {
        this.logger.warn(`Skipping subjects: class ${classCode} missing`);
        continue;
      }
      await this.db.query(
        `INSERT INTO subjects (school_id, subject_name_en, subject_name_np, subject_code, subject_type, class_id, is_active, created_at)
         VALUES ($1, $2, $3, $4, 'CORE', $5, true, NOW())
         ON CONFLICT DO NOTHING`,
        [sid, nameEn, nameNp, subjectCode, cls[0].class_id],
      );
    }
    this.logger.log('Subjects seeded');
  }

  async seedStudents() {
    const sid = await this.seedSchoolId();
    const existing = await this.db.query(
      'SELECT student_id FROM students WHERE school_id = $1 LIMIT 1',
      [sid],
    );
    if (existing.length > 0) {
      this.logger.log('Students already seeded');
      return;
    }

    await this.db.query(
      `
      INSERT INTO students (school_id, student_code, admission_number, admission_date, admission_date_bs, admission_class_id,
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
      VALUES
        ($1, 'STU-2079-001', '2079-001', '2022-04-14', '2079-04-01', 1, 'Kiran', 'Kumar', 'Sharma', 'किरण', '', 'शर्मा', 'Kiran Sharma', 'MALE', '2016-03-15', '2072-12-02', 'Nepali', 'नेपाली', 'Hindu', 'हिन्दु', 'Nepali', 'नेपाली', 'Brahmin', 'ब्राह्मण', '01A', '', '', '', '', '', 1, 1, 1, 10, '', '', 0, 0, 0, 0, '', '', '', '', 1, 1, 'NONE', 'कुनै छैन', '', '', '', '', '', '', '', 1, 'ACTIVE', true, NOW(), NOW()),
        ($1, 'STU-2079-002', '2079-002', '2022-04-14', '2079-04-01', 1, 'Sunita', '', 'Khatri', 'सुनिता', '', 'खत्री', 'Sunita Khatri', 'FEMALE', '2016-05-20', '2072-12-08', 'Nepali', 'नेपाली', 'Hindu', 'हिन्दु', 'Nepali', 'नेपाली', 'Chhetri', 'क्षेत्री', '02B', '', '', '', '', '', 1, 1, 1, 10, '', '', 0, 0, 0, 0, '', '', '', '', 1, 1, 'NONE', 'कुनै छैन', '', '', '', '', '', '', '', 2, 'ACTIVE', true, NOW(), NOW()),
        ($1, 'STU-2079-003', '2079-003', '2022-04-14', '2079-04-01', 1, 'Raj', 'Kumar', 'Yadav', 'राज', '', 'यादव', 'Raj Yadav', 'MALE', '2016-07-10', '2073-03-23', 'Nepali', 'नेपाली', 'Hindu', 'हिन्दु', 'Maithili', 'मैथिली', 'Yadav', 'यादव', '03Y', '', '', '', '', '', 1, 1, 1, 10, '', '', 0, 0, 0, 0, '', '', '', '', 1, 1, 'NONE', 'कुनै छैन', '', '', '', '', '', '', '', 1, 'ACTIVE', true, NOW(), NOW()),
        ($1, 'STU-2079-004', '2079-004', '2022-04-14', '2079-04-01', 1, 'Anita', 'Devi', 'Chaudhary', 'अनिता', '', 'चौधरी', 'Anita Chaudhary', 'FEMALE', '2016-02-28', '2072-11-16', 'Nepali', 'नेपाली', 'Hindu', 'हिन्दु', 'Tharu', 'थारु', 'Tharu', 'थारु', '09T', '', '', '', '', '', 1, 1, 1, 10, '', '', 0, 0, 0, 0, '', '', '', '', 1, 1, 'NONE', 'कुनै छैन', '', '', '', '', '', '', '', 2, 'ACTIVE', true, NOW(), NOW()),
        ($1, 'STU-2079-005', '2079-005', '2022-04-14', '2079-04-01', 1, 'Niraj', '', 'Maharjan', 'निरज', '', 'महर्जन', 'Niraj Maharjan', 'MALE', '2015-11-05', '2072-07-18', 'Nepali', 'नेपाली', 'Buddhist', 'बौद्ध', 'Nepali', 'नेपाली', 'Newar', 'नेवार', '10N', '', '', '', '', '', 1, 1, 1, 10, '', '', 0, 0, 0, 0, '', '', '', '', 1, 1, 'NONE', 'कुनै छैन', '', '', '', '', '', '', '', 1, 'ACTIVE', true, NOW(), NOW()),
        ($1, 'STU-2079-006', '2079-006', '2022-04-14', '2079-04-01', 1, 'Sabina', '', 'Rai', 'सबिना', '', 'राई', 'Sabina Rai', 'FEMALE', '2015-08-12', '2072-04-28', 'Nepali', 'नेपाली', 'Christian', 'क्रिस्चियन', 'Nepali', 'नेपाली', 'Rai', 'राई', '06C', '', '', '', '', '', 1, 1, 1, 10, '', '', 0, 0, 0, 0, '', '', '', '', 1, 1, 'NONE', 'कुनै छैन', '', '', '', '', '', '', '', 2, 'ACTIVE', true, NOW(), NOW()),
        ($1, 'STU-2079-007', '2079-007', '2022-04-14', '2079-04-01', 1, 'Prakash', 'Bahadur', 'Thapa', 'प्रकाश', '', 'थापा', 'Prakash Thapa', 'MALE', '2015-04-22', '2071-12-09', 'Nepali', 'नेपाली', 'Hindu', 'हिन्दु', 'Nepali', 'नेपाली', 'Gurung', 'गुरुङ', '06E', '', '', '', '', '', 1, 1, 1, 10, '', '', 0, 0, 0, 0, '', '', '', '', 1, 1, 'NONE', 'कुनै छैन', '', '', '', '', '', '', '', 1, 'ACTIVE', true, NOW(), NOW()),
        ($1, 'STU-2079-008', '2079-008', '2022-04-14', '2079-04-01', 1, 'Maya', '', 'Lama', 'माया', '', 'लामा', 'Maya Lama', 'FEMALE', '2015-06-30', '2072-03-15', 'Nepali', 'नेपाली', 'Buddhist', 'बौद्ध', 'Nepali', 'नेपाली', 'Lama', 'लामा', '06G', '', '', '', '', '', 1, 1, 1, 10, '', '', 0, 0, 0, 0, '', '', '', '', 1, 1, 'NONE', 'कुनै छैन', '', '', '', '', '', '', '', 2, 'ACTIVE', true, NOW(), NOW()),
        ($1, 'STU-2079-009', '2079-009', '2022-04-14', '2079-04-01', 1, 'Santosh', 'Kumar', 'Mahato', 'सन्तोष', '', 'महतो', 'Santosh Mahato', 'MALE', '2014-09-18', '2071-05-01', 'Nepali', 'नेपाली', 'Hindu', 'हिन्दु', 'Maithili', 'मैथिली', 'Mahato', 'महतो', '03H', '', '', '', '', '', 1, 1, 1, 10, '', '', 0, 0, 0, 0, '', '', '', '', 1, 1, 'NONE', 'कुनै छैन', '', '', '', '', '', '', '', 1, 'ACTIVE', true, NOW(), NOW()),
        ($1, 'STU-2079-010', '2079-010', '2022-04-14', '2079-04-01', 1, 'Laxmi', '', 'Poudel', 'लक्ष्मी', '', 'पौडेल', 'Laxmi Poudel', 'FEMALE', '2014-12-25', '2071-08-10', 'Nepali', 'नेपाली', 'Hindu', 'हिन्दु', 'Nepali', 'नेपाली', 'Brahmin', 'ब्राह्मण', '01A', '', '', '', '', '', 1, 1, 1, 10, '', '', 0, 0, 0, 0, '', '', '', '', 1, 1, 'NONE', 'कुनै छैन', '', '', '', '', '', '', '', 2, 'ACTIVE', true, NOW(), NOW()),
        ($1, 'STU-2079-011', '2079-011', '2022-04-14', '2079-04-01', 1, 'Bibek', '', 'Shrestha', 'बिबेक', '', 'श्रेष्ठ', 'Bibek Shrestha', 'MALE', '2014-03-14', '2070-11-30', 'Nepali', 'नेपाली', 'Hindu', 'हिन्दु', 'Nepali', 'नेपाली', 'Newar', 'नेवार', '10N', '', '', '', '', '', 1, 1, 1, 10, '', '', 0, 0, 0, 0, '', '', '', '', 1, 1, 'NONE', 'कुनै छैन', '', '', '', '', '', '', '', 1, 'ACTIVE', true, NOW(), NOW()),
        ($1, 'STU-2079-012', '2079-012', '2022-04-14', '2079-04-01', 1, 'Sarita', 'Kumari', 'Basnet', 'सरिता', '', 'बस्नेत', 'Sarita Basnet', 'FEMALE', '2014-07-08', '2071-03-25', 'Nepali', 'नेपाली', 'Hindu', 'हिन्दु', 'Nepali', 'नेपाली', 'Chhetri', 'क्षेत्री', '02B', '', '', '', '', '', 1, 1, 1, 10, '', '', 0, 0, 0, 0, '', '', '', '', 1, 1, 'NONE', 'कुनै छैन', '', '', '', '', '', '', '', 2, 'ACTIVE', true, NOW(), NOW())
    `,
      [sid],
    );
    this.logger.log('Students seeded');
  }

  async seedGuardians() {
    const sid = await this.seedSchoolId();
    const existing = await this.db.query(
      'SELECT guardian_id FROM guardians WHERE school_id = $1 LIMIT 1',
      [sid],
    );
    if (existing.length > 0) {
      this.logger.log('Guardians already seeded');
      return;
    }

    await this.db.query(
      `
      INSERT INTO guardians (school_id, guardian_code, first_name_en, middle_name_en, last_name_en, mobile, email, occupation, relation_to_student, is_active, created_at)
      VALUES 
        ($1, 'GRD-SEED-01', 'Deepak', 'Kumar', 'Sharma', '9841001001', 'deepak@email.com', 'Business', 'FATHER', true, NOW()),
        ($1, 'GRD-SEED-02', 'Bikram', '', 'Khatri', '9841001002', 'bikram@email.com', 'Teacher', 'FATHER', true, NOW()),
        ($1, 'GRD-SEED-03', 'Ramesh', 'Bahadur', 'Yadav', '9841001003', 'ramesh@email.com', 'Farmer', 'FATHER', true, NOW()),
        ($1, 'GRD-SEED-04', 'Tilak', 'Ram', 'Chaudhary', '9841001004', 'tilak@email.com', 'Driver', 'FATHER', true, NOW()),
        ($1, 'GRD-SEED-05', 'Dinesh', '', 'Maharjan', '9841001005', 'dinesh@email.com', 'Engineer', 'FATHER', true, NOW()),
        ($1, 'GRD-SEED-06', 'Milan', 'Kumar', 'Rai', '9841001006', 'milan@email.com', 'Doctor', 'FATHER', true, NOW()),
        ($1, 'GRD-SEED-07', 'Gopal', 'Bahadur', 'Thapa', '9841001007', 'gopal@email.com', 'Police', 'FATHER', true, NOW()),
        ($1, 'GRD-SEED-08', 'Tenzin', '', 'Lama', '9841001008', 'tenzin@email.com', 'Monk', 'FATHER', true, NOW()),
        ($1, 'GRD-SEED-09', 'Shiv', 'Prasad', 'Mahato', '9841001009', 'shiv@email.com', 'Banker', 'FATHER', true, NOW()),
        ($1, 'GRD-SEED-10', 'Kedar', 'Nath', 'Poudel', '9841001010', 'kedar@email.com', 'Professor', 'FATHER', true, NOW()),
        ($1, 'GRD-SEED-11', 'Rajesh', 'Kumar', 'Shrestha', '9841001011', 'rajesh@email.com', 'Manager', 'FATHER', true, NOW()),
        ($1, 'GRD-SEED-12', 'Hom', 'Nath', 'Basnet', '9841001012', 'homenath@email.com', 'Contractor', 'FATHER', true, NOW())
    `,
      [sid],
    );
    this.logger.log('Guardians seeded');
  }

  async seedStudentGuardians() {
    const sid = await this.seedSchoolId();
    const existing = await this.db.query(
      'SELECT student_guardian_id FROM student_guardians WHERE student_id IN (SELECT student_id FROM students WHERE school_id = $1) LIMIT 1',
      [sid],
    );
    if (existing.length > 0) {
      this.logger.log('Student guardians already seeded');
      return;
    }

    // Pair i-th student with i-th guardian (no serial-id assumptions).
    const students = await this.db.query(
      `SELECT student_id FROM students WHERE school_id = $1 ORDER BY admission_number`,
      [sid],
    );
    const guardians = await this.db.query(
      `SELECT guardian_id FROM guardians WHERE school_id = $1 ORDER BY guardian_id`,
      [sid],
    );
    const pairs = students.slice(0, guardians.length);
    for (let i = 0; i < pairs.length; i++) {
      await this.db.query(
        `INSERT INTO student_guardians (student_id, guardian_id, relationship_type, is_primary, is_emergency_contact, is_active, created_at)
         VALUES ($1, $2, 'FATHER', true, true, true, NOW())
         ON CONFLICT (student_id, guardian_id) DO NOTHING`,
        [pairs[i].student_id, guardians[i].guardian_id],
      );
    }
    this.logger.log('Student guardians seeded');
  }

  async seedFees() {
    const sid = await this.seedSchoolId();
    const existing = await this.db.query(
      'SELECT fee_id FROM fees WHERE school_id = $1 LIMIT 1',
      [sid],
    );
    if (existing.length > 0) {
      this.logger.log('Fees already seeded');
      return;
    }

    // (admission_number, class_code, section_name, amount, discount, fine, total, status, invoice)
    const rows: Array<
      [string, string, string, number, number, number, number, string, string]
    > = [
      ['2079-001', '1', 'A', 12000, 0, 0, 12000, 'PAID', 'INV-2082-001'],
      ['2079-002', '1', 'A', 12000, 1200, 0, 10800, 'PAID', 'INV-2082-002'],
      ['2079-003', '1', 'B', 12000, 0, 0, 12000, 'PENDING', 'INV-2082-003'],
      ['2079-004', '1', 'B', 12000, 0, 500, 12500, 'PARTIAL', 'INV-2082-004'],
      ['2079-005', '2', 'A', 15000, 0, 0, 15000, 'PAID', 'INV-2082-005'],
      ['2079-006', '2', 'A', 15000, 1500, 0, 13500, 'PAID', 'INV-2082-006'],
      ['2079-007', '3', 'A', 18000, 0, 0, 18000, 'PAID', 'INV-2082-007'],
      ['2079-008', '3', 'A', 18000, 0, 0, 18000, 'PENDING', 'INV-2082-008'],
      ['2079-009', '4', 'A', 20000, 2000, 0, 18000, 'PAID', 'INV-2082-009'],
      ['2079-010', '4', 'A', 20000, 0, 0, 20000, 'PAID', 'INV-2082-010'],
      ['2079-011', '5', 'A', 22000, 0, 0, 22000, 'PAID', 'INV-2082-011'],
      ['2079-012', '5', 'A', 22000, 2200, 0, 19800, 'PAID', 'INV-2082-012'],
    ];
    for (const [
      adm,
      classCode,
      sectionName,
      amount,
      disc,
      fine,
      total,
      status,
      invoice,
    ] of rows) {
      const st = await this.db.query(
        `SELECT student_id FROM students WHERE school_id = $1 AND admission_number = $2 LIMIT 1`,
        [sid, adm],
      );
      const cl = await this.db.query(
        `SELECT class_id FROM classes WHERE school_id = $1 AND class_code = $2 LIMIT 1`,
        [sid, classCode],
      );
      if (st.length === 0 || cl.length === 0) {
        this.logger.warn(`Skipping fee ${invoice}: student or class missing`);
        continue;
      }
      const sec = await this.db.query(
        `SELECT section_id FROM sections WHERE class_id = $1 AND section_name = $2 LIMIT 1`,
        [cl[0].class_id, sectionName],
      );
      await this.db.query(
        `INSERT INTO fees (school_id, student_id, fee_type, amount, discount_amount, fine_amount, total_amount, due_date, status, academic_year, class_id, section_id, invoice_number, is_active, created_at, updated_at)
         VALUES ($1, $2, 'TUITION', $3, $4, $5, $6, '2082-04-01', $7, '2082', $8, $9, $10, true, NOW(), NOW())`,
        [
          sid,
          st[0].student_id,
          amount,
          disc,
          fine,
          total,
          status,
          cl[0].class_id,
          sec[0]?.section_id || null,
          invoice,
        ],
      );
    }
    this.logger.log('Fees seeded');
  }

  async seedPayments() {
    const sid = await this.seedSchoolId();
    const existing = await this.db.query(
      'SELECT payment_id FROM payments WHERE school_id = $1 LIMIT 1',
      [sid],
    );
    if (existing.length > 0) {
      this.logger.log('Payments already seeded');
      return;
    }

    // (invoice_number, amount, payment_date, method, txn, received_by, bank, remarks)
    const rows: Array<
      [string, number, string, string, string, number, string | null, string]
    > = [
      [
        'INV-2082-001',
        12000,
        '2082-01-15',
        'CASH',
        'TXN-001',
        1,
        null,
        'Full payment',
      ],
      [
        'INV-2082-002',
        10800,
        '2082-01-16',
        'BANK_TRANSFER',
        'TXN-002',
        1,
        'NMB Bank',
        'Full payment with discount',
      ],
      [
        'INV-2082-004',
        5000,
        '2082-01-20',
        'CASH',
        'TXN-003',
        5,
        null,
        'Partial payment',
      ],
      [
        'INV-2082-005',
        15000,
        '2082-01-18',
        'ESEWA',
        'TXN-004',
        5,
        null,
        'Full payment via e-sewa',
      ],
      [
        'INV-2082-006',
        13500,
        '2082-01-19',
        'BANK_TRANSFER',
        'TXN-005',
        5,
        'Siddhartha Bank',
        'Full payment with discount',
      ],
      [
        'INV-2082-007',
        18000,
        '2082-01-22',
        'CASH',
        'TXN-006',
        5,
        null,
        'Full payment',
      ],
      [
        'INV-2082-009',
        18000,
        '2082-01-25',
        'BANK_TRANSFER',
        'TXN-007',
        5,
        'Prabhu Bank',
        'Full payment with scholarship',
      ],
      [
        'INV-2082-010',
        20000,
        '2082-01-26',
        'CASH',
        'TXN-008',
        5,
        null,
        'Full payment',
      ],
      [
        'INV-2082-011',
        22000,
        '2082-01-28',
        'ESEWA',
        'TXN-009',
        5,
        null,
        'Full payment via e-sewa',
      ],
      [
        'INV-2082-012',
        19800,
        '2082-01-29',
        'BANK_TRANSFER',
        'TXN-010',
        5,
        'NIC Asia',
        'Full payment with sibling discount',
      ],
    ];
    for (const [
      invoice,
      amount,
      payDate,
      method,
      txn,
      receivedBy,
      bank,
      remarks,
    ] of rows) {
      const fee = await this.db.query(
        `SELECT fee_id, student_id FROM fees WHERE school_id = $1 AND invoice_number = $2 LIMIT 1`,
        [sid, invoice],
      );
      if (fee.length === 0) {
        this.logger.warn(`Skipping payment ${txn}: fee ${invoice} missing`);
        continue;
      }
      await this.db.query(
        `INSERT INTO payments (school_id, student_id, fee_id, amount, payment_date, payment_method, transaction_id, received_by, bank_name, remarks, is_verified, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW())`,
        [
          sid,
          fee[0].student_id,
          fee[0].fee_id,
          amount,
          payDate,
          method,
          txn,
          receivedBy,
          bank,
          remarks,
        ],
      );
    }
    this.logger.log('Payments seeded');
  }

  async seedAttendance() {
    const sid = await this.seedSchoolId();
    const existing = await this.db.query(
      'SELECT attendance_id FROM attendance WHERE school_id = $1 LIMIT 1',
      [sid],
    );
    if (existing.length > 0) {
      this.logger.log('Attendance already seeded');
      return;
    }

    const today = '2082-11-07';
    const status = [
      'PRESENT',
      'PRESENT',
      'PRESENT',
      'PRESENT',
      'PRESENT',
      'ABSENT',
      'PRESENT',
    ];
    const students = await this.db.query(
      `SELECT student_id FROM students WHERE school_id = $1 ORDER BY student_id LIMIT 12`,
      [sid],
    );
    for (let i = 0; i < students.length; i++) {
      const studentStatus = status[i % 7];
      await this.db.query(
        `
        INSERT INTO attendance (school_id, student_id, attendance_date, status, remarks, marked_by, created_at)
        VALUES ($1, $2, $3, $4, $5, 2, NOW())
      `,
        [
          sid,
          students[i].student_id,
          today,
          studentStatus,
          studentStatus === 'ABSENT' ? 'Sick leave' : null,
        ],
      );
    }
    this.logger.log('Attendance seeded');
  }

  async seedExams() {
    const sid = await this.seedSchoolId();
    const existing = await this.db.query(
      'SELECT exam_id FROM exams WHERE school_id = $1 LIMIT 1',
      [sid],
    );
    if (existing.length > 0) {
      this.logger.log('Exams already seeded');
      return;
    }

    // (name, type, class_code, start, end)
    const rows: Array<[string, string, string, string, string]> = [
      ['First Terminal', 'TERMINAL', '1', '2082-04-15', '2082-04-25'],
      ['First Terminal', 'TERMINAL', '2', '2082-04-15', '2082-04-25'],
      ['First Terminal', 'TERMINAL', '3', '2082-04-15', '2082-04-25'],
      ['Half Yearly', 'HALF_YEARLY', '1', '2082-08-01', '2082-08-15'],
      ['Half Yearly', 'HALF_YEARLY', '2', '2082-08-01', '2082-08-15'],
      ['Final', 'FINAL', '1', '2082-11-15', '2082-11-30'],
      ['Final', 'FINAL', '2', '2082-11-15', '2082-11-30'],
    ];
    for (const [name, type, classCode, start, end] of rows) {
      const cl = await this.db.query(
        `SELECT class_id FROM classes WHERE school_id = $1 AND class_code = $2 LIMIT 1`,
        [sid, classCode],
      );
      if (cl.length === 0) {
        this.logger.warn(`Skipping exam ${name}: class ${classCode} missing`);
        continue;
      }
      await this.db.query(
        `INSERT INTO exams (school_id, exam_name, exam_type, class_id, academic_year, start_date, end_date, is_active, created_at)
         VALUES ($1, $2, $3, $4, '2082', $5, $6, true, NOW())`,
        [sid, name, type, cl[0].class_id, start, end],
      );
    }
    this.logger.log('Exams seeded');
  }

  async seedMarks() {
    const sid = await this.seedSchoolId();
    const existing = await this.db.query(
      'SELECT mark_id FROM marks WHERE school_id = $1 LIMIT 1',
      [sid],
    );
    if (existing.length > 0) {
      this.logger.log('Marks already seeded');
      return;
    }

    const marksData = [
      {
        adm: '2079-001',
        examName: 'First Terminal',
        examType: 'TERMINAL',
        classCode: '1',
        subjectCode: 'ENG',
        theory: 85,
        practical: 12,
        total: 97,
      },
      {
        adm: '2079-001',
        examName: 'First Terminal',
        examType: 'TERMINAL',
        classCode: '1',
        subjectCode: 'NEP',
        theory: 78,
        practical: 10,
        total: 88,
      },
      {
        adm: '2079-001',
        examName: 'First Terminal',
        examType: 'TERMINAL',
        classCode: '1',
        subjectCode: 'MATH',
        theory: 92,
        practical: 15,
        total: 107,
      },
      {
        adm: '2079-002',
        examName: 'First Terminal',
        examType: 'TERMINAL',
        classCode: '1',
        subjectCode: 'ENG',
        theory: 90,
        practical: 14,
        total: 104,
      },
      {
        adm: '2079-002',
        examName: 'First Terminal',
        examType: 'TERMINAL',
        classCode: '1',
        subjectCode: 'NEP',
        theory: 88,
        practical: 12,
        total: 100,
      },
      {
        adm: '2079-002',
        examName: 'First Terminal',
        examType: 'TERMINAL',
        classCode: '1',
        subjectCode: 'MATH',
        theory: 75,
        practical: 12,
        total: 87,
      },
      {
        adm: '2079-003',
        examName: 'First Terminal',
        examType: 'TERMINAL',
        classCode: '1',
        subjectCode: 'ENG',
        theory: 70,
        practical: 10,
        total: 80,
      },
      {
        adm: '2079-003',
        examName: 'First Terminal',
        examType: 'TERMINAL',
        classCode: '1',
        subjectCode: 'NEP',
        theory: 65,
        practical: 8,
        total: 73,
      },
      {
        adm: '2079-004',
        examName: 'First Terminal',
        examType: 'TERMINAL',
        classCode: '1',
        subjectCode: 'ENG',
        theory: 95,
        practical: 15,
        total: 110,
      },
      {
        adm: '2079-004',
        examName: 'First Terminal',
        examType: 'TERMINAL',
        classCode: '1',
        subjectCode: 'MATH',
        theory: 88,
        practical: 14,
        total: 102,
      },
      {
        adm: '2079-005',
        examName: 'First Terminal',
        examType: 'TERMINAL',
        classCode: '2',
        subjectCode: 'ENG',
        theory: 82,
        practical: 12,
        total: 94,
      },
      {
        adm: '2079-006',
        examName: 'First Terminal',
        examType: 'TERMINAL',
        classCode: '2',
        subjectCode: 'ENG',
        theory: 78,
        practical: 10,
        total: 88,
      },
      {
        adm: '2079-007',
        examName: 'First Terminal',
        examType: 'TERMINAL',
        classCode: '3',
        subjectCode: 'ENG',
        theory: 88,
        practical: 14,
        total: 102,
      },
      {
        adm: '2079-008',
        examName: 'First Terminal',
        examType: 'TERMINAL',
        classCode: '3',
        subjectCode: 'ENG',
        theory: 75,
        practical: 10,
        total: 85,
      },
    ];

    const classCache = new Map<string, number>();
    const examCache = new Map<string, number>();
    const subjectCache = new Map<string, number>();
    const resolveClass = async (code: string): Promise<number | null> => {
      if (!classCache.has(code)) {
        const r = await this.db.query(
          `SELECT class_id FROM classes WHERE school_id = $1 AND class_code = $2 LIMIT 1`,
          [sid, code],
        );
        if (r.length === 0) return null;
        classCache.set(code, r[0].class_id);
      }
      return classCache.get(code)!;
    };
    for (const m of marksData) {
      const student = await this.db.query(
        `SELECT student_id FROM students WHERE school_id = $1 AND admission_number = $2 LIMIT 1`,
        [sid, m.adm],
      );
      const classId = await resolveClass(m.classCode);
      const examKey = `${m.examName}|${m.examType}|${m.classCode}`;
      if (!examCache.has(examKey)) {
        const r = await this.db.query(
          `SELECT exam_id FROM exams WHERE school_id = $1 AND exam_name = $2 AND exam_type = $3 AND class_id = $4 LIMIT 1`,
          [sid, m.examName, m.examType, classId],
        );
        if (r.length > 0) examCache.set(examKey, r[0].exam_id);
      }
      const subjKey = `${m.classCode}|${m.subjectCode}`;
      if (!subjectCache.has(subjKey) && classId) {
        const r = await this.db.query(
          `SELECT subject_id FROM subjects WHERE school_id = $1 AND class_id = $2 AND subject_code = $3 LIMIT 1`,
          [sid, classId, m.subjectCode],
        );
        if (r.length > 0) subjectCache.set(subjKey, r[0].subject_id);
      }
      if (
        student.length === 0 ||
        !classId ||
        !examCache.has(examKey) ||
        !subjectCache.has(subjKey)
      ) {
        this.logger.warn(`Skipping mark row for ${m.adm}: references missing`);
        continue;
      }
      const mark = {
        studentId: student[0].student_id,
        examId: examCache.get(examKey)!,
        subjectId: subjectCache.get(subjKey)!,
        classId,
        theory: m.theory,
        practical: m.practical,
        total: m.total,
      };
      const grade =
        m.total >= 90
          ? 'A+'
          : m.total >= 80
            ? 'A'
            : m.total >= 70
              ? 'B+'
              : m.total >= 60
                ? 'B'
                : m.total >= 50
                  ? 'C'
                  : 'D';
      await this.db.query(
        `
        INSERT INTO marks (school_id, student_id, exam_id, subject_id, class_id, section_id, academic_year, theory_marks, practical_marks, total_marks, grade, is_absent, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NULL, '2082', $6, $7, $8, $9, false, NOW(), NOW())
      `,
        [
          sid,
          mark.studentId,
          mark.examId,
          mark.subjectId,
          mark.classId,
          mark.theory,
          mark.practical,
          mark.total,
          grade,
        ],
      );
    }
    this.logger.log('Marks seeded');
  }

  async seedTeachers() {
    const sid = await this.seedSchoolId();
    const existing = await this.db.query(
      'SELECT teacher_id FROM teachers WHERE school_id = $1 LIMIT 1',
      [sid],
    );
    if (existing.length > 0) {
      this.logger.log('Teachers already seeded');
      return;
    }

    const teachers = [
      [
        'TCH001',
        'EMP001',
        'Ram',
        'Kumar',
        'Sharma',
        'राम',
        'शर्मा',
        'Male',
        '1985-05-15',
        '1985-05-15',
        'B+',
        'Nepali',
        'Hindu',
        'Masters in Education',
        'Science',
        'Tribhuvan University',
        2010,
        '9841000001',
        'ram.sharma@school.edu.np',
        '2015-01-01',
        'PERMANENT',
      ],
      [
        'TCH002',
        'EMP002',
        'Shyam',
        'Prasad',
        'Bhatta',
        'श्याम',
        'भट्ट',
        'Male',
        '1988-08-20',
        '1988-08-20',
        'A+',
        'Nepali',
        'Brahmin',
        'Masters in Nepali',
        'Nepali',
        'Tribhuvan University',
        2012,
        '9841000002',
        'shyam.bhatta@school.edu.np',
        '2016-03-15',
        'PERMANENT',
      ],
      [
        'TCH003',
        'EMP003',
        'Geeta',
        'Kumari',
        'Joshi',
        'गीता',
        'जोशी',
        'Female',
        '1990-03-10',
        '1990-03-10',
        'O+',
        'Nepali',
        'Chhetri',
        'Masters in Math',
        'Mathematics',
        'Tribhuvan University',
        2014,
        '9841000003',
        'geeta.joshi@school.edu.np',
        '2017-07-01',
        'PERMANENT',
      ],
      [
        'TCH004',
        'EMP004',
        'Hari',
        'Bahadur',
        'Thapa',
        'हरि',
        'थापा',
        'Male',
        '1982-11-25',
        '1982-11-25',
        'A+',
        'Nepali',
        'Gurung',
        'Masters in English',
        'English',
        'Tribhuvan University',
        2008,
        '9841000004',
        'hari.thapa@school.edu.np',
        '2010-04-01',
        'PERMANENT',
      ],
      [
        'TCH005',
        'EMP005',
        'Maya',
        'Devi',
        'Poudel',
        'माया',
        'पौडेल',
        'Female',
        '1992-07-18',
        '1992-07-18',
        'B+',
        'Nepali',
        'Brahmin',
        'Masters in Science',
        'Science',
        'Tribhuvan University',
        2016,
        '9841000005',
        'maya.poudel@school.edu.np',
        '2018-01-15',
        'PERMANENT',
      ],
      [
        'TCH006',
        'EMP006',
        'Niraj',
        'Kumar',
        'Maharjan',
        'निरज',
        'महर्जन',
        'Male',
        '1987-09-12',
        '1987-09-12',
        'A+',
        'Nepali',
        'Newar',
        'Masters in Social',
        'Social Studies',
        'Tribhuvan University',
        2011,
        '9841000006',
        'niraj.maharjan@school.edu.np',
        '2014-06-01',
        'PERMANENT',
      ],
      [
        'TCH007',
        'EMP007',
        'Sita',
        '',
        'Rai',
        'सिता',
        'राई',
        'Female',
        '1991-04-05',
        '1991-04-05',
        'O+',
        'Nepali',
        'Rai',
        'Masters in Education',
        'English',
        'Tribhuvan University',
        2015,
        '9841000007',
        'sita.rai@school.edu.np',
        '2019-02-01',
        'PERMANENT',
      ],
      [
        'TCH008',
        'EMP008',
        'Deepak',
        'Bahadur',
        'Chhetri',
        'दीपक',
        'छेत्री',
        'Male',
        '1984-12-30',
        '1984-12-30',
        'AB+',
        'Nepali',
        'Chhetri',
        'Masters in Math',
        'Mathematics',
        'Tribhuvan University',
        2009,
        '9841000008',
        'deepak.chhetri@school.edu.np',
        '2012-09-01',
        'PERMANENT',
      ],
      [
        'TCH009',
        'EMP009',
        'Anita',
        'Kumari',
        'Basnet',
        'अनिता',
        'बस्नेत',
        'Female',
        '1993-06-22',
        '1993-06-22',
        'B+',
        'Nepali',
        'Chhetri',
        'Masters in Nepali',
        'Nepali',
        'Tribhuvan University',
        2017,
        '9841000009',
        'anita.basnet@school.edu.np',
        '2020-01-10',
        'CONTRACT',
      ],
      [
        'TCH010',
        'EMP010',
        'Prakash',
        'Kumar',
        'Yadav',
        'प्रकाश',
        'यादव',
        'Male',
        '1989-02-14',
        '1989-02-14',
        'A+',
        'Nepali',
        'Yadav',
        'Masters in Science',
        'Science',
        'Tribhuvan University',
        2013,
        '9841000010',
        'prakash.yadav@school.edu.np',
        '2016-11-01',
        'PERMANENT',
      ],
    ];

    for (const t of teachers) {
      await this.db.query(
        `INSERT INTO teachers (school_id, teacher_code, employee_id, first_name_en, middle_name_en, last_name_en, first_name_np, last_name_np, gender, date_of_birth, date_of_birth_bs, blood_group, nationality, religion, highest_qualification, specialization, university_board, passing_year, personal_mobile, official_email, joining_date, employment_type, current_status, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, 'ACTIVE', true, NOW())`,
        [sid, ...t],
      );
    }
    this.logger.log('Teachers seeded');
  }
}
