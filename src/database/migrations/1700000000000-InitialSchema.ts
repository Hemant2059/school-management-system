import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Schools
    await queryRunner.query(`
      CREATE TABLE "schools" (
        "school_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_code" varchar(20) NOT NULL UNIQUE,
        "school_name" varchar(255) NOT NULL,
        "school_name_nepali" varchar(255),
        "school_type" varchar(50) NOT NULL DEFAULT 'DAY',
        "ownership_type" varchar(50) NOT NULL DEFAULT 'PRIVATE',
        "established_date" date,
        "established_date_bs" varchar(10),
        "registration_number" varchar(100),
        "affiliation_number" varchar(100),
        "moest_school_code" varchar(50),
        "province_id" int,
        "district_id" int,
        "municipality_id" int,
        "ward_no" int,
        "tole" varchar(100),
        "tole_nepali" varchar(100),
        "street_address" varchar(255),
        "street_address_nepali" varchar(255),
        "phone" varchar(20),
        "mobile" varchar(20),
        "email" varchar(100),
        "website" varchar(255),
        "academic_year_start_month" int NOT NULL DEFAULT 4,
        "currency_code" varchar(3) NOT NULL DEFAULT 'NPR',
        "timezone" varchar(50) NOT NULL DEFAULT 'Asia/Kathmandu',
        "language_preference" varchar(20) NOT NULL DEFAULT 'BOTH',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "created_by" bigint,
        "updated_by" bigint,
        CONSTRAINT "PK_schools" PRIMARY KEY ("school_id")
      )
    `);

    // Users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "user_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "username" varchar(100) NOT NULL UNIQUE,
        "email" varchar(100) UNIQUE,
        "phone" varchar(20) UNIQUE,
        "password_hash" varchar(255) NOT NULL,
        "full_name" varchar(255),
        "user_type" varchar(50) NOT NULL,
        "is_verified" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "failed_login_attempts" int NOT NULL DEFAULT 0,
        "locked_until" TIMESTAMP,
        "last_login_at" TIMESTAMP,
        "last_login_ip" varchar(45),
        "last_login_agent" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_users" PRIMARY KEY ("user_id"),
        CONSTRAINT "FK_users_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT
      )
    `);

    // Students
    await queryRunner.query(`
      CREATE TABLE "students" (
        "student_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "student_code" varchar(50) NOT NULL UNIQUE,
        "admission_number" varchar(50) NOT NULL,
        "roll_number" varchar(20),
        "bus_stop_id" bigint,
        "hostel_room_id" bigint,
        "medical_condition" text,
        "medications" text,
        "allergies" text,
        "tags" json,
        "registration_number" varchar(100),
        "first_name_en" varchar(100) NOT NULL,
        "middle_name_en" varchar(100),
        "last_name_en" varchar(100) NOT NULL,
        "first_name_np" varchar(150),
        "middle_name_np" varchar(150),
        "last_name_np" varchar(150),
        "display_name" varchar(255),
        "date_of_birth_ad" date NOT NULL,
        "date_of_birth_bs" varchar(10),
        "dob_bs_snapshot" text,
        "gender" varchar(20) NOT NULL,
        "blood_group" varchar(10),
        "religion" varchar(50),
        "mother_tongue" varchar(50),
        "caste_ethnicity" varchar(100),
        "caste_ethnicity_code" varchar(10),
        "citizenship_number" varchar(255),
        "birth_certificate_number" varchar(255),
        "is_govt_mandated_free_seat" boolean NOT NULL DEFAULT false,
        "is_economically_disadvantaged" boolean NOT NULL DEFAULT false,
        "has_disability" boolean NOT NULL DEFAULT false,
        "disability_type" varchar(100),
        "permanent_province_id" int,
        "permanent_district_id" int,
        "permanent_municipality_id" int,
        "permanent_ward_no" int,
        "permanent_tole_en" varchar(100),
        "permanent_address_en" varchar(255),
        "permanent_tole_np" varchar(150),
        "permanent_address_np" varchar(300),
        "temporary_province_id" int,
        "temporary_district_id" int,
        "temporary_municipality_id" int,
        "temporary_ward_no" int,
        "temporary_tole_en" varchar(100),
        "temporary_address_en" varchar(255),
        "temporary_tole_np" varchar(150),
        "temporary_address_np" varchar(300),
        "student_mobile" varchar(20),
        "student_email" varchar(100),
        "admission_date" date NOT NULL,
        "admission_class_id" bigint NOT NULL,
        "previous_school_name" varchar(255),
        "previous_school_address" varchar(500),
        "transfer_certificate_number" varchar(100),
        "tc_issue_date" date,
        "current_status" varchar(50) NOT NULL DEFAULT 'ACTIVE',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "created_by" bigint,
        "updated_by" bigint,
        CONSTRAINT "PK_students" PRIMARY KEY ("student_id"),
        CONSTRAINT "FK_students_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT,
        CONSTRAINT "UQ_students_admission_school" UNIQUE ("admission_number", "school_id")
      )
    `);

    // Teachers
    await queryRunner.query(`
      CREATE TABLE "teachers" (
        "teacher_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "teacher_code" varchar(50) NOT NULL UNIQUE,
        "employee_id" varchar(50) NOT NULL,
        "first_name_en" varchar(100) NOT NULL,
        "middle_name_en" varchar(100),
        "last_name_en" varchar(100) NOT NULL,
        "first_name_np" varchar(150),
        "middle_name_np" varchar(150),
        "last_name_np" varchar(150),
        "display_name" varchar(255),
        "date_of_birth" date,
        "date_of_birth_bs" varchar(10),
        "gender" varchar(20) NOT NULL,
        "blood_group" varchar(10),
        "nationality" varchar(50),
        "religion" varchar(50),
        "highest_qualification" varchar(200),
        "specialization" varchar(200),
        "university_board" varchar(255),
        "passing_year" int,
        "teaching_license_number" varchar(100),
        "license_expiry_date" date,
        "personal_mobile" varchar(20),
        "official_mobile" varchar(20),
        "personal_email" varchar(100),
        "official_email" varchar(100),
        "permanent_province_id" int,
        "permanent_district_id" int,
        "permanent_municipality_id" int,
        "permanent_ward_no" int,
        "permanent_tole_en" varchar(100),
        "permanent_address_en" varchar(255),
        "permanent_tole_np" varchar(150),
        "permanent_address_np" varchar(300),
        "joining_date" date NOT NULL,
        "joining_date_bs" varchar(10),
        "employment_type" varchar(50) NOT NULL DEFAULT 'PERMANENT',
        "department" varchar(100),
        "designation" varchar(100),
        "current_status" varchar(50) NOT NULL DEFAULT 'ACTIVE',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_teachers" PRIMARY KEY ("teacher_id"),
        CONSTRAINT "FK_teachers_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT,
        CONSTRAINT "UQ_teachers_employee_school" UNIQUE ("employee_id", "school_id")
      )
    `);

    // Academic Classes
    await queryRunner.query(`
      CREATE TABLE "classes" (
        "class_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "class_name" varchar(100) NOT NULL,
        "class_code" varchar(20) NOT NULL,
        "class_order" int NOT NULL,
        "education_level" varchar(50) NOT NULL,
        "min_age" int,
        "max_age" int,
        "section_count" int NOT NULL DEFAULT 0,
        "student_count" int NOT NULL DEFAULT 0,
        "max_students_per_section" int,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_classes" PRIMARY KEY ("class_id"),
        CONSTRAINT "FK_classes_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT,
        CONSTRAINT "UQ_classes_code_school" UNIQUE ("class_code", "school_id")
      )
    `);

    // Sections
    await queryRunner.query(`
      CREATE TABLE "sections" (
        "section_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "class_id" bigint NOT NULL,
        "section_name" varchar(100) NOT NULL,
        "section_code" varchar(20) NOT NULL,
        "section_order" int NOT NULL DEFAULT 0,
        "capacity" int,
        "student_count" int NOT NULL DEFAULT 0,
        "homeroom_teacher_id" bigint,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_sections" PRIMARY KEY ("section_id"),
        CONSTRAINT "FK_sections_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_sections_class" FOREIGN KEY ("class_id") REFERENCES "classes"("class_id") ON DELETE RESTRICT,
        CONSTRAINT "UQ_sections_class_code" UNIQUE ("class_id", "section_code", "school_id")
      )
    `);

    // Subjects
    await queryRunner.query(`
      CREATE TABLE "subjects" (
        "subject_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "subject_name" varchar(200) NOT NULL,
        "subject_name_nepali" varchar(200),
        "subject_code" varchar(50) NOT NULL,
        "subject_type" varchar(50) NOT NULL DEFAULT 'COMPULSORY',
        "subject_group" varchar(50),
        "credit_hours" decimal(4,2) NOT NULL DEFAULT 0,
        "is_theory" boolean NOT NULL DEFAULT true,
        "is_practical" boolean NOT NULL DEFAULT false,
        "theory_full_marks" int,
        "theory_pass_marks" int,
        "practical_full_marks" int,
        "practical_pass_marks" int,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_subjects" PRIMARY KEY ("subject_id"),
        CONSTRAINT "FK_subjects_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT,
        CONSTRAINT "UQ_subjects_code_school" UNIQUE ("subject_code", "school_id")
      )
    `);

    // Enrollments
    await queryRunner.query(`
      CREATE TABLE "student_enrollments" (
        "enrollment_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "student_id" bigint NOT NULL,
        "class_id" bigint NOT NULL,
        "section_id" bigint,
        "academic_year" varchar(50) NOT NULL,
        "enrollment_date" date NOT NULL,
        "enrollment_date_bs" varchar(10),
        "status" varchar(50) NOT NULL DEFAULT 'ACTIVE',
        "is_current" boolean NOT NULL DEFAULT true,
        "roll_number" varchar(20),
        "board_exam_registration" varchar(100),
        "previous_academic_year" varchar(50),
        "previous_class_id" bigint,
        "remarks" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "created_by" bigint,
        "updated_by" bigint,
        CONSTRAINT "PK_enrollments" PRIMARY KEY ("enrollment_id"),
        CONSTRAINT "FK_enrollments_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_enrollments_student" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_enrollments_class" FOREIGN KEY ("class_id") REFERENCES "classes"("class_id") ON DELETE RESTRICT,
        CONSTRAINT "UQ_enrollments_student_year_class" UNIQUE ("student_id", "academic_year", "class_id", "section_id")
      )
    `);

    // Guardians
    await queryRunner.query(`
      CREATE TABLE "guardians" (
        "guardian_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "user_id" bigint,
        "guardian_code" varchar(50) NOT NULL UNIQUE,
        "first_name_en" varchar(100) NOT NULL,
        "middle_name_en" varchar(100),
        "last_name_en" varchar(100) NOT NULL,
        "first_name_np" varchar(150),
        "middle_name_np" varchar(150),
        "last_name_np" varchar(150),
        "display_name" varchar(255),
        "relation_to_student" varchar(50) NOT NULL,
        "occupation" varchar(100),
        "organization" varchar(255),
        "designation" varchar(100),
        "education_level" varchar(100),
        "annual_income" decimal(15,2),
        "mobile" varchar(20) NOT NULL,
        "alternate_mobile" varchar(20),
        "email" varchar(100),
        "whatsapp_number" varchar(20),
        "province_id" int,
        "district_id" int,
        "municipality_id" int,
        "ward_no" int,
        "tole_en" varchar(100),
        "address_en" varchar(255),
        "tole_np" varchar(150),
        "address_np" varchar(300),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_guardians" PRIMARY KEY ("guardian_id"),
        CONSTRAINT "FK_guardians_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_guardians_user" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL
      )
    `);

    // Student-Guardian Relation
    await queryRunner.query(`
      CREATE TABLE "student_guardians" (
        "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "student_id" bigint NOT NULL,
        "guardian_id" bigint NOT NULL,
        "school_id" bigint NOT NULL,
        "is_primary" boolean NOT NULL DEFAULT false,
        "is_emergency_contact" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_student_guardians" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sg_student" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_sg_guardian" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("guardian_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_sg_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT,
        CONSTRAINT "UQ_student_guardian" UNIQUE ("student_id", "guardian_id")
      )
    `);

    // Attendance
    await queryRunner.query(`
      CREATE TABLE "attendance_records" (
        "attendance_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "student_id" bigint NOT NULL,
        "class_id" bigint NOT NULL,
        "section_id" bigint,
        "attendance_date" date NOT NULL,
        "attendance_date_bs" varchar(10),
        "status" varchar(50) NOT NULL,
        "academic_year" varchar(50) NOT NULL,
        "session" varchar(50) NOT NULL DEFAULT 'FULL_DAY',
        "remarks" varchar(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "created_by" bigint,
        "updated_by" bigint,
        CONSTRAINT "PK_attendance" PRIMARY KEY ("attendance_id"),
        CONSTRAINT "FK_attendance_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT
      )
    `);

    // Exams
    await queryRunner.query(`
      CREATE TABLE "exams" (
        "exam_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "exam_name" varchar(200) NOT NULL,
        "exam_code" varchar(50) NOT NULL,
        "exam_type" varchar(50) NOT NULL,
        "class_id" bigint NOT NULL,
        "section_id" bigint,
        "subject_id" bigint NOT NULL,
        "exam_date" date NOT NULL,
        "exam_date_bs" varchar(10),
        "start_time" varchar(10),
        "end_time" varchar(10),
        "full_marks" int NOT NULL,
        "pass_marks" int NOT NULL,
        "is_published" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_result_published" boolean NOT NULL DEFAULT false,
        "is_locked" boolean NOT NULL DEFAULT false,
        "remarks" text,
        "academic_year" varchar(50),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_exams" PRIMARY KEY ("exam_id"),
        CONSTRAINT "FK_exams_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT
      )
    `);

    // Marks
    await queryRunner.query(`
      CREATE TABLE "marks" (
        "mark_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "exam_id" bigint NOT NULL,
        "student_id" bigint NOT NULL,
        "theory_marks" decimal(6,2),
        "practical_marks" decimal(6,2),
        "total_marks" decimal(6,2),
        "grade" varchar(5),
        "grade_point" decimal(4,2),
        "grade_np" varchar(5),
        "class_rank" int,
        "section_rank" int,
        "remarks" varchar(255),
        "is_submitted" boolean NOT NULL DEFAULT false,
        "is_verified" boolean NOT NULL DEFAULT false,
        "academic_year" varchar(50),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_marks" PRIMARY KEY ("mark_id"),
        CONSTRAINT "FK_marks_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_marks_exam" FOREIGN KEY ("exam_id") REFERENCES "exams"("exam_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_marks_student" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT,
        CONSTRAINT "UQ_exam_student" UNIQUE ("exam_id", "student_id")
      )
    `);

    // Fees
    await queryRunner.query(`
      CREATE TABLE "fees" (
        "fee_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "student_id" bigint NOT NULL,
        "fee_type" varchar(100) NOT NULL,
        "amount" decimal(12,2) NOT NULL,
        "discount_amount" decimal(12,2),
        "fine_amount" decimal(12,2),
        "total_amount" decimal(12,2) NOT NULL,
        "due_date" date NOT NULL,
        "status" varchar(50) NOT NULL DEFAULT 'PENDING',
        "payment_date" date,
        "payment_method" varchar(50),
        "transaction_id" varchar(100),
        "fiscal_year_bs" varchar(10),
        "scholarship_percent" decimal(5,2) NOT NULL DEFAULT 0,
        "notes" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "created_by" bigint,
        "updated_by" bigint,
        CONSTRAINT "PK_fees" PRIMARY KEY ("fee_id"),
        CONSTRAINT "FK_fees_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_fees_student" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT
      )
    `);

    // Fee Categories
    await queryRunner.query(`
      CREATE TABLE "fee_categories" (
        "category_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "category_name" varchar(100) NOT NULL,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fee_categories" PRIMARY KEY ("category_id"),
        CONSTRAINT "FK_fee_categories_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT
      )
    `);

    // Fee Installments
    await queryRunner.query(`
      CREATE TABLE "fee_installments" (
        "installment_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "fee_id" bigint NOT NULL,
        "installment_number" int NOT NULL,
        "amount" decimal(12,2) NOT NULL,
        "due_date" date NOT NULL,
        "is_paid" boolean NOT NULL DEFAULT false,
        "paid_date" date,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fee_installments" PRIMARY KEY ("installment_id"),
        CONSTRAINT "FK_installments_fee" FOREIGN KEY ("fee_id") REFERENCES "fees"("fee_id") ON DELETE CASCADE
      )
    `);

    // Fee Transactions
    await queryRunner.query(`
      CREATE TABLE "fee_transactions" (
        "transaction_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "fee_id" bigint,
        "student_fee_id" bigint,
        "amount" decimal(12,2) NOT NULL,
        "payment_method" varchar(50) NOT NULL,
        "transaction_date" date NOT NULL,
        "transaction_date_bs" varchar(10),
        "reference_number" varchar(100),
        "remarks" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" bigint,
        CONSTRAINT "PK_fee_transactions" PRIMARY KEY ("transaction_id"),
        CONSTRAINT "FK_transactions_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_transactions_fee" FOREIGN KEY ("fee_id") REFERENCES "fees"("fee_id") ON DELETE SET NULL
      )
    `);

    // Fee Structures
    await queryRunner.query(`
      CREATE TABLE "fee_structures" (
        "structure_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "class_id" bigint,
        "academic_year" varchar(50) NOT NULL,
        "fee_type" varchar(100) NOT NULL,
        "amount" decimal(12,2) NOT NULL,
        "is_recurring" boolean NOT NULL DEFAULT true,
        "due_date" date,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fee_structures" PRIMARY KEY ("structure_id"),
        CONSTRAINT "FK_structures_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT
      )
    `);

    // Timetables
    await queryRunner.query(`
      CREATE TABLE "timetables" (
        "timetable_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "class_id" bigint NOT NULL,
        "section_id" bigint,
        "subject_id" bigint NOT NULL,
        "teacher_id" bigint,
        "day_of_week" varchar(20) NOT NULL,
        "period_number" int NOT NULL,
        "start_time" varchar(10) NOT NULL,
        "end_time" varchar(10) NOT NULL,
        "room_number" varchar(20),
        "academic_year" varchar(50) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_timetables" PRIMARY KEY ("timetable_id"),
        CONSTRAINT "FK_timetables_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_timetables_class" FOREIGN KEY ("class_id") REFERENCES "classes"("class_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_timetables_teacher" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("teacher_id") ON DELETE SET NULL
      )
    `);

    // HR Tables (Staff, Leave, Payroll)
    await queryRunner.query(`
      CREATE TABLE "staff" (
        "staff_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "user_id" bigint,
        "staff_code" varchar(50) NOT NULL UNIQUE,
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "email" varchar(100),
        "mobile" varchar(20),
        "department" varchar(100),
        "designation" varchar(100),
        "employment_type" varchar(50) NOT NULL DEFAULT 'PERMANENT',
        "joining_date" date NOT NULL,
        "current_status" varchar(50) NOT NULL DEFAULT 'ACTIVE',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_staff" PRIMARY KEY ("staff_id"),
        CONSTRAINT "FK_staff_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "leave_types" (
        "leave_type_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "name" varchar(100) NOT NULL,
        "description" text,
        "max_days_per_year" int,
        "is_paid" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_types" PRIMARY KEY ("leave_type_id"),
        CONSTRAINT "FK_leave_types_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "leave_requests" (
        "leave_request_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "staff_id" bigint NOT NULL,
        "leave_type_id" bigint NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "total_days" int NOT NULL,
        "reason" text,
        "status" varchar(50) NOT NULL DEFAULT 'PENDING',
        "approved_by" bigint,
        "approved_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_requests" PRIMARY KEY ("leave_request_id"),
        CONSTRAINT "FK_leave_requests_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_leave_requests_staff" FOREIGN KEY ("staff_id") REFERENCES "staff"("staff_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_leave_requests_type" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("leave_type_id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "payroll" (
        "payroll_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "staff_id" bigint NOT NULL,
        "month" int NOT NULL,
        "year" int NOT NULL,
        "basic_salary" decimal(12,2) NOT NULL,
        "allowances" decimal(12,2),
        "deductions" decimal(12,2),
        "net_salary" decimal(12,2) NOT NULL,
        "payment_date" date,
        "payment_status" varchar(50) NOT NULL DEFAULT 'PENDING',
        "bank_name" varchar(100),
        "account_number" varchar(50),
        "remarks" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payroll" PRIMARY KEY ("payroll_id"),
        CONSTRAINT "FK_payroll_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_payroll_staff" FOREIGN KEY ("staff_id") REFERENCES "staff"("staff_id") ON DELETE RESTRICT,
        CONSTRAINT "UQ_payroll_staff_month" UNIQUE ("staff_id", "month", "year")
      )
    `);

    // Library Tables
    await queryRunner.query(`
      CREATE TABLE "libraries" (
        "library_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL UNIQUE,
        "library_name" varchar(200),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_libraries" PRIMARY KEY ("library_id"),
        CONSTRAINT "FK_libraries_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "books" (
        "book_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "isbn" varchar(50),
        "book_code" varchar(50) NOT NULL,
        "title" varchar(255) NOT NULL,
        "author" varchar(200),
        "publisher" varchar(200),
        "category" varchar(100),
        "quantity" int NOT NULL DEFAULT 1,
        "available_quantity" int NOT NULL DEFAULT 1,
        "rack_number" varchar(50),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_books" PRIMARY KEY ("book_id"),
        CONSTRAINT "FK_books_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "book_issues" (
        "issue_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "book_id" bigint NOT NULL,
        "student_id" bigint,
        "issue_date" date NOT NULL,
        "due_date" date NOT NULL,
        "return_date" date,
        "status" varchar(50) NOT NULL DEFAULT 'ISSUED',
        "remarks" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_book_issues" PRIMARY KEY ("issue_id"),
        CONSTRAINT "FK_issues_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_issues_book" FOREIGN KEY ("book_id") REFERENCES "books"("book_id") ON DELETE RESTRICT
      )
    `);

    // Transport Tables
    await queryRunner.query(`
      CREATE TABLE "transports" (
        "transport_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL UNIQUE,
        "transport_name" varchar(200),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transports" PRIMARY KEY ("transport_id"),
        CONSTRAINT "FK_transports_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "vehicles" (
        "vehicle_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "transport_id" bigint NOT NULL,
        "vehicle_number" varchar(50) NOT NULL,
        "vehicle_name" varchar(100),
        "vehicle_type" varchar(50),
        "capacity" int,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicles" PRIMARY KEY ("vehicle_id"),
        CONSTRAINT "FK_vehicles_transport" FOREIGN KEY ("transport_id") REFERENCES "transports"("transport_id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "routes" (
        "route_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "transport_id" bigint NOT NULL,
        "route_name" varchar(100) NOT NULL,
        "route_code" varchar(50),
        "start_point" varchar(200),
        "end_point" varchar(200),
        "distance_km" decimal(6,2),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_routes" PRIMARY KEY ("route_id"),
        CONSTRAINT "FK_routes_transport" FOREIGN KEY ("transport_id") REFERENCES "transports"("transport_id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "route_stops" (
        "stop_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "route_id" bigint NOT NULL,
        "stop_name" varchar(100) NOT NULL,
        "stop_order" int NOT NULL,
        "arrival_time" varchar(10),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_route_stops" PRIMARY KEY ("stop_id"),
        CONSTRAINT "FK_stops_route" FOREIGN KEY ("route_id") REFERENCES "routes"("route_id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "transport_fees" (
        "transport_fee_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "route_id" bigint,
        "academic_year" varchar(50) NOT NULL,
        "fee_amount" decimal(12,2) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transport_fees" PRIMARY KEY ("transport_fee_id"),
        CONSTRAINT "FK_tf_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "transport_assignments" (
        "assignment_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "student_id" bigint NOT NULL,
        "route_id" bigint NOT NULL,
        "vehicle_id" bigint,
        "academic_year" varchar(50) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transport_assignments" PRIMARY KEY ("assignment_id"),
        CONSTRAINT "FK_ta_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ta_student" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ta_route" FOREIGN KEY ("route_id") REFERENCES "routes"("route_id") ON DELETE RESTRICT
      )
    `);

    // Notifications
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "notification_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "school_id" bigint NOT NULL,
        "user_id" bigint,
        "title" varchar(200) NOT NULL,
        "message" text NOT NULL,
        "type" varchar(50) NOT NULL,
        "is_read" boolean NOT NULL DEFAULT false,
        "sent_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("notification_id"),
        CONSTRAINT "FK_notifications_school" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE RESTRICT
      )
    `);

    // User Sessions
    await queryRunner.query(`
      CREATE TABLE "user_sessions" (
        "session_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "user_id" bigint NOT NULL,
        "refresh_token" varchar(500),
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_sessions" PRIMARY KEY ("session_id"),
        CONSTRAINT "FK_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
      )
    `);

    // Audit Logs
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "log_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        "user_id" bigint,
        "action" varchar(100) NOT NULL,
        "entity_type" varchar(100) NOT NULL,
        "entity_id" bigint,
        "old_values" json,
        "new_values" json,
        "ip_address" varchar(45),
        "user_agent" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("log_id")
      )
    `);

    // Create Indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_schools_is_active" ON "schools" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_school_type_active" ON "users" ("school_id", "user_type", "is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_students_school_status" ON "students" ("school_id", "is_active", "current_status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_students_gender" ON "students" ("gender")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_teachers_school_status" ON "teachers" ("school_id", "is_active", "current_status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_classes_school_order" ON "classes" ("school_id", "class_order")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sections_school_class" ON "sections" ("school_id", "class_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_enrollments_school_year_current" ON "student_enrollments" ("school_id", "academic_year", "is_current")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_enrollments_student_year" ON "student_enrollments" ("student_id", "academic_year")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attendance_date" ON "attendance_records" ("attendance_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attendance_student_date" ON "attendance_records" ("student_id", "attendance_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_exams_school_year" ON "exams" ("school_id", "academic_year")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_exams_class_date" ON "exams" ("class_id", "exam_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_marks_exam_student" ON "marks" ("exam_id", "student_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fees_student_status" ON "fees" ("student_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fee_transactions_date" ON "fee_transactions" ("transaction_date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_fee_transactions_date"`);
    await queryRunner.query(`DROP INDEX "IDX_fees_student_status"`);
    await queryRunner.query(`DROP INDEX "IDX_marks_exam_student"`);
    await queryRunner.query(`DROP INDEX "IDX_exams_class_date"`);
    await queryRunner.query(`DROP INDEX "IDX_exams_school_year"`);
    await queryRunner.query(`DROP INDEX "IDX_attendance_student_date"`);
    await queryRunner.query(`DROP INDEX "IDX_attendance_date"`);
    await queryRunner.query(`DROP INDEX "IDX_enrollments_student_year"`);
    await queryRunner.query(`DROP INDEX "IDX_enrollments_school_year_current"`);
    await queryRunner.query(`DROP INDEX "IDX_sections_school_class"`);
    await queryRunner.query(`DROP INDEX "IDX_classes_school_order"`);
    await queryRunner.query(`DROP INDEX "IDX_teachers_school_status"`);
    await queryRunner.query(`DROP INDEX "IDX_students_gender"`);
    await queryRunner.query(`DROP INDEX "IDX_students_school_status"`);
    await queryRunner.query(`DROP INDEX "IDX_users_school_type_active"`);
    await queryRunner.query(`DROP INDEX "IDX_schools_is_active"`);

    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "user_sessions"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "transport_assignments"`);
    await queryRunner.query(`DROP TABLE "transport_fees"`);
    await queryRunner.query(`DROP TABLE "route_stops"`);
    await queryRunner.query(`DROP TABLE "routes"`);
    await queryRunner.query(`DROP TABLE "vehicles"`);
    await queryRunner.query(`DROP TABLE "transports"`);
    await queryRunner.query(`DROP TABLE "book_issues"`);
    await queryRunner.query(`DROP TABLE "books"`);
    await queryRunner.query(`DROP TABLE "libraries"`);
    await queryRunner.query(`DROP TABLE "payroll"`);
    await queryRunner.query(`DROP TABLE "leave_requests"`);
    await queryRunner.query(`DROP TABLE "leave_types"`);
    await queryRunner.query(`DROP TABLE "staff"`);
    await queryRunner.query(`DROP TABLE "timetables"`);
    await queryRunner.query(`DROP TABLE "fee_structures"`);
    await queryRunner.query(`DROP TABLE "fee_transactions"`);
    await queryRunner.query(`DROP TABLE "fee_installments"`);
    await queryRunner.query(`DROP TABLE "fee_categories"`);
    await queryRunner.query(`DROP TABLE "fees"`);
    await queryRunner.query(`DROP TABLE "marks"`);
    await queryRunner.query(`DROP TABLE "exams"`);
    await queryRunner.query(`DROP TABLE "attendance_records"`);
    await queryRunner.query(`DROP TABLE "student_guardians"`);
    await queryRunner.query(`DROP TABLE "guardians"`);
    await queryRunner.query(`DROP TABLE "student_enrollments"`);
    await queryRunner.query(`DROP TABLE "subjects"`);
    await queryRunner.query(`DROP TABLE "sections"`);
    await queryRunner.query(`DROP TABLE "classes"`);
    await queryRunner.query(`DROP TABLE "teachers"`);
    await queryRunner.query(`DROP TABLE "students"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "schools"`);
  }
}
