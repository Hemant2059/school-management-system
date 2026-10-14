-- ============================================================================
-- Migration 006: service-model gaps — additive columns + missing tables
-- ============================================================================
-- Rule: NEVER narrows (ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS
-- only), except the scholarships rename below. Every addition below is read
-- or written by an existing service method; nothing here is speculative.
-- Ends with SELECT apply_tenant_rls() so new school_id tables are covered.
--
-- Per-service map (all verified against service SQL before adding):
-- academic-calendar: title_np/bs dates/is_exam/is_event/is_active/created_by/updated_at
-- classes/sections/subjects/exams/timetables: updated_at + deleted_at
-- timetables: section_id, room_number (exam-hall scheduling needs both)
-- exams: result_status (DRAFT state machine), published_at/by
-- marks: full workflow (obtained/full/points/remarks/submit/verify/approve/
--   publish/lock actors+timestamps, is_active, status, updated_at) + entry
--   uniqueness (NULLS NOT DISTINCT so subject-less rows dedupe too)
-- report_cards: published principal-signed artifact (distinct lifecycle from
--   system-maintained student_term_results)
-- fee: fees tracking cols; fee_structures catalog cols; fee_categories
--   deleted_at; NEW student_balances/late_fine_rules/sibling_discounts/
--   fee_waiver_requests; scholarships: master (003, unused) -> renamed
--   scholarship_schemes, then application-shaped scholarships (fee.service
--   contract; student_scholarships FK follows the rename automatically)
-- users: reset_token(+expiry) for forgot-password, deleted_at
-- audit_logs: user_name/user_agent/description (audit trail completeness)
-- notifications: is_active/updated_at/sent_at (user-targeted delivery)
-- webhooks/logs: type/secret/events(JSON array)/owner/timestamps; delivery log
-- staff: user_id/staff_code/bilingual names/mobile/pan/updated/deleted_at
-- leave_requests: bs dates/is_active/rejection_reason; NEW payrolls (Nepal
--   salary model; legacy singular payroll untouched)
-- books/issues: code/subject/levels/SEE flag/deleted_at; issue school/teacher
--   links, bs dates, fine/overdue/remarks trace
-- transport: routes.deleted_at; stops school/latlng; assignments school/
--   vehicle/dates; route fees monthly/admission/currency
-- sms: log recipient/template cols; template catalog cols
-- sync: school/device scoping cols (offline-first device sync is per-school)
-- certificates: numbers/bs dates/active flags; TC/bonafide/character detail
--   links + verification trail
-- attendance: biometric check-in/out (real feature, keep API complete)
-- exam_schedules: room_number + is_active (hall scheduling needs both)
-- ============================================================================

-- --------------------------------------------------------------------------
-- Academic structure leftovers
-- --------------------------------------------------------------------------
ALTER TABLE classes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE classes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE sections ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE academic_calendars ADD COLUMN IF NOT EXISTS title_np VARCHAR(200);
ALTER TABLE academic_calendars ADD COLUMN IF NOT EXISTS start_date_bs VARCHAR(20);
ALTER TABLE academic_calendars ADD COLUMN IF NOT EXISTS end_date_bs VARCHAR(20);
ALTER TABLE academic_calendars ADD COLUMN IF NOT EXISTS is_exam BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE academic_calendars ADD COLUMN IF NOT EXISTS is_event BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE academic_calendars ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE academic_calendars ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE academic_calendars ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE timetables ADD COLUMN IF NOT EXISTS section_id INTEGER REFERENCES sections(section_id) ON DELETE SET NULL;
ALTER TABLE timetables ADD COLUMN IF NOT EXISTS room_number VARCHAR(50);
ALTER TABLE timetables ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE timetables ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- --------------------------------------------------------------------------
-- Exams + marks workflow (result/exam services' DRAFT..LOCKED state machine)
-- --------------------------------------------------------------------------
ALTER TABLE exams ADD COLUMN IF NOT EXISTS result_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT';
ALTER TABLE exams ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS published_by INTEGER;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE exams ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE marks ADD COLUMN IF NOT EXISTS marks_obtained NUMERIC(6,2);
ALTER TABLE marks ADD COLUMN IF NOT EXISTS full_marks NUMERIC(6,2);
ALTER TABLE marks ADD COLUMN IF NOT EXISTS grade_point NUMERIC(4,2);
ALTER TABLE marks ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS is_submitted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'DRAFT';
ALTER TABLE marks ADD COLUMN IF NOT EXISTS submitted_by INTEGER;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS approved_by INTEGER;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS published_by INTEGER;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_marks_entry') THEN
    ALTER TABLE marks ADD CONSTRAINT uq_marks_entry
      UNIQUE NULLS NOT DISTINCT (school_id, exam_id, student_id, subject_id);
  END IF;
END $$;

-- Published report-card artifact (principal-signed; student_term_results
-- remains the system-maintained aggregation).
CREATE TABLE IF NOT EXISTS report_cards (
  report_id       SERIAL PRIMARY KEY,
  school_id       INTEGER NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  student_id      INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  exam_id         INTEGER NOT NULL REFERENCES exams(exam_id) ON DELETE CASCADE,
  academic_year   VARCHAR(10),
  total_gpa       NUMERIC(3,2),
  total_percentage NUMERIC(5,2),
  class_position  INTEGER,
  section_position INTEGER,
  principal_remark TEXT,
  teacher_remark  TEXT,
  is_published    BOOLEAN NOT NULL DEFAULT false,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_report_card UNIQUE (school_id, student_id, exam_id)
);

ALTER TABLE exam_schedules ADD COLUMN IF NOT EXISTS room_number VARCHAR(50);
ALTER TABLE exam_schedules ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- --------------------------------------------------------------------------
-- Fee engine: expand legacy tables to the fee.service contract
-- --------------------------------------------------------------------------
ALTER TABLE fees ADD COLUMN IF NOT EXISTS discount_type VARCHAR(30);
ALTER TABLE fees ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2);
ALTER TABLE fees ADD COLUMN IF NOT EXISTS fine_type VARCHAR(30);
ALTER TABLE fees ADD COLUMN IF NOT EXISTS fine_percent NUMERIC(5,2);
ALTER TABLE fees ADD COLUMN IF NOT EXISTS scholarship_percent NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE fees ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE fees ADD COLUMN IF NOT EXISTS is_fully_paid BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE fees ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE fees ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(12,2);
ALTER TABLE fees ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;

ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS stream_id INTEGER;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS section_id INTEGER REFERENCES sections(section_id) ON DELETE SET NULL;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS fee_type VARCHAR(50);
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS fee_frequency VARCHAR(20);
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS due_date_bs VARCHAR(20);
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE fee_categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS student_balances (
  balance_id            SERIAL PRIMARY KEY,
  school_id             INTEGER NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  student_id            INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  academic_year         VARCHAR(10) NOT NULL,
  brought_forward_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_paid            NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_adjusted        NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_due             NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_balance       NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_student_balance UNIQUE (student_id, academic_year)
);

CREATE TABLE IF NOT EXISTS late_fine_rules (
  fine_rule_id      SERIAL PRIMARY KEY,
  school_id         INTEGER NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  rule_name         VARCHAR(150) NOT NULL,
  fine_type         VARCHAR(20) NOT NULL,              -- per_day | flat | percentage
  fine_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  grace_period_days INTEGER NOT NULL DEFAULT 0,
  max_fine_amount   NUMERIC(12,2),
  applicable_from   DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_late_fine_type CHECK (fine_type IN ('per_day','flat','percentage'))
);

CREATE TABLE IF NOT EXISTS sibling_discounts (
  sibling_discount_id SERIAL PRIMARY KEY,
  school_id           INTEGER NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  family_id           VARCHAR(50),
  student_id          INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  sibling_count       INTEGER NOT NULL DEFAULT 1,
  discount_percent    NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  academic_year       VARCHAR(10),
  approved_by         INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  approved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_sib_pct CHECK (discount_percent >= 0 AND discount_percent <= 100)
);

CREATE TABLE IF NOT EXISTS fee_waiver_requests (
  waiver_id           SERIAL PRIMARY KEY,
  school_id           INTEGER NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  student_id          INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  fee_id              INTEGER REFERENCES fees(fee_id) ON DELETE SET NULL,
  waiver_type         VARCHAR(50) NOT NULL,
  requested_amount    NUMERIC(12,2) NOT NULL,
  approved_amount     NUMERIC(12,2),
  reason              TEXT,
  supporting_documents TEXT[],
  status              VARCHAR(20) NOT NULL DEFAULT 'pending',
  requested_by        INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  requested_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by         INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  approved_at         TIMESTAMPTZ,
  remarks             TEXT,
  CONSTRAINT chk_waiver_status CHECK (status IN ('pending','approved','rejected','cancelled'))
);

-- scholarships: 003 created an unused master shape while fee.service speaks a
-- per-student application shape. Park the master as scholarship_schemes
-- (student_scholarships FK follows the rename; no code reads either yet),
-- then create the application table the service contract needs.
DO $$ BEGIN
  IF to_regclass('public.scholarships') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'scholarships'
                   AND column_name = 'code')
     AND to_regclass('public.scholarship_schemes') IS NULL THEN
    ALTER TABLE scholarships RENAME TO scholarship_schemes;
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS scholarships (
  scholarship_id   SERIAL PRIMARY KEY,
  school_id        INTEGER NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  student_id       INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  scholarship_type VARCHAR(50) NOT NULL,
  discount_percent NUMERIC(5,2),
  discount_amount  NUMERIC(12,2),
  academic_year    VARCHAR(10),
  reason           TEXT,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending',
  requested_by     INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by      INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  approved_at      TIMESTAMPTZ,
  remarks          TEXT,
  CONSTRAINT chk_schol_status CHECK (status IN ('pending','approved','rejected','cancelled'))
);

-- --------------------------------------------------------------------------
-- Identity + audit
-- --------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_name VARCHAR(200);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- --------------------------------------------------------------------------
-- Webhooks (event routing needs type/secret/tagged subscriptions)
-- --------------------------------------------------------------------------
ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS webhook_type VARCHAR(50);
ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS secret_key VARCHAR(255);
-- Subscription tags as a JSON array string (node-postgres ships JS arrays as
-- JSON; queried with events::jsonb ? $n). NOT text[]: text[] rejects JSON.
ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS events TEXT NOT NULL DEFAULT '[]';
ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS event_type VARCHAR(50);
ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS success BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- --------------------------------------------------------------------------
-- HR: staff login link + bilingual names + payroll model + leave trail
-- --------------------------------------------------------------------------
ALTER TABLE staff ADD COLUMN IF NOT EXISTS user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS staff_code VARCHAR(50);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS first_name_en VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS middle_name_en VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS last_name_en VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS pan_number VARCHAR(50);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE staff ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS payrolls (
  payroll_id                SERIAL PRIMARY KEY,
  school_id                 INTEGER NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  staff_id                  INTEGER NOT NULL REFERENCES staff(staff_id) ON DELETE CASCADE,
  salary_month_bs           VARCHAR(10) NOT NULL,
  payment_date              DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_date_bs           VARCHAR(20),
  basic_salary              NUMERIC(12,2) NOT NULL DEFAULT 0,
  house_rent_allowance      NUMERIC(12,2) NOT NULL DEFAULT 0,
  transport_allowance       NUMERIC(12,2) NOT NULL DEFAULT 0,
  medical_allowance         NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_allowances          NUMERIC(12,2) NOT NULL DEFAULT 0,
  gross_salary              NUMERIC(12,2) NOT NULL DEFAULT 0,
  cit_deduction             NUMERIC(12,2) NOT NULL DEFAULT 0,
  ssf_employee_contribution NUMERIC(12,2) NOT NULL DEFAULT 0,
  ssf_employer_contribution NUMERIC(12,2) NOT NULL DEFAULT 0,
  provident_fund            NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_deduction             NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_deductions          NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_deductions          NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_salary                NUMERIC(12,2) NOT NULL DEFAULT 0,
  pan_number                VARCHAR(50),
  is_tax_exempt             BOOLEAN NOT NULL DEFAULT false,
  is_paid                   BOOLEAN NOT NULL DEFAULT true,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_payroll_month UNIQUE (staff_id, salary_month_bs)
);

ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS start_date_bs VARCHAR(20);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS end_date_bs VARCHAR(20);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- --------------------------------------------------------------------------
-- Library
-- --------------------------------------------------------------------------
ALTER TABLE books ADD COLUMN IF NOT EXISTS book_code VARCHAR(50);
ALTER TABLE books ADD COLUMN IF NOT EXISTS subject VARCHAR(100);
ALTER TABLE books ADD COLUMN IF NOT EXISTS curriculum_level VARCHAR(50);
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_see_reference BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE books ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE book_issues ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(school_id) ON DELETE CASCADE;
ALTER TABLE book_issues ADD COLUMN IF NOT EXISTS teacher_id BIGINT;
ALTER TABLE book_issues ADD COLUMN IF NOT EXISTS issue_date_bs VARCHAR(20);
ALTER TABLE book_issues ADD COLUMN IF NOT EXISTS due_date_bs VARCHAR(20);
ALTER TABLE book_issues ADD COLUMN IF NOT EXISTS return_date_bs VARCHAR(20);
ALTER TABLE book_issues ADD COLUMN IF NOT EXISTS fine_amount NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE book_issues ADD COLUMN IF NOT EXISTS days_overdue INTEGER NOT NULL DEFAULT 0;
ALTER TABLE book_issues ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE book_issues ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- --------------------------------------------------------------------------
-- Transport + hostel linkage
-- --------------------------------------------------------------------------
ALTER TABLE routes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(school_id) ON DELETE CASCADE;
ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6);
ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);

ALTER TABLE transport_assignments ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(school_id) ON DELETE CASCADE;
ALTER TABLE transport_assignments ADD COLUMN IF NOT EXISTS vehicle_id BIGINT REFERENCES vehicles(vehicle_id) ON DELETE SET NULL;
ALTER TABLE transport_assignments ADD COLUMN IF NOT EXISTS assignment_date DATE;
ALTER TABLE transport_assignments ADD COLUMN IF NOT EXISTS assignment_date_bs VARCHAR(20);

ALTER TABLE transport_fees ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE transport_fees ADD COLUMN IF NOT EXISTS admission_fee NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE transport_fees ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'NPR';

-- --------------------------------------------------------------------------
-- SMS catalog
-- --------------------------------------------------------------------------
ALTER TABLE sms_logs ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(200);
ALTER TABLE sms_logs ADD COLUMN IF NOT EXISTS template_id INTEGER REFERENCES sms_templates(id) ON DELETE SET NULL;

ALTER TABLE sms_templates ADD COLUMN IF NOT EXISTS template_name VARCHAR(100);
ALTER TABLE sms_templates ADD COLUMN IF NOT EXISTS template_code VARCHAR(50);
ALTER TABLE sms_templates ADD COLUMN IF NOT EXISTS message_en TEXT;
ALTER TABLE sms_templates ADD COLUMN IF NOT EXISTS message_np TEXT;

-- --------------------------------------------------------------------------
-- Offline-first sync (per-school device queues)
-- --------------------------------------------------------------------------
ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(school_id) ON DELETE CASCADE;
ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS device_id VARCHAR(100);
ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS sync_id VARCHAR(100);
ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;
ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE sync_log ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(school_id) ON DELETE CASCADE;
ALTER TABLE sync_log ADD COLUMN IF NOT EXISTS device_id VARCHAR(100);
ALTER TABLE sync_log ADD COLUMN IF NOT EXISTS operation VARCHAR(20);
ALTER TABLE sync_log ADD COLUMN IF NOT EXISTS entity_id INTEGER;
ALTER TABLE sync_log ADD COLUMN IF NOT EXISTS success BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE sync_log ADD COLUMN IF NOT EXISTS error_message TEXT;

-- --------------------------------------------------------------------------
-- Certificates (compliance artifacts with verification trail)
-- --------------------------------------------------------------------------
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_number VARCHAR(50);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issued_date_bs VARCHAR(20);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_certificate_number') THEN
    ALTER TABLE certificates ADD CONSTRAINT uq_certificate_number UNIQUE (school_id, certificate_number);
  END IF;
END $$;

ALTER TABLE transfer_certificates ADD COLUMN IF NOT EXISTS certificate_id INTEGER REFERENCES certificates(certificate_id) ON DELETE CASCADE;
ALTER TABLE transfer_certificates ADD COLUMN IF NOT EXISTS leaving_date_bs VARCHAR(20);
ALTER TABLE transfer_certificates ADD COLUMN IF NOT EXISTS reason_for_leaving TEXT;
ALTER TABLE transfer_certificates ADD COLUMN IF NOT EXISTS character_grade VARCHAR(10);
ALTER TABLE transfer_certificates ADD COLUMN IF NOT EXISTS attendance_percentage NUMERIC(5,2);
ALTER TABLE transfer_certificates ADD COLUMN IF NOT EXISTS last_class_id INTEGER REFERENCES classes(class_id) ON DELETE SET NULL;
ALTER TABLE transfer_certificates ADD COLUMN IF NOT EXISTS last_section_id INTEGER REFERENCES sections(section_id) ON DELETE SET NULL;
ALTER TABLE transfer_certificates ADD COLUMN IF NOT EXISTS last_academic_year VARCHAR(10);
ALTER TABLE transfer_certificates ADD COLUMN IF NOT EXISTS is_conduct_certificate BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE transfer_certificates ADD COLUMN IF NOT EXISTS issued_to VARCHAR(100) NOT NULL DEFAULT 'PARENT';
ALTER TABLE transfer_certificates ADD COLUMN IF NOT EXISTS signature_principal BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE transfer_certificates ADD COLUMN IF NOT EXISTS signature_teacher BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE transfer_certificates ADD COLUMN IF NOT EXISTS remarks TEXT;

ALTER TABLE bonafide_certificates ADD COLUMN IF NOT EXISTS certificate_id INTEGER REFERENCES certificates(certificate_id) ON DELETE CASCADE;
ALTER TABLE bonafide_certificates ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE bonafide_certificates ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TABLE character_certificates ADD COLUMN IF NOT EXISTS certificate_id INTEGER REFERENCES certificates(certificate_id) ON DELETE CASCADE;
ALTER TABLE character_certificates ADD COLUMN IF NOT EXISTS character_grade VARCHAR(10);
ALTER TABLE character_certificates ADD COLUMN IF NOT EXISTS conduct_description TEXT;
ALTER TABLE character_certificates ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE character_certificates ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- --------------------------------------------------------------------------
-- Attendance biometric trace + exam hall scheduling
-- --------------------------------------------------------------------------
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_in_time TIME;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_out_time TIME;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS biometric_device_id VARCHAR(100);

-- --------------------------------------------------------------------------
-- Teachers login linkage (account lookup for video classes + HR flows)
-- --------------------------------------------------------------------------
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE SET NULL;

-- New school_id tables are picked up for RLS here (002/003 already recorded).
SELECT apply_tenant_rls();
