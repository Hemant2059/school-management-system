import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { Pool, PoolConfig, PoolClient } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;
  private schemaInitialized = false;

  constructor() {
    const config: PoolConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_NAME || 'sms_nepal',
      schema: process.env.DB_SCHEMA || 'public',
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      min: parseInt(process.env.DB_POOL_MIN || '5', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

    if (process.env.NODE_ENV === 'production') {
      config.ssl = { rejectUnauthorized: false };
    }

    this.pool = new Pool(config);

    this.pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }

  async onModuleInit() {
    if (!this.schemaInitialized) {
      await this.initSchema();
    }
  }

  private async initSchema() {
    if (this.schemaInitialized) {
      return;
    }

    try {
      const shouldReset = process.env.DB_RESET === 'true';

      if (shouldReset) {
        this.logger.log('Resetting database schema (DB_RESET=true)...');
        await this.pool.query(`
          DROP TABLE IF EXISTS user_sessions CASCADE;
          DROP TABLE IF EXISTS student_guardians CASCADE;
          DROP TABLE IF EXISTS guardians CASCADE;
          DROP TABLE IF EXISTS marks CASCADE;
          DROP TABLE IF EXISTS exams CASCADE;
          DROP TABLE IF EXISTS attendance CASCADE;
          DROP TABLE IF EXISTS payments CASCADE;
          DROP TABLE IF EXISTS fees CASCADE;
          DROP TABLE IF EXISTS students CASCADE;
          DROP TABLE IF EXISTS subjects CASCADE;
          DROP TABLE IF EXISTS sections CASCADE;
          DROP TABLE IF EXISTS classes CASCADE;
          DROP TABLE IF EXISTS users CASCADE;
          DROP TABLE IF EXISTS schools CASCADE;
        `);
      }

      this.logger.log('Ensuring database schema...');

      await this.pool.query(`
        -- Schools
        CREATE TABLE IF NOT EXISTS schools (
          school_id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL, address TEXT, phone VARCHAR(20), email VARCHAR(255),
          logo_url VARCHAR(500), established_year INTEGER,
          is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Users
        CREATE TABLE IF NOT EXISTS users (
          user_id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, 
          password VARCHAR(255) NOT NULL, password_hash VARCHAR(255),
          full_name VARCHAR(100), phone VARCHAR(20), user_type VARCHAR(20) NOT NULL,
          school_id INTEGER REFERENCES schools(school_id),
          is_active BOOLEAN DEFAULT true, is_verified BOOLEAN DEFAULT false, is_system BOOLEAN DEFAULT false,
          last_login_at TIMESTAMP, last_login_ip VARCHAR(45), 
          failed_login_attempts INTEGER DEFAULT 0, locked_until TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, deleted_at TIMESTAMP
        );

        -- User Sessions
        CREATE TABLE IF NOT EXISTS user_sessions (
          session_id VARCHAR(100) PRIMARY KEY, 
          user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
          school_id INTEGER REFERENCES schools(school_id),
          refresh_token_hash VARCHAR(500), 
          ip_address VARCHAR(45), user_agent TEXT,
          device_name VARCHAR(100), last_active_at TIMESTAMP,
          expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Classes
        CREATE TABLE IF NOT EXISTS classes (
          class_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          class_name VARCHAR(50) NOT NULL, class_code VARCHAR(20), class_order INTEGER,
          education_level VARCHAR(50), is_active BOOLEAN DEFAULT true, 
          min_age INTEGER, max_age INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Sections
        CREATE TABLE IF NOT EXISTS sections (
          section_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          class_id INTEGER REFERENCES classes(class_id), section_name VARCHAR(20) NOT NULL, section_code VARCHAR(20),
          section_order INTEGER, capacity INTEGER DEFAULT 30, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Subjects
        CREATE TABLE IF NOT EXISTS subjects (
          subject_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          subject_name_en VARCHAR(100) NOT NULL, subject_name_np VARCHAR(100),
          subject_code VARCHAR(20), subject_type VARCHAR(20), subject_group VARCHAR(50),
          credit_hours INTEGER DEFAULT 0, class_id INTEGER REFERENCES classes(class_id),
          is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          subject_name VARCHAR(100), subject_name_nepali VARCHAR(100)
        );

        -- Students
        CREATE TABLE IF NOT EXISTS students (
          student_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          student_code VARCHAR(50), admission_number VARCHAR(50) UNIQUE NOT NULL,
          admission_date DATE, admission_class_id INTEGER,
          first_name_en VARCHAR(100) NOT NULL, middle_name_en VARCHAR(100), last_name_en VARCHAR(100),
          first_name_np VARCHAR(100), middle_name_np VARCHAR(100), last_name_np VARCHAR(100),
          display_name VARCHAR(255),
          gender VARCHAR(10), date_of_birth DATE, date_of_birth_ad DATE, date_of_birth_bs VARCHAR(20), dob_bs_snapshot VARCHAR(20),
          birthplace VARCHAR(100), nationality VARCHAR(50), ethnicity VARCHAR(50), religion VARCHAR(50),
          current_class_id INTEGER REFERENCES classes(class_id), current_section_id INTEGER REFERENCES sections(section_id),
          academic_year VARCHAR(10), roll_number INTEGER, current_status VARCHAR(20) DEFAULT 'ACTIVE',
          is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          student_email VARCHAR(100), student_mobile VARCHAR(20),
          is_govt_mandated_free_seat BOOLEAN DEFAULT false, is_economically_disadvantaged BOOLEAN DEFAULT false,
          caste_ethnicity_code VARCHAR(20), caste_ethnicity VARCHAR(50),
          citizenship_number VARCHAR(50), birth_certificate_number VARCHAR(50),
          blood_group VARCHAR(10), mother_tongue VARCHAR(50),
          permanent_province_id INTEGER, permanent_district_id INTEGER, permanent_municipality_id INTEGER, permanent_ward_no INTEGER,
          permanent_tole_en VARCHAR(255), permanent_tole_np VARCHAR(255),
          temporary_province_id INTEGER, temporary_district_id INTEGER, temporary_municipality_id INTEGER, temporary_ward_no INTEGER,
          temporary_tole_en VARCHAR(255), temporary_address_en VARCHAR(255), temporary_tole_np VARCHAR(255), temporary_address_np VARCHAR(255),
          created_by INTEGER, updated_by INTEGER
        );

        -- Guardians
        CREATE TABLE IF NOT EXISTS guardians (
          guardian_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          guardian_code VARCHAR(50),
          first_name VARCHAR(100) NOT NULL, middle_name VARCHAR(100), last_name VARCHAR(100),
          first_name_en VARCHAR(100), middle_name_en VARCHAR(100), last_name_en VARCHAR(100),
          first_name_np VARCHAR(100), middle_name_np VARCHAR(100), last_name_np VARCHAR(100),
          display_name VARCHAR(200),
          relation_to_student VARCHAR(50), occupation VARCHAR(100), education_level VARCHAR(100),
          mobile VARCHAR(20), alternate_mobile VARCHAR(20), email VARCHAR(255),
          annual_income DECIMAL(10,2),
          phone VARCHAR(20), relationship VARCHAR(50), 
          is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Student Guardians
        CREATE TABLE IF NOT EXISTS student_guardians (
          student_guardian_id SERIAL PRIMARY KEY,
          student_id INTEGER REFERENCES students(student_id), guardian_id INTEGER REFERENCES guardians(guardian_id),
          relationship_type VARCHAR(20) NOT NULL, is_primary BOOLEAN DEFAULT false,
          is_emergency_contact BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Fees
        CREATE TABLE IF NOT EXISTS fees (
          fee_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          student_id INTEGER REFERENCES students(student_id), fee_type VARCHAR(50) NOT NULL,
          amount DECIMAL(10,2) NOT NULL, discount_amount DECIMAL(10,2), fine_amount DECIMAL(10,2),
          total_amount DECIMAL(10,2), due_date DATE, status VARCHAR(20) DEFAULT 'pending',
          academic_year VARCHAR(10), class_id INTEGER, section_id INTEGER, invoice_number VARCHAR(50),
          is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Payments
        CREATE TABLE IF NOT EXISTS payments (
          payment_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          student_id INTEGER REFERENCES students(student_id), fee_id INTEGER REFERENCES fees(fee_id),
          invoice_id VARCHAR(50),
          amount DECIMAL(10,2) NOT NULL, payment_date DATE, payment_date_bs VARCHAR(20),
          payment_method VARCHAR(50), transaction_id VARCHAR(100), transaction_uuid VARCHAR(100),
          gateway_name VARCHAR(50), received_by INTEGER, bank_name VARCHAR(100), branch_name VARCHAR(100),
          cheque_number VARCHAR(50), cheque_date DATE, reference_number VARCHAR(100),
          remarks TEXT, idempotency_key VARCHAR(100), is_verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Attendance
        CREATE TABLE IF NOT EXISTS attendance (
          attendance_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          student_id INTEGER REFERENCES students(student_id), attendance_date DATE NOT NULL,
          status VARCHAR(20) NOT NULL, remarks TEXT, marked_by INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Exams
        CREATE TABLE IF NOT EXISTS exams (
          exam_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          exam_name VARCHAR(100) NOT NULL, exam_code VARCHAR(50), exam_type VARCHAR(50),
          class_id INTEGER REFERENCES classes(class_id), section_id INTEGER, subject_id INTEGER,
          exam_date DATE, exam_date_bs VARCHAR(20),
          start_time TIME, end_time TIME,
          full_marks INTEGER, pass_marks INTEGER,
          academic_year VARCHAR(10), start_date DATE, end_date DATE,
          is_published BOOLEAN DEFAULT false, is_result_published BOOLEAN DEFAULT false, is_locked BOOLEAN DEFAULT false,
          remarks TEXT, is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Attendance
        CREATE TABLE IF NOT EXISTS attendance (
          attendance_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          student_id INTEGER REFERENCES students(student_id), class_id INTEGER, section_id INTEGER,
          attendance_date DATE NOT NULL, attendance_date_bs VARCHAR(20),
          status VARCHAR(20) NOT NULL, session VARCHAR(20) DEFAULT 'FULL_DAY',
          remarks TEXT, marked_by INTEGER,
          academic_year VARCHAR(10),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP, created_by INTEGER, updated_by INTEGER
        );

        -- Marks
        CREATE TABLE IF NOT EXISTS marks (
          mark_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          student_id INTEGER REFERENCES students(student_id), exam_id INTEGER REFERENCES exams(exam_id),
          subject_id INTEGER REFERENCES subjects(subject_id), class_id INTEGER, section_id INTEGER,
          academic_year VARCHAR(10), theory_marks DECIMAL(5,2), practical_marks DECIMAL(5,2),
          total_marks DECIMAL(5,2), grade VARCHAR(5), is_absent BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Teachers
        CREATE TABLE IF NOT EXISTS teachers (
          teacher_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          school_id BIGINT NOT NULL REFERENCES schools(school_id),
          teacher_code VARCHAR(50) NOT NULL, employee_id VARCHAR(50) NOT NULL,
          first_name_en VARCHAR(100) NOT NULL, middle_name_en VARCHAR(100), last_name_en VARCHAR(100) NOT NULL,
          first_name_np VARCHAR(150), middle_name_np VARCHAR(150), last_name_np VARCHAR(150),
          display_name VARCHAR(255), teacher_name_en VARCHAR(255), teacher_name_np VARCHAR(255),
          date_of_birth DATE, date_of_birth_bs VARCHAR(10),
          gender VARCHAR(20) NOT NULL, blood_group VARCHAR(10),
          nationality VARCHAR(50), religion VARCHAR(50),
          highest_qualification VARCHAR(200), specialization VARCHAR(200),
          university_board VARCHAR(255), passing_year INTEGER,
          teaching_license_number VARCHAR(100), license_expiry_date DATE,
          personal_mobile VARCHAR(20), official_mobile VARCHAR(20),
          personal_email VARCHAR(100), official_email VARCHAR(100),
          joining_date DATE, joining_date_bs VARCHAR(10),
          employment_type VARCHAR(50), department VARCHAR(100), designation VARCHAR(100),
          current_status VARCHAR(20) DEFAULT 'ACTIVE', is_active BOOLEAN DEFAULT true,
          citizenship_number VARCHAR(50), citizenship_issue_district VARCHAR(100),
          citizenship_issue_date DATE, citizenship_issue_date_bs VARCHAR(20),
          pan_number VARCHAR(50), ssf_number VARCHAR(50),
          bank_name VARCHAR(100), bank_account_number VARCHAR(50), bank_branch VARCHAR(100),
          emergency_contact_name VARCHAR(100), emergency_contact_phone VARCHAR(20), emergency_contact_relation VARCHAR(50),
          caste_ethnicity_code VARCHAR(20), caste_ethnicity_name VARCHAR(100),
          marital_status VARCHAR(20), profile_photo_url VARCHAR(500),
          permanent_province_id INTEGER, permanent_district_id INTEGER, permanent_municipality_id INTEGER, permanent_ward_no INTEGER,
          permanent_tole_en VARCHAR(200), permanent_address_en TEXT, permanent_tole_np VARCHAR(200), permanent_address_np TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, deleted_at TIMESTAMP
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
        CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id);
        CREATE INDEX IF NOT EXISTS idx_sections_school ON sections(school_id);
        CREATE INDEX IF NOT EXISTS idx_subjects_school ON subjects(school_id);
        CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id);
        CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
        CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
        CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
        CREATE INDEX IF NOT EXISTS idx_teachers_school ON teachers(school_id);
        CREATE INDEX IF NOT EXISTS idx_teachers_employee ON teachers(employee_id);

        -- Hostels
        CREATE TABLE IF NOT EXISTS hostels (
          hostel_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          name VARCHAR(100) NOT NULL, type VARCHAR(50), total_beds INTEGER,
          available_beds INTEGER, occupancy INTEGER, warden_name VARCHAR(100),
          warden_contact VARCHAR(20), address TEXT, ward_number INTEGER,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Hostel Rooms
        CREATE TABLE IF NOT EXISTS hostel_rooms (
          room_id SERIAL PRIMARY KEY, hostel_id INTEGER REFERENCES hostels(hostel_id),
          room_number VARCHAR(20) NOT NULL, floor VARCHAR(20), capacity INTEGER,
          available_beds INTEGER, room_type VARCHAR(50), price DECIMAL(10,2),
          is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Hostel Students
        CREATE TABLE IF NOT EXISTS hostel_students (
          id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          hostel_id INTEGER REFERENCES hostels(hostel_id), room_id INTEGER REFERENCES hostel_rooms(room_id),
          student_id INTEGER REFERENCES students(student_id), admission_number VARCHAR(50),
          student_name VARCHAR(100), bed_number VARCHAR(20), contact_number VARCHAR(20),
          check_in_date DATE, check_in_date_bs VARCHAR(20),
          check_out_date DATE, check_out_date_bs VARCHAR(20),
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Documents
        CREATE TABLE IF NOT EXISTS documents (
          document_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          student_id INTEGER REFERENCES students(student_id), teacher_id INTEGER REFERENCES teachers(teacher_id),
          staff_id INTEGER REFERENCES staff(staff_id),
          title VARCHAR(200) NOT NULL, description TEXT, document_type VARCHAR(50),
          file_path VARCHAR(500), file_url VARCHAR(500), file_size INTEGER,
          file_name VARCHAR(255), file_type VARCHAR(50), mime_type VARCHAR(100), 
          uploaded_by INTEGER, is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP, type VARCHAR(50)
        );

        -- Student Documents
        CREATE TABLE IF NOT EXISTS student_documents (
          id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES students(student_id),
          document_id INTEGER REFERENCES documents(document_id),
          document_type VARCHAR(50), file_path VARCHAR(500), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Live Classes (Video Class)
        CREATE TABLE IF NOT EXISTS live_classes (
          id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          class_name VARCHAR(200) NOT NULL, description TEXT, teacher_id BIGINT,
          subject_id INTEGER REFERENCES subjects(subject_id), class_id INTEGER REFERENCES classes(class_id),
          section_id INTEGER,
          scheduled_start TIMESTAMP, scheduled_end TIMESTAMP, actual_start TIMESTAMP, actual_end TIMESTAMP,
          scheduled_at TIMESTAMP NOT NULL, scheduled_at_bs VARCHAR(20),
          duration INTEGER, platform VARCHAR(50),
          meeting_id VARCHAR(100), meeting_url VARCHAR(500), host_url VARCHAR(500), host_id VARCHAR(100),
          password VARCHAR(100), status VARCHAR(20) DEFAULT 'scheduled',
          recording_enabled BOOLEAN DEFAULT false, is_recording_enabled BOOLEAN DEFAULT false,
          recording_url VARCHAR(500), started_at TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          created_by INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP
        );

        -- Libraries
        CREATE TABLE IF NOT EXISTS libraries (
          library_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          name VARCHAR(100) NOT NULL, location VARCHAR(200), incharge_name VARCHAR(100),
          contact_number VARCHAR(20), is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Books
        CREATE TABLE IF NOT EXISTS books (
          book_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          library_id INTEGER REFERENCES libraries(library_id),
          isbn VARCHAR(20), title VARCHAR(200) NOT NULL, title_en VARCHAR(200), title_np VARCHAR(200),
          author VARCHAR(100), author_en VARCHAR(100), author_np VARCHAR(100),
          publisher VARCHAR(100), edition VARCHAR(50), category VARCHAR(50), book_type VARCHAR(50),
          total_copies INTEGER DEFAULT 0, available_copies INTEGER DEFAULT 0, shelf_location VARCHAR(50),
          acquisition_date DATE, price DECIMAL(10,2),
          is_reference BOOLEAN DEFAULT false, is_neb_reference BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Book Issues
        CREATE TABLE IF NOT EXISTS book_issues (
          issue_id SERIAL PRIMARY KEY, book_id INTEGER REFERENCES books(book_id),
          student_id INTEGER REFERENCES students(student_id), issue_date DATE,
          due_date DATE, return_date DATE, status VARCHAR(20) DEFAULT 'issued',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Transports
        CREATE TABLE IF NOT EXISTS transports (
          transport_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          vehicle_number VARCHAR(50) NOT NULL, vehicle_name VARCHAR(100), vehicle_type VARCHAR(50),
          capacity INTEGER, driver_name VARCHAR(100), driver_contact VARCHAR(20),
          route_name VARCHAR(100), is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Routes
        CREATE TABLE IF NOT EXISTS routes (
          route_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          school_id BIGINT NOT NULL REFERENCES schools(school_id),
          transport_id BIGINT,
          route_code VARCHAR(50), route_name VARCHAR(100) NOT NULL, 
          province_id INTEGER, district_id INTEGER, municipality_id INTEGER,
          route_description TEXT, start_point VARCHAR(200), end_point VARCHAR(200),
          distance_km DECIMAL(10,2), estimated_time VARCHAR(50), fare DECIMAL(10,2), 
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Route Stops
        CREATE TABLE IF NOT EXISTS route_stops (
          stop_id SERIAL PRIMARY KEY, route_id INTEGER REFERENCES routes(route_id),
          stop_name VARCHAR(100), stop_order INTEGER, pickup_time TIME, drop_time TIME,
          fare DECIMAL(10,2), is_active BOOLEAN DEFAULT true
        );

        -- Transport Assignments
        CREATE TABLE IF NOT EXISTS transport_assignments (
          id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES students(student_id),
          route_id INTEGER REFERENCES routes(route_id), stop_id INTEGER REFERENCES route_stops(stop_id),
          effective_from DATE, effective_to DATE, is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Staff (HR)
        CREATE TABLE IF NOT EXISTS staff (
          staff_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          employee_id VARCHAR(50) NOT NULL, first_name VARCHAR(100), last_name VARCHAR(100),
          gender VARCHAR(20), date_of_birth DATE, phone VARCHAR(20), email VARCHAR(100),
          department VARCHAR(100), designation VARCHAR(100), joining_date DATE,
          employment_type VARCHAR(50), current_status VARCHAR(20) DEFAULT 'active',
          is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Leave Requests
        CREATE TABLE IF NOT EXISTS leave_requests (
          leave_id SERIAL PRIMARY KEY, staff_id INTEGER REFERENCES staff(staff_id),
          leave_type VARCHAR(50), start_date DATE, end_date DATE, total_days INTEGER,
          reason TEXT, status VARCHAR(20) DEFAULT 'pending', approved_by INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Leave Types
        CREATE TABLE IF NOT EXISTS leave_types (
          id SERIAL PRIMARY KEY, school_id BIGINT NOT NULL REFERENCES schools(school_id),
          name VARCHAR(100) NOT NULL, max_days_per_year INTEGER, is_paid BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Leave Requests
        CREATE TABLE IF NOT EXISTS leave_requests (
          leave_request_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          school_id BIGINT NOT NULL REFERENCES schools(school_id),
          staff_id BIGINT NOT NULL REFERENCES staff(staff_id),
          leave_type_id BIGINT NOT NULL REFERENCES leave_types(id),
          start_date DATE NOT NULL, end_date DATE NOT NULL, days_requested INTEGER NOT NULL,
          reason TEXT, status VARCHAR(50) DEFAULT 'PENDING',
          approved_by BIGINT, approved_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Payroll
        CREATE TABLE IF NOT EXISTS payroll (
          payroll_id SERIAL PRIMARY KEY, staff_id INTEGER REFERENCES staff(staff_id),
          month INTEGER, year INTEGER, basic_salary DECIMAL(10,2),
          allowances DECIMAL(10,2), deductions DECIMAL(10,2), net_salary DECIMAL(10,2),
          payment_date DATE, payment_status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Vehicles (for transport)
        CREATE TABLE IF NOT EXISTS vehicles (
          vehicle_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          school_id BIGINT NOT NULL REFERENCES schools(school_id),
          transport_id BIGINT,
          vehicle_number VARCHAR(50) NOT NULL, vehicle_name VARCHAR(100), vehicle_type VARCHAR(50),
          capacity INTEGER, manufacturer VARCHAR(100), year INTEGER, color VARCHAR(50),
          chassis_number VARCHAR(100), engine_number VARCHAR(100),
          insurance_expiry DATE, permit_expiry DATE,
          is_active BOOLEAN DEFAULT true, deleted_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Leave Types
        CREATE TABLE IF NOT EXISTS leave_types (
          id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          name VARCHAR(100) NOT NULL, max_days_per_year INTEGER, is_paid BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true
        );

        -- Notifications
        CREATE TABLE IF NOT EXISTS notifications (
          notification_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          user_id INTEGER REFERENCES users(user_id), title VARCHAR(200) NOT NULL,
          message TEXT, type VARCHAR(50), is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Exams
        CREATE TABLE IF NOT EXISTS exam (
          exam_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          exam_name VARCHAR(100) NOT NULL, exam_type VARCHAR(50), class_id INTEGER REFERENCES classes(class_id),
          academic_year VARCHAR(10), start_date DATE, end_date DATE, is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Academic Calendar
        CREATE TABLE IF NOT EXISTS academic_calendars (
          id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          title VARCHAR(200) NOT NULL, description TEXT, event_type VARCHAR(50),
          start_date DATE, end_date DATE, is_holiday BOOLEAN DEFAULT false,
          academic_year VARCHAR(10),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Online Admissions
        CREATE TABLE IF NOT EXISTS online_admissions (
          id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          application_no VARCHAR(50) UNIQUE NOT NULL, first_name VARCHAR(100), last_name VARCHAR(100),
          gender VARCHAR(20), date_of_birth DATE, grade_applied VARCHAR(20),
          parent_name VARCHAR(100), parent_phone VARCHAR(20), parent_email VARCHAR(100),
          status VARCHAR(20) DEFAULT 'pending', applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Certificates
        CREATE TABLE IF NOT EXISTS certificates (
          certificate_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          student_id INTEGER REFERENCES students(student_id), certificate_type VARCHAR(50),
          issued_date DATE, issued_by INTEGER, certificate_data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Transfer Certificates
        CREATE TABLE IF NOT EXISTS transfer_certificates (
          tc_id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES students(student_id),
          school_id INTEGER REFERENCES schools(school_id), tc_number VARCHAR(50),
          issue_date DATE, joining_date DATE, leaving_date DATE,
          character_conduct VARCHAR(20), last_class VARCHAR(50), total_attendance INTEGER,
          status VARCHAR(20) DEFAULT 'issued', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Bonafide Certificates
        CREATE TABLE IF NOT EXISTS bonafide_certificates (
          id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES students(student_id),
          school_id INTEGER REFERENCES schools(school_id), certificate_number VARCHAR(50),
          issue_date DATE, purpose TEXT, is_verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Character Certificates
        CREATE TABLE IF NOT EXISTS character_certificates (
          id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES students(student_id),
          school_id INTEGER REFERENCES schools(school_id), certificate_number VARCHAR(50),
          issue_date DATE, character_remarks TEXT, is_verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Fee Categories
        CREATE TABLE IF NOT EXISTS fee_categories (
          id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          category_name VARCHAR(100) NOT NULL, description TEXT, is_recurring BOOLEAN DEFAULT true,
          is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Fee Structures
        CREATE TABLE IF NOT EXISTS fee_structures (
          id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          category_id INTEGER REFERENCES fee_categories(id), class_id INTEGER REFERENCES classes(class_id),
          academic_year VARCHAR(10), amount DECIMAL(10,2) NOT NULL,
          due_date DATE, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Fee Installments
        CREATE TABLE IF NOT EXISTS fee_installments (
          id SERIAL PRIMARY KEY, fee_structure_id INTEGER REFERENCES fee_structures(id),
          installment_number INTEGER, amount DECIMAL(10,2), due_date DATE,
          is_active BOOLEAN DEFAULT true
        );

        -- Student Fees
        CREATE TABLE IF NOT EXISTS student_fees (
          id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES students(student_id),
          fee_structure_id INTEGER REFERENCES fee_structures(id), academic_year VARCHAR(10),
          total_amount DECIMAL(10,2), paid_amount DECIMAL(10,2), discount_amount DECIMAL(10,2),
          fine_amount DECIMAL(10,2), balance_amount DECIMAL(10,2),
          status VARCHAR(20) DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Fee Transactions
        CREATE TABLE IF NOT EXISTS fee_transactions (
          id SERIAL PRIMARY KEY, student_fee_id INTEGER REFERENCES student_fees(id),
          amount DECIMAL(10,2), payment_method VARCHAR(50), transaction_id VARCHAR(100),
          payment_date DATE, receipt_number VARCHAR(50), status VARCHAR(20) DEFAULT 'completed',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Grade Scales
        CREATE TABLE IF NOT EXISTS grade_scales (
          id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          grade_name VARCHAR(5) NOT NULL, min_marks INTEGER, max_marks INTEGER,
          grade_point DECIMAL(3,2), description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Assignments
        CREATE TABLE IF NOT EXISTS assignments (
          id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          title VARCHAR(200) NOT NULL, description TEXT, class_id INTEGER REFERENCES classes(class_id),
          section_id INTEGER, subject_id INTEGER REFERENCES subjects(subject_id), teacher_id BIGINT,
          due_date DATE, due_date_bs VARCHAR(20), total_marks INTEGER,
          is_published BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP
        );

        -- Timetables
        CREATE TABLE IF NOT EXISTS timetables (
          id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          class_id INTEGER REFERENCES classes(class_id), subject_id INTEGER REFERENCES subjects(subject_id),
          teacher_id BIGINT, day_of_week VARCHAR(20), period_number INTEGER,
          start_time TIME, end_time TIME, academic_year VARCHAR(10),
          is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Audit Logs
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          user_id INTEGER, action VARCHAR(100), entity_type VARCHAR(50), entity_id INTEGER,
          old_value JSONB, new_value JSONB, ip_address VARCHAR(45),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Sync Queue
        CREATE TABLE IF NOT EXISTS sync_queue (
          id SERIAL PRIMARY KEY, entity_type VARCHAR(50), entity_id INTEGER,
          operation VARCHAR(20), data JSONB, status VARCHAR(20) DEFAULT 'pending',
          attempts INTEGER DEFAULT 0, last_attempt TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Sync Log
        CREATE TABLE IF NOT EXISTS sync_log (
          id SERIAL PRIMARY KEY, sync_id VARCHAR(100), entity_type VARCHAR(50),
          status VARCHAR(20), message TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Webhooks
        CREATE TABLE IF NOT EXISTS webhooks (
          id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          name VARCHAR(100) NOT NULL, url VARCHAR(500) NOT NULL, event_type VARCHAR(50),
          is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Webhook Logs
        CREATE TABLE IF NOT EXISTS webhook_logs (
          id SERIAL PRIMARY KEY, webhook_id INTEGER REFERENCES webhooks(id),
          payload JSONB, response_status INTEGER, response_body TEXT,
          attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- SMS Logs
        CREATE TABLE IF NOT EXISTS sms_logs (
          id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          recipient_phone VARCHAR(20), message TEXT, status VARCHAR(20),
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- SMS Templates
        CREATE TABLE IF NOT EXISTS sms_templates (
          id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          name VARCHAR(100) NOT NULL, template_text TEXT NOT NULL, event_type VARCHAR(50),
          is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Districts
        CREATE TABLE IF NOT EXISTS districts (
          id SERIAL PRIMARY KEY, province_id INTEGER, name_en VARCHAR(100), name_np VARCHAR(100)
        );

        -- Local Bodies
        CREATE TABLE IF NOT EXISTS local_bodies (
          id SERIAL PRIMARY KEY, district_id INTEGER, type VARCHAR(50),
          name_en VARCHAR(100), name_np VARCHAR(100)
        );

        -- Wards
        CREATE TABLE IF NOT EXISTS wards (
          id SERIAL PRIMARY KEY, local_body_id INTEGER, ward_number INTEGER
        );

        -- Provinces
        CREATE TABLE IF NOT EXISTS provinces (
          id SERIAL PRIMARY KEY, name_en VARCHAR(100), name_np VARCHAR(100)
        );

        -- Rate Limits
        CREATE TABLE IF NOT EXISTS rate_limits (
          id SERIAL PRIMARY KEY, ip_address VARCHAR(45), endpoint VARCHAR(200),
          request_count INTEGER DEFAULT 0, window_start TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Data Exports
        CREATE TABLE IF NOT EXISTS data_exports (
          id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          export_type VARCHAR(50), file_path VARCHAR(500), status VARCHAR(20),
          created_by INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Document Templates
        CREATE TABLE IF NOT EXISTS document_templates (
          id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          name VARCHAR(100) NOT NULL, template_type VARCHAR(50), template_content TEXT,
          is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Attendance Records
        CREATE TABLE IF NOT EXISTS attendance_records (
          id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          student_id INTEGER REFERENCES students(student_id), date DATE,
          status VARCHAR(20), marked_by INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Student Enrollments
        CREATE TABLE IF NOT EXISTS student_enrollments (
          id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES students(student_id),
          class_id INTEGER REFERENCES classes(class_id), section_id INTEGER REFERENCES sections(section_id),
          academic_year VARCHAR(10), enrollment_date DATE, status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Student Promotions
        CREATE TABLE IF NOT EXISTS student_promotions (
          id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES students(student_id),
          from_class_id INTEGER, to_class_id INTEGER, academic_year VARCHAR(10),
          promotion_date DATE, status VARCHAR(20),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Transport Fees
        CREATE TABLE IF NOT EXISTS transport_fees (
          id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          route_id INTEGER REFERENCES routes(route_id), academic_year VARCHAR(10),
          amount DECIMAL(10,2), is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Leave Types
        CREATE TABLE IF NOT EXISTS leave_types (
          id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          name VARCHAR(100) NOT NULL, max_days_per_year INTEGER, is_paid BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true
        );
      `);

      this.schemaInitialized = true;
      this.logger.log('Database schema initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize schema: ' + error.message);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  getPool(): Pool {
    return this.pool;
  }

  // Basic query methods
  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const result = await this.pool.query(text, params);
    return result.rows;
  }

  async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows[0] || null;
  }

  async insert<T = any>(text: string, params?: any[]): Promise<T> {
    const result = await this.pool.query(text, params);
    return result.rows[0];
  }

  async update(text: string, params?: any[]): Promise<number> {
    const result = await this.pool.query(text, params);
    return result.rowCount || 0;
  }

  async delete(text: string, params?: any[]): Promise<number> {
    return this.update(text, params);
  }

  // Transaction support
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Bulk insert
  async bulkInsert<T = any>(
    tableName: string,
    data: Record<string, any>[],
    returning: string = '*',
  ): Promise<T[]> {
    if (data.length === 0) return [];

    const columns = Object.keys(data[0]);
    const values: any[] = [];
    const placeholders: string[] = [];

    data.forEach((row, rowIndex) => {
      const rowPlaceholders: string[] = [];
      columns.forEach((col, colIndex) => {
        values.push(row[col]);
        rowPlaceholders.push(`$${rowIndex * columns.length + colIndex + 1}`);
      });
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
    });

    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES ${placeholders.join(', ')}
      RETURNING ${returning}
    `;

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  // Bulk update
  async bulkUpdate(
    tableName: string,
    data: Record<string, any>[],
    idColumn: string = 'id',
  ): Promise<number> {
    if (data.length === 0) return 0;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      let totalUpdated = 0;
      for (const row of data) {
        const id = row[idColumn];
        const updateData = { ...row };
        delete updateData[idColumn];

        const setClause = Object.keys(updateData)
          .map((key, i) => `${key} = $${i + 1}`)
          .join(', ');
        const values = [...Object.values(updateData), id];

        const result = await client.query(
          `UPDATE ${tableName} SET ${setClause} WHERE ${idColumn} = $${values.length}`,
          values,
        );
        totalUpdated += result.rowCount || 0;
      }

      await client.query('COMMIT');
      return totalUpdated;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Count records
  async count(
    tableName: string,
    whereClause?: string,
    params?: any[],
  ): Promise<number> {
    const query = whereClause
      ? `SELECT COUNT(*) as count FROM ${tableName} WHERE ${whereClause}`
      : `SELECT COUNT(*) as count FROM ${tableName}`;

    const result = await this.pool.query(query, params);
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  // Check if record exists
  async exists(
    tableName: string,
    whereClause: string,
    params?: any[],
  ): Promise<boolean> {
    const query = `SELECT 1 FROM ${tableName} WHERE ${whereClause} LIMIT 1`;
    const result = await this.pool.query(query, params);
    return result.rows.length > 0;
  }

  // Soft delete
  async softDelete(
    tableName: string,
    idColumn: string,
    id: any,
  ): Promise<number> {
    return this.update(
      `UPDATE ${tableName} SET deleted_at = NOW() WHERE ${idColumn} = $1`,
      [id],
    );
  }

  // Hard delete
  async hardDelete(
    tableName: string,
    idColumn: string,
    id: any,
  ): Promise<number> {
    return this.delete(`DELETE FROM ${tableName} WHERE ${idColumn} = $1`, [id]);
  }

  // Pagination
  async paginate<T = any>(
    query: string,
    page: number = 1,
    limit: number = 10,
    params?: any[],
  ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = query
      .replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM')
      .replace(/ORDER BY.*$/i, '')
      .replace(/LIMIT.*$/i, '')
      .replace(/OFFSET.*$/i, '');

    const countResult = await this.pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    // Get paginated data
    const paginatedQuery = `${query} LIMIT $${(params?.length || 0) + 1} OFFSET $${(params?.length || 0) + 2}`;
    const dataParams = [...(params || []), limit, offset];
    const dataResult = await this.pool.query(paginatedQuery, dataParams);

    return {
      data: dataResult.rows,
      total,
      page,
      limit,
    };
  }

  // Upsert (INSERT ON CONFLICT UPDATE)
  async upsert<T = any>(
    tableName: string,
    data: Record<string, any>,
    conflictColumns: string[],
    updateColumns?: string[],
  ): Promise<T> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const updateCols =
      updateColumns || columns.filter((col) => !conflictColumns.includes(col));
    const updateClause = updateCols
      .map((col, i) => `${col} = $${columns.length + i + 1}`)
      .join(', ');

    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT (${conflictColumns.join(', ')})
      DO UPDATE SET ${updateClause}
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      ...values,
      ...updateCols.map((c) => data[c]),
    ]);
    return result.rows[0];
  }

  // Raw query with client for complex operations
  getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  // Execute with retry logic
  async executeWithRetry<T>(
    callback: () => Promise<T>,
    maxRetries: number = 3,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await callback();
      } catch (error) {
        lastError = error as Error;
        console.error(`Query failed, retry ${i + 1}/${maxRetries}:`, error);
        await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
      }
    }

    throw lastError ?? new Error('Unknown error in executeWithRetry');
  }

  // Get schema name
  getSchema(): string {
    return process.env.DB_SCHEMA || 'public';
  }
}
