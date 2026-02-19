import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from './database.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private db: DatabaseService) {}

  async onModuleInit() {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await this.seedAll();
    await this.resetAdminPassword();
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
      this.logger.log('Seed data completed successfully');
    } catch (error) {
      this.logger.error('Seed error: ' + error.message);
    }
  }

  async resetAdminPassword() {
    try {
      const passwordHash = await bcrypt.hash('Admin123!', 10);
      const result = await this.db.query(
        `UPDATE users SET password_hash = $1, password = $1 WHERE user_type = 'ADMIN' AND school_id = 1 RETURNING user_id`,
        [passwordHash],
      );
      if (result.length > 0) {
        this.logger.log('Admin password reset to: Admin123!');
      }
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
      await this.db.query(
        `INSERT INTO users (username, email, password, password_hash, full_name, phone, user_type, school_id, is_active, is_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $3, $4, $5, $6, $7, true, true, NOW(), NOW())`,
        u,
      );
    }
    this.logger.log('Users seeded');
  }

  async seedClasses() {
    const existing = await this.db.query(
      'SELECT class_id FROM classes WHERE school_id = 1 AND class_name = $1',
      ['Nursery'],
    );
    if (existing.length > 0) {
      this.logger.log('Classes already seeded');
      return;
    }

    await this.db.query(`
      INSERT INTO classes (school_id, class_name, class_code, class_order, education_level, is_active, created_at)
      VALUES 
        (1, 'Nursery', 'NUR', 0, 'PRE_PRIMARY', true, NOW()),
        (1, 'L.K.G', 'LKG', 1, 'PRE_PRIMARY', true, NOW()),
        (1, 'U.K.G', 'UKG', 2, 'PRE_PRIMARY', true, NOW()),
        (1, 'Class 1', '1', 3, 'PRIMARY', true, NOW()),
        (1, 'Class 2', '2', 4, 'PRIMARY', true, NOW()),
        (1, 'Class 3', '3', 5, 'PRIMARY', true, NOW()),
        (1, 'Class 4', '4', 6, 'PRIMARY', true, NOW()),
        (1, 'Class 5', '5', 7, 'PRIMARY', true, NOW()),
        (2, 'Nursery', 'NUR', 0, 'PRE_PRIMARY', true, NOW()),
        (2, 'L.K.G', 'LKG', 1, 'PRE_PRIMARY', true, NOW()),
        (2, 'U.K.G', 'UKG', 2, 'PRE_PRIMARY', true, NOW()),
        (2, 'Class 1', '1', 3, 'PRIMARY', true, NOW()),
        (2, 'Class 2', '2', 4, 'PRIMARY', true, NOW()),
        (3, 'Nursery', 'NUR', 0, 'PRE_PRIMARY', true, NOW()),
        (3, 'Class 1', '1', 1, 'PRIMARY', true, NOW())
    `);
    this.logger.log('Classes seeded');
  }

  async seedSections() {
    const existing = await this.db.query(
      'SELECT section_id FROM sections WHERE school_id = 1 LIMIT 1',
    );
    if (existing.length > 0) {
      this.logger.log('Sections already seeded');
      return;
    }

    await this.db.query(`
      INSERT INTO sections (school_id, class_id, section_name, section_code, section_order, is_active, created_at)
      VALUES 
        (1, 3, 'A', 'A', 1, true, NOW()),
        (1, 3, 'B', 'B', 2, true, NOW()),
        (1, 4, 'A', 'A', 1, true, NOW()),
        (1, 4, 'B', 'B', 2, true, NOW()),
        (1, 5, 'A', 'A', 1, true, NOW()),
        (1, 6, 'A', 'A', 1, true, NOW()),
        (1, 7, 'A', 'A', 1, true, NOW()),
        (1, 8, 'A', 'A', 1, true, NOW()),
        (2, 9, 'A', 'A', 1, true, NOW()),
        (2, 10, 'A', 'A', 1, true, NOW()),
        (2, 11, 'A', 'A', 1, true, NOW()),
        (3, 14, 'A', 'A', 1, true, NOW())
    `);
    this.logger.log('Sections seeded');
  }

  async seedSubjects() {
    const existing = await this.db.query(
      'SELECT subject_id FROM subjects WHERE school_id = 1 LIMIT 1',
    );
    if (existing.length > 0) {
      this.logger.log('Subjects already seeded');
      return;
    }

    await this.db.query(`
      INSERT INTO subjects (school_id, subject_name_en, subject_name_np, subject_code, subject_type, class_id, is_active, created_at)
      VALUES 
        (1, 'English', 'अंग्रेजी', 'ENG', 'CORE', 4, true, NOW()),
        (1, 'Nepali', 'नेपाली', 'NEP', 'CORE', 4, true, NOW()),
        (1, 'Mathematics', 'गणित', 'MATH', 'CORE', 4, true, NOW()),
        (1, 'Science', 'विज्ञान', 'SCI', 'CORE', 4, true, NOW()),
        (1, 'Social Studies', 'सामाजिक अध्ययन', 'SST', 'CORE', 4, true, NOW()),
        (1, 'English', 'अंग्रेजी', 'ENG', 'CORE', 5, true, NOW()),
        (1, 'Nepali', 'नेपाली', 'NEP', 'CORE', 5, true, NOW()),
        (1, 'Mathematics', 'गणित', 'MATH', 'CORE', 5, true, NOW()),
        (1, 'Science', 'विज्ञान', 'SCI', 'CORE', 5, true, NOW()),
        (1, 'Social Studies', 'सामाजिक अध्ययन', 'SST', 'CORE', 5, true, NOW()),
        (1, 'English', 'अंग्रेजी', 'ENG', 'CORE', 6, true, NOW()),
        (1, 'Nepali', 'नेपाली', 'NEP', 'CORE', 6, true, NOW()),
        (1, 'Mathematics', 'गणित', 'MATH', 'CORE', 6, true, NOW()),
        (1, 'Science', 'विज्ञान', 'SCI', 'CORE', 6, true, NOW()),
        (1, 'Social Studies', 'सामाजिक अध्ययन', 'SST', 'CORE', 6, true, NOW())
    `);
    this.logger.log('Subjects seeded');
  }

  async seedStudents() {
    const existing = await this.db.query(
      'SELECT student_id FROM students WHERE school_id = 1 LIMIT 1',
    );
    if (existing.length > 0) {
      this.logger.log('Students already seeded');
      return;
    }

    await this.db.query(`
      INSERT INTO students (school_id, admission_number, first_name_en, middle_name_en, last_name_en, first_name_np, last_name_np, gender, date_of_birth, date_of_birth_bs, nationality, ethnicity, religion, current_class_id, current_section_id, academic_year, roll_number, current_status, is_active, created_at, updated_at)
      VALUES 
        (1, '2079-001', 'Kiran', 'Kumar', 'Sharma', 'किरण', 'शर्मा', 'Male', '2016-03-15', '2072-12-02', 'Nepali', 'Brahmin', 'Hindu', 4, 3, '2082', 1, 'ACTIVE', true, NOW(), NOW()),
        (1, '2079-002', 'Sunita', '', 'Khatri', 'सुनिता', 'खत्री', 'Female', '2016-05-20', '2072-12-08', 'Nepali', 'Chhetri', 'Hindu', 4, 3, '2082', 2, 'ACTIVE', true, NOW(), NOW()),
        (1, '2079-003', 'Raj', 'Kumar', 'Yadav', 'राज', 'यादव', 'Male', '2016-07-10', '2073-03-23', 'Nepali', 'Yadav', 'Hindu', 4, 4, '2082', 1, 'ACTIVE', true, NOW(), NOW()),
        (1, '2079-004', 'Anita', 'Devi', 'Chaudhary', 'अनिता', 'चौधरी', 'Female', '2016-02-28', '2072-11-16', 'Nepali', 'Tharu', 'Hindu', 4, 4, '2082', 2, 'ACTIVE', true, NOW(), NOW()),
        (1, '2079-005', 'Niraj', '', 'Maharjan', 'निरज', 'महर्जन', 'Male', '2015-11-05', '2072-07-18', 'Nepali', 'Newar', 'Buddhist', 5, 5, '2082', 1, 'ACTIVE', true, NOW(), NOW()),
        (1, '2079-006', 'Sabina', '', 'Rai', 'सबिना', 'राई', 'Female', '2015-08-12', '2072-04-28', 'Nepali', 'Rai', 'Christian', 5, 5, '2082', 2, 'ACTIVE', true, NOW(), NOW()),
        (1, '2079-007', 'Prakash', 'Bahadur', 'Thapa', 'प्रकाश', 'थापा', 'Male', '2015-04-22', '2071-12-09', 'Nepali', 'Gurung', 'Hindu', 6, 6, '2082', 1, 'ACTIVE', true, NOW(), NOW()),
        (1, '2079-008', 'Maya', '', 'Lama', 'माया', 'लामा', 'Female', '2015-06-30', '2072-03-15', 'Nepali', 'Lama', 'Buddhist', 6, 6, '2082', 2, 'ACTIVE', true, NOW(), NOW()),
        (1, '2079-009', 'Santosh', 'Kumar', 'Mahato', 'सन्तोष', 'महतो', 'Male', '2014-09-18', '2071-05-01', 'Nepali', 'Mahato', 'Hindu', 7, 7, '2082', 1, 'ACTIVE', true, NOW(), NOW()),
        (1, '2079-010', 'Laxmi', '', 'Poudel', 'लक्ष्मी', 'पौडेल', 'Female', '2014-12-25', '2071-08-10', 'Nepali', 'Brahmin', 'Hindu', 7, 7, '2082', 2, 'ACTIVE', true, NOW(), NOW()),
        (1, '2079-011', 'Bibek', '', 'Shrestha', 'बिबेक', 'श्रेष्ठ', 'Male', '2014-03-14', '2070-11-30', 'Nepali', 'Newar', 'Hindu', 8, 8, '2082', 1, 'ACTIVE', true, NOW(), NOW()),
        (1, '2079-012', 'Sarita', 'Kumari', 'Basnet', 'सरिता', 'बस्नेत', 'Female', '2014-07-08', '2071-03-25', 'Nepali', 'Chhetri', 'Hindu', 8, 8, '2082', 2, 'ACTIVE', true, NOW(), NOW())
    `);
    this.logger.log('Students seeded');
  }

  async seedGuardians() {
    const existing = await this.db.query(
      'SELECT guardian_id FROM guardians WHERE school_id = 1 LIMIT 1',
    );
    if (existing.length > 0) {
      this.logger.log('Guardians already seeded');
      return;
    }

    await this.db.query(`
      INSERT INTO guardians (school_id, first_name, middle_name, last_name, phone, email, occupation, relationship, is_active, created_at)
      VALUES 
        (1, 'Deepak', 'Kumar', 'Sharma', '9841001001', 'deepak@email.com', 'Business', 'Father', true, NOW()),
        (1, 'Bikram', '', 'Khatri', '9841001002', 'bikram@email.com', 'Teacher', 'Father', true, NOW()),
        (1, 'Ramesh', 'Bahadur', 'Yadav', '9841001003', 'ramesh@email.com', 'Farmer', 'Father', true, NOW()),
        (1, 'Tilak', 'Ram', 'Chaudhary', '9841001004', 'tilak@email.com', 'Driver', 'Father', true, NOW()),
        (1, 'Dinesh', '', 'Maharjan', '9841001005', 'dinesh@email.com', 'Engineer', 'Father', true, NOW()),
        (1, 'Milan', 'Kumar', 'Rai', '9841001006', 'milan@email.com', 'Doctor', 'Father', true, NOW()),
        (1, 'Gopal', 'Bahadur', 'Thapa', '9841001007', 'gopal@email.com', 'Police', 'Father', true, NOW()),
        (1, 'Tenzin', '', 'Lama', '9841001008', 'tenzin@email.com', 'Monk', 'Father', true, NOW()),
        (1, 'Shiv', 'Prasad', 'Mahato', '9841001009', 'shiv@email.com', 'Banker', 'Father', true, NOW()),
        (1, 'Kedar', 'Nath', 'Poudel', '9841001010', 'kedar@email.com', 'Professor', 'Father', true, NOW()),
        (1, 'Rajesh', 'Kumar', 'Shrestha', '9841001011', 'rajesh@email.com', 'Manager', 'Father', true, NOW()),
        (1, 'Hom', 'Nath', 'Basnet', '9841001012', 'homenath@email.com', 'Contractor', 'Father', true, NOW())
    `);
    this.logger.log('Guardians seeded');
  }

  async seedStudentGuardians() {
    const existing = await this.db.query(
      'SELECT student_guardian_id FROM student_guardians LIMIT 1',
    );
    if (existing.length > 0) {
      this.logger.log('Student guardians already seeded');
      return;
    }

    await this.db.query(`
      INSERT INTO student_guardians (student_id, guardian_id, relationship_type, is_primary, is_emergency_contact, is_active, created_at)
      VALUES 
        (1, 1, 'FATHER', true, true, true, NOW()),
        (2, 2, 'FATHER', true, true, true, NOW()),
        (3, 3, 'FATHER', true, true, true, NOW()),
        (4, 4, 'FATHER', true, true, true, NOW()),
        (5, 5, 'FATHER', true, true, true, NOW()),
        (6, 6, 'FATHER', true, true, true, NOW()),
        (7, 7, 'FATHER', true, true, true, NOW()),
        (8, 8, 'FATHER', true, true, true, NOW()),
        (9, 9, 'FATHER', true, true, true, NOW()),
        (10, 10, 'FATHER', true, true, true, NOW()),
        (11, 11, 'FATHER', true, true, true, NOW()),
        (12, 12, 'FATHER', true, true, true, NOW())
    `);
    this.logger.log('Student guardians seeded');
  }

  async seedFees() {
    const existing = await this.db.query(
      'SELECT fee_id FROM fees WHERE school_id = 1 LIMIT 1',
    );
    if (existing.length > 0) {
      this.logger.log('Fees already seeded');
      return;
    }

    await this.db.query(`
      INSERT INTO fees (school_id, student_id, fee_type, amount, discount_amount, fine_amount, total_amount, due_date, status, academic_year, class_id, section_id, invoice_number, is_active, created_at, updated_at)
      VALUES 
        (1, 1, 'TUITION', 12000, 0, 0, 12000, '2082-04-01', 'PAID', '2082', 4, 3, 'INV-2082-001', true, NOW(), NOW()),
        (1, 2, 'TUITION', 12000, 1200, 0, 10800, '2082-04-01', 'PAID', '2082', 4, 3, 'INV-2082-002', true, NOW(), NOW()),
        (1, 3, 'TUITION', 12000, 0, 0, 12000, '2082-04-01', 'PENDING', '2082', 4, 4, 'INV-2082-003', true, NOW(), NOW()),
        (1, 4, 'TUITION', 12000, 0, 500, 12500, '2082-04-01', 'PARTIAL', '2082', 4, 4, 'INV-2082-004', true, NOW(), NOW()),
        (1, 5, 'TUITION', 15000, 0, 0, 15000, '2082-04-01', 'PAID', '2082', 5, 5, 'INV-2082-005', true, NOW(), NOW()),
        (1, 6, 'TUITION', 15000, 1500, 0, 13500, '2082-04-01', 'PAID', '2082', 5, 5, 'INV-2082-006', true, NOW(), NOW()),
        (1, 7, 'TUITION', 18000, 0, 0, 18000, '2082-04-01', 'PAID', '2082', 6, 6, 'INV-2082-007', true, NOW(), NOW()),
        (1, 8, 'TUITION', 18000, 0, 0, 18000, '2082-04-01', 'PENDING', '2082', 6, 6, 'INV-2082-008', true, NOW(), NOW()),
        (1, 9, 'TUITION', 20000, 2000, 0, 18000, '2082-04-01', 'PAID', '2082', 7, 7, 'INV-2082-009', true, NOW(), NOW()),
        (1, 10, 'TUITION', 20000, 0, 0, 20000, '2082-04-01', 'PAID', '2082', 7, 7, 'INV-2082-010', true, NOW(), NOW()),
        (1, 11, 'TUITION', 22000, 0, 0, 22000, '2082-04-01', 'PAID', '2082', 8, 8, 'INV-2082-011', true, NOW(), NOW()),
        (1, 12, 'TUITION', 22000, 2200, 0, 19800, '2082-04-01', 'PAID', '2082', 8, 8, 'INV-2082-012', true, NOW(), NOW())
    `);
    this.logger.log('Fees seeded');
  }

  async seedPayments() {
    const existing = await this.db.query(
      'SELECT payment_id FROM payments WHERE school_id = 1 LIMIT 1',
    );
    if (existing.length > 0) {
      this.logger.log('Payments already seeded');
      return;
    }

    await this.db.query(`
      INSERT INTO payments (school_id, student_id, fee_id, amount, payment_date, payment_method, transaction_id, received_by, bank_name, remarks, is_verified, created_at)
      VALUES 
        (1, 1, 1, 12000, '2082-01-15', 'CASH', 'TXN-001', 1, NULL, 'Full payment', true, NOW()),
        (1, 2, 2, 10800, '2082-01-16', 'BANK_TRANSFER', 'TXN-002', 1, 'NMB Bank', 'Full payment with discount', true, NOW()),
        (1, 4, 4, 5000, '2082-01-20', 'CASH', 'TXN-003', 5, NULL, 'Partial payment', true, NOW()),
        (1, 5, 5, 15000, '2082-01-18', 'ESEWA', 'TXN-004', 5, NULL, 'Full payment via e-sewa', true, NOW()),
        (1, 6, 6, 13500, '2082-01-19', 'BANK_TRANSFER', 'TXN-005', 5, 'Siddhartha Bank', 'Full payment with discount', true, NOW()),
        (1, 7, 7, 18000, '2082-01-22', 'CASH', 'TXN-006', 5, NULL, 'Full payment', true, NOW()),
        (1, 9, 9, 18000, '2082-01-25', 'BANK_TRANSFER', 'TXN-007', 5, 'Prabhu Bank', 'Full payment with scholarship', true, NOW()),
        (1, 10, 10, 20000, '2082-01-26', 'CASH', 'TXN-008', 5, NULL, 'Full payment', true, NOW()),
        (1, 11, 11, 22000, '2082-01-28', 'ESEWA', 'TXN-009', 5, NULL, 'Full payment via e-sewa', true, NOW()),
        (1, 12, 12, 19800, '2082-01-29', 'BANK_TRANSFER', 'TXN-010', 5, 'NIC Asia', 'Full payment with sibling discount', true, NOW())
    `);
    this.logger.log('Payments seeded');
  }

  async seedAttendance() {
    const existing = await this.db.query(
      'SELECT attendance_id FROM attendance WHERE school_id = 1 LIMIT 1',
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

    for (let studentId = 1; studentId <= 12; studentId++) {
      const studentStatus = status[studentId % 7];
      await this.db.query(
        `
        INSERT INTO attendance (school_id, student_id, attendance_date, status, remarks, marked_by, created_at)
        VALUES (1, $1, $2, $3, $4, 2, NOW())
      `,
        [
          studentId,
          today,
          studentStatus,
          studentStatus === 'ABSENT' ? 'Sick leave' : null,
        ],
      );
    }
    this.logger.log('Attendance seeded');
  }

  async seedExams() {
    const existing = await this.db.query(
      'SELECT exam_id FROM exams WHERE school_id = 1 LIMIT 1',
    );
    if (existing.length > 0) {
      this.logger.log('Exams already seeded');
      return;
    }

    await this.db.query(`
      INSERT INTO exams (school_id, exam_name, exam_type, class_id, academic_year, start_date, end_date, is_active, created_at)
      VALUES 
        (1, 'First Terminal', 'TERMINAL', 4, '2082', '2082-04-15', '2082-04-25', true, NOW()),
        (1, 'First Terminal', 'TERMINAL', 5, '2082', '2082-04-15', '2082-04-25', true, NOW()),
        (1, 'First Terminal', 'TERMINAL', 6, '2082', '2082-04-15', '2082-04-25', true, NOW()),
        (1, 'Half Yearly', 'HALF_YEARLY', 4, '2082', '2082-08-01', '2082-08-15', true, NOW()),
        (1, 'Half Yearly', 'HALF_YEARLY', 5, '2082', '2082-08-01', '2082-08-15', true, NOW()),
        (1, 'Final', 'FINAL', 4, '2082', '2082-11-15', '2082-11-30', true, NOW()),
        (1, 'Final', 'FINAL', 5, '2082', '2082-11-15', '2082-11-30', true, NOW())
    `);
    this.logger.log('Exams seeded');
  }

  async seedMarks() {
    const existing = await this.db.query(
      'SELECT mark_id FROM marks WHERE school_id = 1 LIMIT 1',
    );
    if (existing.length > 0) {
      this.logger.log('Marks already seeded');
      return;
    }

    const marksData = [
      {
        studentId: 1,
        examId: 1,
        subjectId: 1,
        classId: 4,
        theory: 85,
        practical: 12,
        total: 97,
      },
      {
        studentId: 1,
        examId: 1,
        subjectId: 2,
        classId: 4,
        theory: 78,
        practical: 10,
        total: 88,
      },
      {
        studentId: 1,
        examId: 1,
        subjectId: 3,
        classId: 4,
        theory: 92,
        practical: 15,
        total: 107,
      },
      {
        studentId: 2,
        examId: 1,
        subjectId: 1,
        classId: 4,
        theory: 90,
        practical: 14,
        total: 104,
      },
      {
        studentId: 2,
        examId: 1,
        subjectId: 2,
        classId: 4,
        theory: 88,
        practical: 12,
        total: 100,
      },
      {
        studentId: 2,
        examId: 1,
        subjectId: 3,
        classId: 4,
        theory: 75,
        practical: 12,
        total: 87,
      },
      {
        studentId: 3,
        examId: 1,
        subjectId: 1,
        classId: 4,
        theory: 70,
        practical: 10,
        total: 80,
      },
      {
        studentId: 3,
        examId: 1,
        subjectId: 2,
        classId: 4,
        theory: 65,
        practical: 8,
        total: 73,
      },
      {
        studentId: 4,
        examId: 1,
        subjectId: 1,
        classId: 4,
        theory: 95,
        practical: 15,
        total: 110,
      },
      {
        studentId: 4,
        examId: 1,
        subjectId: 3,
        classId: 4,
        theory: 88,
        practical: 14,
        total: 102,
      },
      {
        studentId: 5,
        examId: 2,
        subjectId: 6,
        classId: 5,
        theory: 82,
        practical: 12,
        total: 94,
      },
      {
        studentId: 6,
        examId: 2,
        subjectId: 6,
        classId: 5,
        theory: 78,
        practical: 10,
        total: 88,
      },
      {
        studentId: 7,
        examId: 3,
        subjectId: 11,
        classId: 6,
        theory: 88,
        practical: 14,
        total: 102,
      },
      {
        studentId: 8,
        examId: 3,
        subjectId: 11,
        classId: 6,
        theory: 75,
        practical: 10,
        total: 85,
      },
    ];

    for (const m of marksData) {
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
        VALUES (1, $1, $2, $3, $4, NULL, '2082', $5, $6, $7, $8, false, NOW(), NOW())
      `,
        [
          m.studentId,
          m.examId,
          m.subjectId,
          m.classId,
          m.theory,
          m.practical,
          m.total,
          grade,
        ],
      );
    }
    this.logger.log('Marks seeded');
  }
}
