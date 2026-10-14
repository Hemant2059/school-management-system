-- ============================================================================
-- Migration 001: Nepal School Management System — Core Academic, Registry,
-- Fee Engine & Examination Schema (PostgreSQL 15+)
-- ============================================================================
-- Depends on: 000_base_schema.sql (schools, users)
--
-- RELATIONSHIP MAP (FK graph, → = many-to-one)
--   fiscal_years (national, Shrawan–Ashad) ← academic_years.fiscal_year_id
--                                            ← fee_invoices / payments (audit FY)
--   academic_years ← terms | classes(sections) | enrollments | fee_structures
--                    | scholarships | exams | results
--   classes → sections → enrollments (student × year × class × section, roll_no)
--   caste_ethnicity_groups (global CEHRD codes) ← students.caste_code
--   guardians ← student_guardians → students (m:n, primary/emergency/fee-payer)
--   scholarships → student_scholarships (student × year, % or fixed)
--   transport_routes → transport_assignments (student × year)
--   hostels → hostel_allocations (student × year, one active bed)
--   fee_heads → fee_structures (class × year × head × frequency)
--             → fee_invoice_lines → fee_invoices (student × year × FY)
--   discount_rules → student_fee_discounts (→ invoice or whole year)
--   penalty_rules (grace + mode/cap, per head or global)
--   payments → payment_allocations → fee_invoices (partial payments)
--   subjects → class_subjects (class × year) → exam_schedules → marks
--   grade_scales (NULL school_id = national NEB-2078 template) → lines
--   exams (term) → exam_schedules (class × subject × date) → marks
--                → student_term_results (GPA, grade, rank; ranks via fn)
--
-- CONVENTIONS
--   * money NUMERIC(12,2) NPR; percents NUMERIC(5,2); GPA NUMERIC(3,2)/NUMERIC(2,1)
--   * BS dates VARCHAR(10) 'YYYY-MM-DD' + regex CHECK (BS months have up to 32d);
--     AD dates DATE/TIMESTAMPTZ. App converts via nepali-date-converter.
--   * school_id INTEGER everywhere (matches schools.school_id SERIAL).
--   * Master rows RESTRICT deletes; child lines CASCADE; money rows RESTRICT.
-- ============================================================================

-- Extensions: pgcrypto (gen_random_uuid), pg_trgm (name search), btree_gist kept
-- available for future range-exclusion constraints.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Reusable updated_at trigger.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ============================================================================
-- 1. DUAL CALENDAR & ACADEMIC STRUCTURE (BS + AD, fiscal Shrawan–Ashad)
-- ============================================================================

-- National fiscal year. Nepal FY runs Shrawan 1 (BS month 04-01) to Ashad end
-- (BS month 03). The substring CHECKs below encode that rule in the DB.
CREATE TABLE IF NOT EXISTS fiscal_years (
  fiscal_year_id SERIAL PRIMARY KEY,
  fy_code        VARCHAR(9)  NOT NULL,               -- e.g. '2082/83'
  start_bs       VARCHAR(10) NOT NULL,               -- '2082-04-01'
  end_bs         VARCHAR(10) NOT NULL,               -- '2083-03-32'
  start_ad       DATE        NOT NULL,
  end_ad         DATE        NOT NULL,
  is_current     BOOLEAN     NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_fy_code_fmt   CHECK (fy_code ~ '^[0-9]{4}/[0-9]{2}$'),
  CONSTRAINT chk_fy_bs_fmt     CHECK (start_bs ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
                                  AND end_bs  ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  CONSTRAINT chk_fy_shrawan    CHECK (substring(start_bs from 6) = '04-01'),
  CONSTRAINT chk_fy_ashad      CHECK (substring(end_bs from 6 for 2) = '03'),
  CONSTRAINT chk_fy_order      CHECK (start_ad < end_ad AND start_bs < end_bs),
  CONSTRAINT uq_fiscal_year_code UNIQUE (fy_code)
);
-- One current FY nationally: tiny table, partial unique keeps app logic honest.
CREATE UNIQUE INDEX IF NOT EXISTS uq_fiscal_year_current
  ON fiscal_years ((1)) WHERE is_current;

-- Per-school academic session. Academic start is flexible (Baisakh/Shrawan) so
-- no month CHECK here; fiscal_year_id links the session to the tax FY.
CREATE TABLE IF NOT EXISTS academic_years (
  academic_year_id SERIAL PRIMARY KEY,
  school_id        INTEGER     NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  session_name     VARCHAR(20) NOT NULL,             -- e.g. '2082'
  start_date_ad    DATE        NOT NULL,
  end_date_ad      DATE        NOT NULL,
  start_date_bs    VARCHAR(10) NOT NULL,
  end_date_bs      VARCHAR(10) NOT NULL,
  fiscal_year_id   INTEGER     REFERENCES fiscal_years(fiscal_year_id) ON DELETE SET NULL,
  is_current       BOOLEAN     NOT NULL DEFAULT false,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_ay_bs_fmt CHECK (start_date_bs ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
                              AND end_date_bs  ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  CONSTRAINT chk_ay_order  CHECK (start_date_ad < end_date_ad AND start_date_bs < end_date_bs),
  CONSTRAINT uq_school_session UNIQUE (school_id, session_name)
);
-- High-traffic: every query is scoped (school_id, session). Partial unique =
-- exactly one current session per school (data-integrity, not just app rule).
CREATE UNIQUE INDEX IF NOT EXISTS uq_academic_year_current
  ON academic_years (school_id) WHERE is_current;
CREATE INDEX IF NOT EXISTS idx_academic_years_school
  ON academic_years (school_id, is_active);
DROP TRIGGER IF EXISTS trg_academic_years_updated ON academic_years;
CREATE TRIGGER trg_academic_years_updated BEFORE UPDATE ON academic_years
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Terms within a session (e.g. First / Second / Annual). Weights should sum to
-- 100 per year — enforced at app layer (cross-row SUM can't be a CHECK).
CREATE TABLE IF NOT EXISTS terms (
  term_id          SERIAL PRIMARY KEY,
  academic_year_id INTEGER      NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
  term_code        VARCHAR(20)  NOT NULL,            -- FIRST, SECOND, ANNUAL
  term_name        VARCHAR(100) NOT NULL,
  term_name_np     VARCHAR(100),
  weight_pct       NUMERIC(5,2) NOT NULL DEFAULT 0,  -- contribution to final
  start_date_ad    DATE         NOT NULL,
  end_date_ad      DATE         NOT NULL,
  start_date_bs    VARCHAR(10)  NOT NULL,
  end_date_bs      VARCHAR(10)  NOT NULL,
  is_final         BOOLEAN      NOT NULL DEFAULT false,
  display_order    INTEGER      NOT NULL DEFAULT 0,
  CONSTRAINT chk_term_code CHECK (term_code IN ('FIRST','SECOND','THIRD','ANNUAL','UNIT','OTHER')),
  CONSTRAINT chk_term_wt    CHECK (weight_pct >= 0 AND weight_pct <= 100),
  CONSTRAINT chk_term_order CHECK (start_date_ad <= end_date_ad),
  CONSTRAINT uq_term_per_year UNIQUE (academic_year_id, term_code)
);
CREATE INDEX IF NOT EXISTS idx_terms_year ON terms (academic_year_id, display_order);

-- Grade levels. Named `classes` to match app DTOs (classId).
CREATE TABLE IF NOT EXISTS classes (
  class_id          SERIAL PRIMARY KEY,
  school_id         INTEGER      NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  class_name        VARCHAR(50)  NOT NULL,           -- 'Grade 10'
  class_name_np     VARCHAR(50),
  class_code        VARCHAR(20)  NOT NULL,           -- 'G10'
  class_order       INTEGER      NOT NULL,           -- 1..12 (+ECD=0)
  education_level   VARCHAR(20)  NOT NULL DEFAULT 'BASIC',
  min_age           INTEGER,
  max_age           INTEGER,
  max_section_size  INTEGER      NOT NULL DEFAULT 40,
  is_active         BOOLEAN      NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT chk_edu_level CHECK (education_level IN ('ECD','BASIC','SECONDARY','PLUS2','OTHER')),
  CONSTRAINT chk_class_order CHECK (class_order >= 0 AND class_order <= 15),
  CONSTRAINT uq_class_order UNIQUE (school_id, class_order),
  CONSTRAINT uq_class_code  UNIQUE (school_id, class_code)
);
-- High-traffic: class pickers / promotion lists filter (school, active).
CREATE INDEX IF NOT EXISTS idx_classes_school ON classes (school_id, is_active, class_order);

-- ============================================================================
-- 2. CEHRD / IEMIS STUDENT REGISTRY
-- ============================================================================

-- Global CEHRD caste/ethnicity master. Codes match MOEST pattern NN[A-Z]
-- (see IsMoestCasteCode / MOEST_CASTE_CODE_REGEX in app).
CREATE TABLE IF NOT EXISTS caste_ethnicity_groups (
  caste_code   VARCHAR(3)  PRIMARY KEY,              -- e.g. '01A'
  name_en      VARCHAR(100) NOT NULL,
  name_np      VARCHAR(100),
  category     VARCHAR(20)  NOT NULL,                -- reporting bucket
  iemis_group  VARCHAR(50),                         -- CEHRD/IEMIS grouping label
  is_active    BOOLEAN      NOT NULL DEFAULT true,
  CONSTRAINT chk_caste_fmt CHECK (caste_code ~ '^(0[1-9]|1[0-5])[A-Z]$'),
  CONSTRAINT chk_caste_cat CHECK (category IN
    ('BRAHMIN_CHHETRI','MADHESI','DALIT','JANAJATI','MUSLIM','THARU','NEWAR','OTHER'))
);

-- Guardians (parents / legal guardians). user_id links login when present.
CREATE TABLE IF NOT EXISTS guardians (
  guardian_id      SERIAL PRIMARY KEY,
  school_id        INTEGER      NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  user_id          INTEGER      UNIQUE REFERENCES users(user_id) ON DELETE SET NULL,
  guardian_code    VARCHAR(30)  NOT NULL,
  first_name_en    VARCHAR(100) NOT NULL,
  last_name_en     VARCHAR(100) NOT NULL,
  first_name_np    VARCHAR(100),
  last_name_np     VARCHAR(100),
  mobile           VARCHAR(15),
  email            VARCHAR(255),
  occupation       VARCHAR(100),
  citizenship_no   VARCHAR(50),
  address_en       TEXT,
  address_np       TEXT,
  is_active        BOOLEAN      NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT chk_guardian_mobile CHECK (mobile IS NULL OR mobile ~ '^(98|97|96)[0-9]{8}$'),
  CONSTRAINT uq_guardian_code UNIQUE (school_id, guardian_code)
);
-- High-traffic: guardian lookup by phone at admission desk; login join.
CREATE INDEX IF NOT EXISTS idx_guardians_mobile ON guardians (school_id, mobile);
CREATE INDEX IF NOT EXISTS idx_guardians_user   ON guardians (user_id) WHERE user_id IS NOT NULL;
DROP TRIGGER IF EXISTS trg_guardians_updated ON guardians;
CREATE TRIGGER trg_guardians_updated BEFORE UPDATE ON guardians
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Teaching staff (needed before sections for homeroom FK; trimmed to registry
-- fields — payroll/leave live in HR tables).
CREATE TABLE IF NOT EXISTS teachers (
  teacher_id                 SERIAL PRIMARY KEY,
  school_id                  INTEGER      NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  user_id                    INTEGER      UNIQUE REFERENCES users(user_id) ON DELETE SET NULL,
  teacher_code               VARCHAR(30)  NOT NULL,
  first_name_en              VARCHAR(100) NOT NULL,
  last_name_en               VARCHAR(100) NOT NULL,
  first_name_np              VARCHAR(100),
  last_name_np               VARCHAR(100),
  gender                     VARCHAR(20)  NOT NULL DEFAULT 'OTHER',
  date_of_birth_ad           DATE,
  date_of_birth_bs           VARCHAR(10),
  citizenship_number         VARCHAR(50),
  citizenship_issue_district VARCHAR(100),
  pan_number                 VARCHAR(20),
  teaching_license_no        VARCHAR(50),
  employment_type            VARCHAR(20)  NOT NULL DEFAULT 'CONTRACT',
  designation                VARCHAR(100),
  current_status             VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  is_active                  BOOLEAN      NOT NULL DEFAULT true,
  created_at                 TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT chk_teacher_status CHECK (current_status IN ('ACTIVE','RESIGNED','RETIRED','SUSPENDED')),
  CONSTRAINT uq_teacher_code UNIQUE (school_id, teacher_code),
  CONSTRAINT uq_teacher_citizen UNIQUE (citizenship_number)
);
CREATE INDEX IF NOT EXISTS idx_teachers_school ON teachers (school_id, current_status);
DROP TRIGGER IF EXISTS trg_teachers_updated ON teachers;
CREATE TRIGGER trg_teachers_updated BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Core student registry. National IDs (IEMIS / citizenship / birth-cert) are
-- globally UNIQUE; school-scoped codes are unique among non-deleted rows so
-- TC/transfer re-admission can reuse codes after soft delete.
CREATE TABLE IF NOT EXISTS students (
  student_id                  SERIAL PRIMARY KEY,
  school_id                   INTEGER      NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  iemis_student_id            VARCHAR(20),            -- CEHRD/IEMIS permanent ID
  admission_number            VARCHAR(30)  NOT NULL,
  student_code                VARCHAR(30)  NOT NULL,
  first_name_en               VARCHAR(100) NOT NULL,
  middle_name_en              VARCHAR(100),
  last_name_en                VARCHAR(100) NOT NULL,
  first_name_np               VARCHAR(100),
  middle_name_np              VARCHAR(100),
  last_name_np                VARCHAR(100),
  date_of_birth_ad            DATE         NOT NULL,
  date_of_birth_bs            VARCHAR(10),
  gender                      VARCHAR(20)  NOT NULL,
  blood_group                 VARCHAR(5),
  religion                    VARCHAR(50),
  mother_tongue               VARCHAR(50),
  caste_code                  VARCHAR(3)   REFERENCES caste_ethnicity_groups(caste_code) ON DELETE RESTRICT,
  citizenship_number          VARCHAR(50),
  birth_certificate_number    VARCHAR(50),
  permanent_province_id       INTEGER,
  permanent_district          VARCHAR(100),
  permanent_municipality      VARCHAR(100),
  permanent_ward_no           INTEGER,
  permanent_tole_en           VARCHAR(150),
  permanent_tole_np           VARCHAR(150),
  temporary_address_en        TEXT,
  temporary_address_np        TEXT,
  student_mobile              VARCHAR(15),
  student_email               VARCHAR(255),
  is_govt_mandated_free_seat  BOOLEAN      NOT NULL DEFAULT false,
  is_economically_disadvantaged BOOLEAN    NOT NULL DEFAULT false,
  has_disability              BOOLEAN      NOT NULL DEFAULT false,
  disability_type             VARCHAR(100),
  bank_name                   VARCHAR(100),           -- scholarship disbursement
  bank_account_number         VARCHAR(50),
  admission_date_ad           DATE,
  admission_date_bs           VARCHAR(10),
  current_status              VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  deleted_at                  TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT chk_student_gender CHECK (gender IN ('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY')),
  CONSTRAINT chk_student_status CHECK (current_status IN
    ('ACTIVE','INACTIVE','TRANSFERRED','DROPPED','GRADUATED','SUSPENDED')),
  CONSTRAINT chk_student_dob    CHECK (date_of_birth_ad <= CURRENT_DATE),
  CONSTRAINT chk_student_prov   CHECK (permanent_province_id IS NULL
    OR (permanent_province_id BETWEEN 1 AND 7)),
  CONSTRAINT chk_student_ward   CHECK (permanent_ward_no IS NULL
    OR (permanent_ward_no BETWEEN 1 AND 35)),
  CONSTRAINT chk_student_mobile CHECK (student_mobile IS NULL OR student_mobile ~ '^(98|97|96)[0-9]{8}$'),
  CONSTRAINT chk_student_disab  CHECK (NOT has_disability OR disability_type IS NOT NULL),
  CONSTRAINT uq_students_iemis  UNIQUE (iemis_student_id),
  CONSTRAINT uq_student_citizen UNIQUE (citizenship_number),
  CONSTRAINT uq_student_birth   UNIQUE (birth_certificate_number)
);
-- High-traffic indexes:
--  * (school,status): class lists, DEO aggregates, fee-dues joins — hottest path.
--  * admission_number / student_code (partial, not-deleted): admission desk.
--  * caste_code: DEO caste/ethnicity + free-seat reports (GROUP BY).
--  * trigram on full name: ILIKE search at admission/fee counter.
CREATE INDEX IF NOT EXISTS idx_students_school_status ON students (school_id, current_status) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_students_adm ON students (school_id, admission_number) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_students_code ON students (school_id, student_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_caste ON students (school_id, caste_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_iemis ON students (iemis_student_id);
CREATE INDEX IF NOT EXISTS idx_students_name_trgm
  ON students USING gin ((first_name_en || ' ' || last_name_en) gin_trgm_ops);
DROP TRIGGER IF EXISTS trg_students_updated ON students;
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Student↔guardian linkage. One primary contact enforced by partial unique.
CREATE TABLE IF NOT EXISTS student_guardians (
  student_id          INTEGER     NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  guardian_id         INTEGER     NOT NULL REFERENCES guardians(guardian_id) ON DELETE RESTRICT,
  relation_to_student VARCHAR(30) NOT NULL,          -- FATHER/MOTHER/GUARDIAN/...
  is_primary          BOOLEAN     NOT NULL DEFAULT false,
  is_emergency_contact BOOLEAN    NOT NULL DEFAULT false,
  is_fee_payer        BOOLEAN     NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_relation CHECK (relation_to_student IN
    ('FATHER','MOTHER','GRANDFATHER','GRANDMOTHER','UNCLE','AUNT','BROTHER','SISTER','GUARDIAN','OTHER')),
  CONSTRAINT pk_student_guardian PRIMARY KEY (student_id, guardian_id)
);
-- High-traffic both directions: student profile (by student) + family view (by guardian).
CREATE INDEX IF NOT EXISTS idx_sg_guardian ON student_guardians (guardian_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sg_primary ON student_guardians (student_id) WHERE is_primary;

-- Scholarship master (school-level; govt-funded flagged for CEHRD reports).
CREATE TABLE IF NOT EXISTS scholarships (
  scholarship_id SERIAL PRIMARY KEY,
  school_id      INTEGER     NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  code           VARCHAR(30) NOT NULL,
  name_en        VARCHAR(150) NOT NULL,
  name_np        VARCHAR(150),
  category       VARCHAR(30) NOT NULL DEFAULT 'MERIT',
  is_govt_funded BOOLEAN     NOT NULL DEFAULT false,
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  CONSTRAINT chk_schol_cat CHECK (category IN
    ('MERIT','NEED','DALIT','JANAJATI','GIRL','MARTYR','DISABILITY','SPORTS','OTHER')),
  CONSTRAINT uq_scholarship_code UNIQUE (school_id, code)
);

CREATE TABLE IF NOT EXISTS student_scholarships (
  student_scholarship_id SERIAL PRIMARY KEY,
  student_id       INTEGER       NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  scholarship_id   INTEGER       NOT NULL REFERENCES scholarships(scholarship_id) ON DELETE RESTRICT,
  academic_year_id INTEGER       NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
  discount_percent NUMERIC(5,2),
  discount_amount  NUMERIC(12,2),
  status           VARCHAR(20)   NOT NULL DEFAULT 'APPROVED',
  approved_by      INTEGER       REFERENCES users(user_id) ON DELETE SET NULL,
  valid_from_ad    DATE,
  valid_to_ad      DATE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT chk_ss_pct CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100)),
  CONSTRAINT chk_ss_amt CHECK (discount_amount IS NULL OR discount_amount >= 0),
  CONSTRAINT chk_ss_one CHECK (discount_percent IS NOT NULL OR discount_amount IS NOT NULL),
  CONSTRAINT chk_ss_status CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
  CONSTRAINT uq_ss_year UNIQUE (student_id, scholarship_id, academic_year_id)
);
CREATE INDEX IF NOT EXISTS idx_ss_student_year ON student_scholarships (student_id, academic_year_id);

-- Sections (per class per session; homeroom FK now safe — teachers exists).
CREATE TABLE IF NOT EXISTS sections (
  section_id           SERIAL PRIMARY KEY,
  school_id            INTEGER     NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  class_id             INTEGER     NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
  academic_year_id     INTEGER     NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
  section_name         VARCHAR(10) NOT NULL,          -- 'A','B'
  capacity             INTEGER     NOT NULL DEFAULT 40,
  homeroom_teacher_id  INTEGER     REFERENCES teachers(teacher_id) ON DELETE SET NULL,
  is_active            BOOLEAN     NOT NULL DEFAULT true,
  CONSTRAINT chk_section_cap CHECK (capacity > 0 AND capacity <= 100),
  CONSTRAINT uq_section UNIQUE (school_id, class_id, academic_year_id, section_name)
);
CREATE INDEX IF NOT EXISTS idx_sections_class_year ON sections (class_id, academic_year_id);

-- Yearly enrollment: exactly one row per student per session.
CREATE TABLE IF NOT EXISTS enrollments (
  enrollment_id    SERIAL PRIMARY KEY,
  school_id        INTEGER     NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  student_id       INTEGER     NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  academic_year_id INTEGER     NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
  class_id         INTEGER     NOT NULL REFERENCES classes(class_id) ON DELETE RESTRICT,
  section_id       INTEGER     NOT NULL REFERENCES sections(section_id) ON DELETE RESTRICT,
  roll_no          INTEGER     NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'ENROLLED',
  enrolled_on_ad   DATE        NOT NULL DEFAULT CURRENT_DATE,
  enrolled_on_bs   VARCHAR(10),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_enroll_status CHECK (status IN
    ('ENROLLED','PROMOTED','REPEATED','TRANSFERRED_IN','LEFT','GRADUATED')),
  CONSTRAINT chk_roll_pos CHECK (roll_no > 0),
  CONSTRAINT uq_enroll_student_year UNIQUE (student_id, academic_year_id),
  CONSTRAINT uq_enroll_roll UNIQUE (academic_year_id, class_id, section_id, roll_no)
);
-- High-traffic: attendance/mark entry resolve (year,class,section); student history.
CREATE INDEX IF NOT EXISTS idx_enroll_class_section ON enrollments (academic_year_id, class_id, section_id);
CREATE INDEX IF NOT EXISTS idx_enroll_student ON enrollments (student_id);

-- ============================================================================
-- 3. FEE ENGINE (heads, structures, discounts, penalties, invoices, payments)
-- ============================================================================

-- Transport & hostel masters feed the fee engine (per-route/bus & per-bed fees
-- are invoiced via fee_heads TRANSPORT/HOSTEL using these monthly rates).
CREATE TABLE IF NOT EXISTS transport_routes (
  route_id     SERIAL PRIMARY KEY,
  school_id    INTEGER        NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  route_code   VARCHAR(20)    NOT NULL,
  route_name   VARCHAR(150)   NOT NULL,
  start_point  VARCHAR(150),
  end_point    VARCHAR(150),
  distance_km  NUMERIC(6,2),
  monthly_fee  NUMERIC(12,2)  NOT NULL DEFAULT 0,
  is_active    BOOLEAN        NOT NULL DEFAULT true,
  CONSTRAINT chk_route_fee CHECK (monthly_fee >= 0),
  CONSTRAINT uq_route_code UNIQUE (school_id, route_code)
);

CREATE TABLE IF NOT EXISTS transport_assignments (
  assignment_id    SERIAL PRIMARY KEY,
  school_id        INTEGER NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  student_id       INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  route_id         INTEGER NOT NULL REFERENCES transport_routes(route_id) ON DELETE RESTRICT,
  academic_year_id INTEGER NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
  pickup_stop      VARCHAR(150),
  fee_override     NUMERIC(12,2),
  is_active        BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT uq_transport_assign UNIQUE (student_id, academic_year_id)
);
CREATE INDEX IF NOT EXISTS idx_transport_assign_route ON transport_assignments (route_id, academic_year_id);

CREATE TABLE IF NOT EXISTS hostels (
  hostel_id        SERIAL PRIMARY KEY,
  school_id        INTEGER       NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  hostel_name      VARCHAR(150)  NOT NULL,
  hostel_name_np   VARCHAR(150),
  hostel_type      VARCHAR(10)   NOT NULL DEFAULT 'MIXED',
  total_rooms      INTEGER       NOT NULL DEFAULT 0,
  capacity_per_room INTEGER      NOT NULL DEFAULT 2,
  monthly_fee      NUMERIC(12,2) NOT NULL DEFAULT 0,
  warden_name      VARCHAR(150),
  warden_phone     VARCHAR(15),
  is_active        BOOLEAN       NOT NULL DEFAULT true,
  CONSTRAINT chk_hostel_type CHECK (hostel_type IN ('BOYS','GIRLS','MIXED')),
  CONSTRAINT chk_hostel_fee  CHECK (monthly_fee >= 0),
  CONSTRAINT uq_hostel_name UNIQUE (school_id, hostel_name)
);

CREATE TABLE IF NOT EXISTS hostel_allocations (
  allocation_id    SERIAL PRIMARY KEY,
  school_id        INTEGER NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  student_id       INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  hostel_id        INTEGER NOT NULL REFERENCES hostels(hostel_id) ON DELETE RESTRICT,
  academic_year_id INTEGER NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
  room_no          VARCHAR(20),
  bed_no           VARCHAR(20),
  monthly_fee      NUMERIC(12,2) NOT NULL DEFAULT 0,
  allocated_on_ad  DATE NOT NULL DEFAULT CURRENT_DATE,
  allocated_on_bs  VARCHAR(10),
  is_active        BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT chk_hostel_alloc_fee CHECK (monthly_fee >= 0)
);
-- One active bed per student per year (vacated rows set is_active=false).
CREATE UNIQUE INDEX IF NOT EXISTS uq_hostel_active
  ON hostel_allocations (student_id, academic_year_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_hostel_alloc_hostel ON hostel_allocations (hostel_id, academic_year_id);

-- Fee heads (chart of fee types; ledger_code hooks into accounting).
CREATE TABLE IF NOT EXISTS fee_heads (
  fee_head_id SERIAL PRIMARY KEY,
  school_id   INTEGER     NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  code        VARCHAR(30) NOT NULL,                  -- TUITION, TRANSPORT, HOSTEL, LAB...
  name_en     VARCHAR(150) NOT NULL,
  name_np     VARCHAR(150),
  is_mandatory BOOLEAN    NOT NULL DEFAULT true,
  is_refundable BOOLEAN   NOT NULL DEFAULT false,
  ledger_code VARCHAR(30),
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  CONSTRAINT chk_head_code CHECK (code IN ('TUITION','ADMISSION','EXAM','LAB','LIBRARY',
    'TRANSPORT','HOSTEL','UNIFORM','MEAL','ACTIVITY','COMPUTER','LATE_FINE','OTHER')),
  CONSTRAINT uq_fee_head UNIQUE (school_id, code)
);

-- Class × year × head price list. NULL class_id = applies to all grades.
-- COALESCE in the unique index treats NULL-class as a real bucket (plain UNIQUE
-- would allow duplicate "global" rows because NULL <> NULL).
CREATE TABLE IF NOT EXISTS fee_structures (
  structure_id     SERIAL PRIMARY KEY,
  school_id        INTEGER       NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  academic_year_id INTEGER       NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
  class_id         INTEGER       REFERENCES classes(class_id) ON DELETE CASCADE,
  fee_head_id      INTEGER       NOT NULL REFERENCES fee_heads(fee_head_id) ON DELETE RESTRICT,
  amount           NUMERIC(12,2) NOT NULL,
  frequency        VARCHAR(20)   NOT NULL DEFAULT 'ANNUAL',
  due_date_ad      DATE,
  due_date_bs      VARCHAR(10),
  is_mandatory     BOOLEAN       NOT NULL DEFAULT true,
  is_active        BOOLEAN       NOT NULL DEFAULT true,
  CONSTRAINT chk_fee_amt  CHECK (amount >= 0),
  CONSTRAINT chk_fee_freq CHECK (frequency IN
    ('ONE_TIME','MONTHLY','QUARTERLY','TERMLY','ANNUAL'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_fee_structure ON fee_structures
  (school_id, academic_year_id, fee_head_id, frequency, (COALESCE(class_id, -1)));
-- High-traffic: "all heads for class X this year" at invoice generation.
CREATE INDEX IF NOT EXISTS idx_fee_struct_lookup
  ON fee_structures (school_id, academic_year_id, class_id) WHERE is_active;

-- Dynamic discount catalog (sibling / staff-child / merit / early-bird...).
CREATE TABLE IF NOT EXISTS discount_rules (
  discount_rule_id SERIAL PRIMARY KEY,
  school_id        INTEGER       NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  code             VARCHAR(30)   NOT NULL,
  name_en          VARCHAR(150)  NOT NULL,
  discount_type    VARCHAR(10)   NOT NULL,            -- PERCENT or FIXED (NPR)
  value            NUMERIC(12,2) NOT NULL,
  applies_to       VARCHAR(20)   NOT NULL DEFAULT 'ALL',
  min_siblings     INTEGER,
  valid_from_ad    DATE,
  valid_to_ad      DATE,
  is_stackable     BOOLEAN       NOT NULL DEFAULT false, -- combine with others?
  is_active        BOOLEAN       NOT NULL DEFAULT true,
  CONSTRAINT chk_disc_type CHECK (discount_type IN ('PERCENT','FIXED')),
  CONSTRAINT chk_disc_val  CHECK (value >= 0 AND (discount_type <> 'PERCENT' OR value <= 100)),
  CONSTRAINT uq_discount_code UNIQUE (school_id, code)
);

-- Late-payment penalty catalog. NULL fee_head_id = global rule.
CREATE TABLE IF NOT EXISTS penalty_rules (
  penalty_rule_id SERIAL PRIMARY KEY,
  school_id       INTEGER       NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  code            VARCHAR(30)   NOT NULL,
  name_en         VARCHAR(150)  NOT NULL,
  fee_head_id     INTEGER       REFERENCES fee_heads(fee_head_id) ON DELETE CASCADE,
  grace_days      INTEGER       NOT NULL DEFAULT 0,
  mode            VARCHAR(20)   NOT NULL,            -- FIXED_PER_DAY / PERCENT_PER_MONTH / FLAT
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,  -- fixed/flat NPR
  percent         NUMERIC(5,2)  NOT NULL DEFAULT 0,  -- monthly %
  max_cap         NUMERIC(12,2),                     -- ceiling per invoice
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  CONSTRAINT chk_pen_mode CHECK (mode IN ('FIXED_PER_DAY','PERCENT_PER_MONTH','FLAT')),
  CONSTRAINT chk_pen_vals CHECK (amount >= 0 AND percent >= 0 AND percent <= 100
    AND grace_days >= 0 AND (max_cap IS NULL OR max_cap >= 0)),
  CONSTRAINT uq_penalty_code UNIQUE (school_id, code)
);

-- Invoices. grand_total/balance are STORED generated columns so totals can
-- never drift from components; paid_amount is maintained by trigger.
CREATE TABLE IF NOT EXISTS fee_invoices (
  invoice_id       BIGSERIAL PRIMARY KEY,
  school_id        INTEGER       NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  student_id       INTEGER       NOT NULL REFERENCES students(student_id) ON DELETE RESTRICT,
  academic_year_id INTEGER       NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE RESTRICT,
  fiscal_year_id   INTEGER       REFERENCES fiscal_years(fiscal_year_id) ON DELETE SET NULL,
  invoice_no       VARCHAR(30)   NOT NULL,            -- sequential per school×FY
  invoice_date_ad  DATE          NOT NULL DEFAULT CURRENT_DATE,
  invoice_date_bs  VARCHAR(10),
  due_date_ad      DATE          NOT NULL,
  due_date_bs      VARCHAR(10),
  subtotal         NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_total   NUMERIC(12,2) NOT NULL DEFAULT 0,
  penalty_total    NUMERIC(12,2) NOT NULL DEFAULT 0,
  grand_total      NUMERIC(12,2) GENERATED ALWAYS AS
    (GREATEST(subtotal - discount_total + penalty_total, 0)) STORED,
  paid_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance          NUMERIC(12,2) GENERATED ALWAYS AS
    (GREATEST(subtotal - discount_total + penalty_total - paid_amount, 0)) STORED,
  status           VARCHAR(20)   NOT NULL DEFAULT 'ISSUED',
  created_by       INTEGER       REFERENCES users(user_id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT chk_inv_status CHECK (status IN
    ('DRAFT','ISSUED','PARTIAL','PAID','OVERDUE','VOID','CANCELLED')),
  CONSTRAINT chk_inv_amts CHECK (subtotal >= 0 AND discount_total >= 0
    AND penalty_total >= 0 AND paid_amount >= 0 AND due_date_ad >= invoice_date_ad),
  CONSTRAINT uq_invoice_no UNIQUE (school_id, fiscal_year_id, invoice_no)
);
-- High-traffic: dues list per student; overdue cron scans due_date with
-- status filter; FY receipt book.
CREATE INDEX IF NOT EXISTS idx_inv_student ON fee_invoices (school_id, student_id, status);
CREATE INDEX IF NOT EXISTS idx_inv_overdue ON fee_invoices (school_id, due_date_ad)
  WHERE status IN ('ISSUED','PARTIAL','OVERDUE');
CREATE INDEX IF NOT EXISTS idx_inv_fy ON fee_invoices (school_id, fiscal_year_id, invoice_no);
DROP TRIGGER IF EXISTS trg_invoices_updated ON fee_invoices;
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON fee_invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS fee_invoice_lines (
  line_id       BIGSERIAL PRIMARY KEY,
  invoice_id    BIGINT        NOT NULL REFERENCES fee_invoices(invoice_id) ON DELETE CASCADE,
  fee_head_id   INTEGER       NOT NULL REFERENCES fee_heads(fee_head_id) ON DELETE RESTRICT,
  description   VARCHAR(200)  NOT NULL,
  quantity      INTEGER       NOT NULL DEFAULT 1,
  unit_amount   NUMERIC(12,2) NOT NULL,
  line_discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_penalty  NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_total    NUMERIC(12,2) GENERATED ALWAYS AS
    (GREATEST(quantity * unit_amount - line_discount + line_penalty, 0)) STORED,
  CONSTRAINT chk_line_vals CHECK (quantity > 0 AND unit_amount >= 0
    AND line_discount >= 0 AND line_penalty >= 0),
  CONSTRAINT uq_invoice_head UNIQUE (invoice_id, fee_head_id)
);
-- High-traffic: join lines when rendering invoice; head-wise collection report.
CREATE INDEX IF NOT EXISTS idx_inv_lines_invoice ON fee_invoice_lines (invoice_id);
CREATE INDEX IF NOT EXISTS idx_inv_lines_head ON fee_invoice_lines (fee_head_id);

-- Keep invoice subtotal in sync with lines (single writer trigger).
CREATE OR REPLACE FUNCTION refresh_invoice_totals() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v_inv BIGINT;
BEGIN
  v_inv := COALESCE(NEW.invoice_id, OLD.invoice_id);
  UPDATE fee_invoices SET subtotal =
    COALESCE((SELECT SUM(line_total) FROM fee_invoice_lines WHERE invoice_id = v_inv), 0),
    updated_at = now() WHERE invoice_id = v_inv;
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS trg_lines_totals ON fee_invoice_lines;
CREATE TRIGGER trg_lines_totals AFTER INSERT OR UPDATE OR DELETE ON fee_invoice_lines
  FOR EACH ROW EXECUTE FUNCTION refresh_invoice_totals();

-- Year- or invoice-level discount grants (approval trail via approved_by).
CREATE TABLE IF NOT EXISTS student_fee_discounts (
  student_discount_id SERIAL PRIMARY KEY,
  school_id        INTEGER NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  student_id       INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  discount_rule_id INTEGER NOT NULL REFERENCES discount_rules(discount_rule_id) ON DELETE RESTRICT,
  academic_year_id INTEGER NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
  invoice_id       BIGINT  REFERENCES fee_invoices(invoice_id) ON DELETE CASCADE,
  approved_by      INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_sfd_status CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED'))
);
-- NULL invoice_id = whole-year grant (partial unique); else per-invoice grant.
CREATE UNIQUE INDEX IF NOT EXISTS uq_sfd_year
  ON student_fee_discounts (student_id, discount_rule_id, academic_year_id) WHERE invoice_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_sfd_invoice
  ON student_fee_discounts (student_id, discount_rule_id, invoice_id) WHERE invoice_id IS NOT NULL;

-- Payments ledger. Idempotency: (gateway, txn_id) partial-unique stops double
-- credit on eSewa/Khalti/ConnectIPS/Fonepay webhook retries; idempotency_key
-- guards app-level double submits.
CREATE TABLE IF NOT EXISTS payments (
  payment_id       BIGSERIAL PRIMARY KEY,
  school_id        INTEGER       NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  student_id       INTEGER       NOT NULL REFERENCES students(student_id) ON DELETE RESTRICT,
  invoice_id       BIGINT        REFERENCES fee_invoices(invoice_id) ON DELETE RESTRICT,
  fiscal_year_id   INTEGER       REFERENCES fiscal_years(fiscal_year_id) ON DELETE SET NULL,
  amount           NUMERIC(12,2) NOT NULL,
  payment_date_ad  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  payment_date_bs  VARCHAR(10),
  payment_method   VARCHAR(20)   NOT NULL,
  gateway_name     VARCHAR(20),                       -- ESEWA/KHALTI/FONEPAY/CONNECTIPS/IMEPAY
  gateway_txn_id   VARCHAR(100),                      -- provider transaction ID
  gateway_txn_uuid UUID,                               -- provider reference UUID
  gateway_response JSONB,                              -- raw callback payload
  idempotency_key  UUID          NOT NULL DEFAULT gen_random_uuid(),
  status           VARCHAR(25)   NOT NULL DEFAULT 'SUCCESS',
  received_by      INTEGER       REFERENCES users(user_id) ON DELETE SET NULL,
  bank_name        VARCHAR(100),
  branch_name      VARCHAR(100),
  cheque_number    VARCHAR(50),
  cheque_date      DATE,
  reference_number VARCHAR(100),
  remarks          TEXT,
  is_verified      BOOLEAN       NOT NULL DEFAULT false,
  verified_by      INTEGER       REFERENCES users(user_id) ON DELETE SET NULL,
  verified_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT chk_pay_amt CHECK (amount > 0),
  CONSTRAINT chk_pay_method CHECK (payment_method IN ('CASH','BANK','CHEQUE','ESEWA',
    'KHALTI','FONEPAY','CONNECTIPS','IMEPAY','OTHER')),
  CONSTRAINT chk_pay_gateway CHECK (NOT (payment_method IN
    ('ESEWA','KHALTI','FONEPAY','CONNECTIPS','IMEPAY') AND gateway_name IS NULL)),
  CONSTRAINT chk_pay_cheque  CHECK (payment_method <> 'CHEQUE' OR cheque_number IS NOT NULL),
  CONSTRAINT chk_pay_status  CHECK (status IN
    ('INITIATED','SUCCESS','FAILED','REVERSED','REFUNDED','PENDING_VERIFICATION')),
  CONSTRAINT uq_pay_idempotency UNIQUE (idempotency_key)
);
-- High-traffic: daybook (school × date desc); student ledger; webhook dedupe.
CREATE INDEX IF NOT EXISTS idx_pay_daybook ON payments (school_id, payment_date_ad DESC);
CREATE INDEX IF NOT EXISTS idx_pay_student ON payments (school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_pay_invoice ON payments (invoice_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pay_gateway_txn
  ON payments (gateway_name, gateway_txn_id) WHERE gateway_txn_id IS NOT NULL;

-- Split one payment across invoices (partial / advance handling).
CREATE TABLE IF NOT EXISTS payment_allocations (
  allocation_id BIGSERIAL PRIMARY KEY,
  payment_id    BIGINT        NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
  invoice_id    BIGINT        NOT NULL REFERENCES fee_invoices(invoice_id) ON DELETE RESTRICT,
  amount        NUMERIC(12,2) NOT NULL,
  allocated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT chk_alloc_amt CHECK (amount > 0),
  CONSTRAINT uq_alloc UNIQUE (payment_id, invoice_id)
);
CREATE INDEX IF NOT EXISTS idx_alloc_invoice ON payment_allocations (invoice_id);

-- Keep invoice paid_amount in sync with allocations.
CREATE OR REPLACE FUNCTION refresh_invoice_paid() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v_inv BIGINT;
BEGIN
  v_inv := COALESCE(NEW.invoice_id, OLD.invoice_id);
  UPDATE fee_invoices SET paid_amount =
    COALESCE((SELECT SUM(amount) FROM payment_allocations WHERE invoice_id = v_inv), 0),
    updated_at = now() WHERE invoice_id = v_inv;
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS trg_alloc_paid ON payment_allocations;
CREATE TRIGGER trg_alloc_paid AFTER INSERT OR UPDATE OR DELETE ON payment_allocations
  FOR EACH ROW EXECUTE FUNCTION refresh_invoice_paid();

-- ============================================================================
-- 4. CDC / NEB EXAMINATION & GRADING (CAS + theory, A+ … NG)
-- ============================================================================

-- Subjects with CDC split: theory + practical/CAS full & pass marks.
CREATE TABLE IF NOT EXISTS subjects (
  subject_id          SERIAL PRIMARY KEY,
  school_id           INTEGER       NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  subject_code        VARCHAR(20)   NOT NULL,
  subject_name        VARCHAR(150)  NOT NULL,
  subject_name_np     VARCHAR(150),
  subject_type        VARCHAR(20)   NOT NULL DEFAULT 'COMPULSORY',
  credit_weight       NUMERIC(4,2)  NOT NULL DEFAULT 1.0,
  theory_full_marks   NUMERIC(6,2)  NOT NULL DEFAULT 75,
  theory_pass_marks   NUMERIC(6,2)  NOT NULL DEFAULT 26.25,  -- 35% of 75
  practical_full_marks NUMERIC(6,2) NOT NULL DEFAULT 25,     -- CAS/internal
  practical_pass_marks NUMERIC(6,2) NOT NULL DEFAULT 10,     -- 40% of 25
  is_active           BOOLEAN       NOT NULL DEFAULT true,
  CONSTRAINT chk_subj_type CHECK (subject_type IN ('COMPULSORY','OPTIONAL','PRACTICAL','VOCATIONAL')),
  CONSTRAINT chk_subj_marks CHECK (theory_full_marks >= 0 AND practical_full_marks >= 0
    AND (theory_full_marks + practical_full_marks) > 0
    AND theory_pass_marks <= theory_full_marks
    AND practical_pass_marks <= practical_full_marks
    AND credit_weight > 0),
  CONSTRAINT uq_subject_code UNIQUE (school_id, subject_code)
);
CREATE INDEX IF NOT EXISTS idx_subjects_school ON subjects (school_id, is_active);

-- Which subjects a class takes in a session.
CREATE TABLE IF NOT EXISTS class_subjects (
  class_id         INTEGER NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
  subject_id       INTEGER NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
  academic_year_id INTEGER NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
  is_compulsory    BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT pk_class_subject PRIMARY KEY (class_id, subject_id, academic_year_id)
);

-- Grade scales. NULL school_id = national template (seeded NEB-2078 below);
-- schools clone it on setup. Bounds are continuous ([min, max) except the top
-- grade which includes 100); grade lookup uses ORDER BY min DESC so a boundary
-- score (e.g. 90) deterministically yields the higher grade.
CREATE TABLE IF NOT EXISTS grade_scales (
  scale_id   SERIAL PRIMARY KEY,
  school_id  INTEGER     REFERENCES schools(school_id) ON DELETE CASCADE,
  scale_code VARCHAR(30) NOT NULL,
  scale_name VARCHAR(150) NOT NULL,
  is_default BOOLEAN     NOT NULL DEFAULT false,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  CONSTRAINT uq_scale_code UNIQUE NULLS NOT DISTINCT (school_id, scale_code)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_scale_default ON grade_scales (school_id) WHERE is_default;

CREATE TABLE IF NOT EXISTS grade_scale_lines (
  line_id      SERIAL PRIMARY KEY,
  scale_id     INTEGER       NOT NULL REFERENCES grade_scales(scale_id) ON DELETE CASCADE,
  grade        VARCHAR(3)    NOT NULL,                 -- A+, A, B+, B, C+, C, D, NG
  grade_np     VARCHAR(10),
  grade_point  NUMERIC(2,1)  NOT NULL,
  min_percent  NUMERIC(5,2)  NOT NULL,
  max_percent  NUMERIC(5,2)  NOT NULL,
  remark       VARCHAR(100),
  CONSTRAINT chk_grade_name CHECK (grade IN ('A+','A','B+','B','C+','C','D','NG')),
  CONSTRAINT chk_grade_gp   CHECK (grade_point >= 0 AND grade_point <= 4.0),
  CONSTRAINT chk_grade_band CHECK (min_percent <= max_percent
    AND min_percent >= 0 AND max_percent <= 100),
  CONSTRAINT uq_grade_per_scale UNIQUE (scale_id, grade)
);
CREATE INDEX IF NOT EXISTS idx_grade_lines_scale ON grade_scale_lines (scale_id, min_percent DESC);

-- Touching boundaries (90/90) are legal; real overlaps are rejected.
CREATE OR REPLACE FUNCTION validate_grade_band() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM grade_scale_lines g
    WHERE g.scale_id = NEW.scale_id AND g.line_id IS DISTINCT FROM NEW.line_id
      AND NEW.min_percent < g.max_percent AND NEW.max_percent > g.min_percent
      AND NOT (NEW.min_percent = g.max_percent OR NEW.max_percent = g.min_percent)) THEN
    RAISE EXCEPTION 'Grade band %–% overlaps an existing band in scale %',
      NEW.min_percent, NEW.max_percent, NEW.scale_id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_grade_band ON grade_scale_lines;
CREATE TRIGGER trg_grade_band BEFORE INSERT OR UPDATE ON grade_scale_lines
  FOR EACH ROW EXECUTE FUNCTION validate_grade_band();

-- Exams (one row per terminal/exam event; SEE/NEB board types included).
CREATE TABLE IF NOT EXISTS exams (
  exam_id            SERIAL PRIMARY KEY,
  school_id          INTEGER      NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  academic_year_id   INTEGER      NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
  term_id            INTEGER      REFERENCES terms(term_id) ON DELETE SET NULL,
  exam_name          VARCHAR(150) NOT NULL,
  exam_code          VARCHAR(50)  NOT NULL,
  exam_type          VARCHAR(20)  NOT NULL,
  class_id           INTEGER      REFERENCES classes(class_id) ON DELETE SET NULL,
  section_id         INTEGER      REFERENCES sections(section_id) ON DELETE SET NULL,
  status             VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
  is_result_published BOOLEAN     NOT NULL DEFAULT false,
  is_locked          BOOLEAN      NOT NULL DEFAULT false,
  remarks            TEXT,
  created_by         INTEGER      REFERENCES users(user_id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT chk_exam_type CHECK (exam_type IN
    ('UNIT_TEST','TERMINAL','FINAL','SEE','NEB','BOARD','OTHER')),
  CONSTRAINT chk_exam_status CHECK (status IN
    ('DRAFT','SCHEDULED','ONGOING','COMPLETED','PUBLISHED','LOCKED')),
  CONSTRAINT chk_exam_lock CHECK (NOT is_locked OR is_result_published),
  CONSTRAINT uq_exam_code UNIQUE (school_id, exam_code)
);
-- High-traffic: exam lists per year/class; publish workflow scans.
CREATE INDEX IF NOT EXISTS idx_exams_year_class ON exams (school_id, academic_year_id, class_id);
DROP TRIGGER IF EXISTS trg_exams_updated ON exams;
CREATE TRIGGER trg_exams_updated BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Per-subject schedule within an exam (full/pass copied from subject at
-- scheduling time so later syllabus changes don't rewrite history).
CREATE TABLE IF NOT EXISTS exam_schedules (
  schedule_id    SERIAL PRIMARY KEY,
  exam_id        INTEGER      NOT NULL REFERENCES exams(exam_id) ON DELETE CASCADE,
  class_id       INTEGER      NOT NULL REFERENCES classes(class_id) ON DELETE RESTRICT,
  subject_id     INTEGER      NOT NULL REFERENCES subjects(subject_id) ON DELETE RESTRICT,
  exam_date_ad   DATE         NOT NULL,
  exam_date_bs   VARCHAR(10),
  start_time     TIME,
  end_time       TIME,
  full_theory    NUMERIC(6,2) NOT NULL,
  full_practical NUMERIC(6,2) NOT NULL,
  pass_theory    NUMERIC(6,2) NOT NULL,
  pass_practical NUMERIC(6,2) NOT NULL,
  max_marks      NUMERIC(6,2) GENERATED ALWAYS AS (full_theory + full_practical) STORED,
  CONSTRAINT chk_sched_marks CHECK (full_theory >= 0 AND full_practical >= 0
    AND (full_theory + full_practical) > 0
    AND pass_theory <= full_theory AND pass_practical <= full_practical
    AND (exam_date_bs IS NULL OR exam_date_bs ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')),
  CONSTRAINT uq_sched UNIQUE (exam_id, class_id, subject_id)
);
CREATE INDEX IF NOT EXISTS idx_sched_exam ON exam_schedules (exam_id, exam_date_ad);

-- Marks: one row per (exam, student, subject). total is GENERATED; grade/point
-- are assigned by trigger from the school's default scale. Cross-table caps
-- (obtained <= full) cannot be CHECKs — enforced by trigger below.
CREATE TABLE IF NOT EXISTS marks (
  mark_id            BIGSERIAL PRIMARY KEY,
  school_id          INTEGER       NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  exam_id            INTEGER       NOT NULL REFERENCES exams(exam_id) ON DELETE CASCADE,
  student_id         INTEGER       NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  subject_id         INTEGER       NOT NULL REFERENCES subjects(subject_id) ON DELETE RESTRICT,
  class_id           INTEGER       NOT NULL REFERENCES classes(class_id) ON DELETE RESTRICT,
  theory_obtained    NUMERIC(6,2)  NOT NULL DEFAULT 0,
  practical_obtained NUMERIC(6,2)  NOT NULL DEFAULT 0,   -- CAS/internal
  total_obtained     NUMERIC(6,2)  GENERATED ALWAYS AS
    (COALESCE(theory_obtained,0) + COALESCE(practical_obtained,0)) STORED,
  is_absent          BOOLEAN       NOT NULL DEFAULT false,
  grade              VARCHAR(3),
  grade_point        NUMERIC(2,1),
  is_submitted       BOOLEAN       NOT NULL DEFAULT false,
  is_verified        BOOLEAN       NOT NULL DEFAULT false,
  verified_by        INTEGER       REFERENCES users(user_id) ON DELETE SET NULL,
  remarks            VARCHAR(255),
  created_by         INTEGER       REFERENCES users(user_id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT chk_marks_nonneg CHECK (theory_obtained >= 0 AND practical_obtained >= 0),
  CONSTRAINT chk_marks_absent CHECK (NOT is_absent OR (theory_obtained = 0 AND practical_obtained = 0)),
  CONSTRAINT uq_mark UNIQUE (exam_id, student_id, subject_id)
);
-- High-traffic: mark entry sheet (exam×class), student report card, publish scan.
CREATE INDEX IF NOT EXISTS idx_marks_exam_class ON marks (exam_id, class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks (student_id, exam_id);
DROP TRIGGER IF EXISTS trg_marks_updated ON marks;
CREATE TRIGGER trg_marks_updated BEFORE UPDATE ON marks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Guard: locked exams reject mark writes (result integrity after publish).
CREATE OR REPLACE FUNCTION guard_locked_exam() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v_lock BOOLEAN;
BEGIN
  SELECT is_locked INTO v_lock FROM exams
    WHERE exam_id = COALESCE(NEW.exam_id, OLD.exam_id);
  IF COALESCE(v_lock, false) THEN
    RAISE EXCEPTION 'Exam % is locked; marks are read-only', COALESCE(NEW.exam_id, OLD.exam_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS trg_marks_lock ON marks;
CREATE TRIGGER trg_marks_lock BEFORE INSERT OR UPDATE OR DELETE ON marks
  FOR EACH ROW EXECUTE FUNCTION guard_locked_exam();

-- Validate obtained <= scheduled full, then assign grade/point from scale.
CREATE OR REPLACE FUNCTION validate_and_grade_mark() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v_full_theory NUMERIC; v_full_prac NUMERIC; v_full NUMERIC;
        v_pct NUMERIC; v_scale INTEGER;
BEGIN
  IF NEW.is_absent THEN NEW.grade := 'NG'; NEW.grade_point := 0; RETURN NEW; END IF;
  SELECT s.full_theory, s.full_practical INTO v_full_theory, v_full_prac
    FROM exam_schedules s
   WHERE s.exam_id = NEW.exam_id AND s.subject_id = NEW.subject_id
     AND s.class_id = NEW.class_id;
  IF NOT FOUND THEN
    SELECT theory_full_marks, practical_full_marks INTO v_full_theory, v_full_prac
      FROM subjects WHERE subject_id = NEW.subject_id;
  END IF;
  IF NEW.theory_obtained > v_full_theory THEN
    RAISE EXCEPTION 'Theory % exceeds full % (exam %, subject %)',
      NEW.theory_obtained, v_full_theory, NEW.exam_id, NEW.subject_id;
  END IF;
  IF NEW.practical_obtained > v_full_prac THEN
    RAISE EXCEPTION 'Practical/CAS % exceeds full % (exam %, subject %)',
      NEW.practical_obtained, v_full_prac, NEW.exam_id, NEW.subject_id;
  END IF;
  v_full := v_full_theory + v_full_prac;
  v_pct := CASE WHEN v_full > 0
    THEN (NEW.theory_obtained + NEW.practical_obtained) * 100 / v_full ELSE 0 END;
  SELECT scale_id INTO v_scale FROM grade_scales
   WHERE school_id = NEW.school_id AND is_default AND is_active
   ORDER BY scale_id LIMIT 1;
  IF v_scale IS NULL THEN
    SELECT scale_id INTO v_scale FROM grade_scales
     WHERE school_id IS NULL AND scale_code = 'NEB-2078' AND is_active LIMIT 1;
  END IF;
  IF v_scale IS NOT NULL THEN
    SELECT grade, grade_point INTO NEW.grade, NEW.grade_point
      FROM grade_scale_lines WHERE scale_id = v_scale
       AND v_pct >= min_percent AND (v_pct < max_percent OR v_pct = 100)
      ORDER BY min_percent DESC LIMIT 1;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_marks_grade ON marks;
CREATE TRIGGER trg_marks_grade BEFORE INSERT OR UPDATE OF
  theory_obtained, practical_obtained, is_absent ON marks
  FOR EACH ROW EXECUTE FUNCTION validate_and_grade_mark();

-- Terminal aggregation for report cards. GPA = mean grade_point (credit
-- weighting is a documented extension); ranks filled by recompute_exam_ranks().
CREATE TABLE IF NOT EXISTS student_term_results (
  result_id        BIGSERIAL PRIMARY KEY,
  school_id        INTEGER       NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  exam_id          INTEGER       NOT NULL REFERENCES exams(exam_id) ON DELETE CASCADE,
  student_id       INTEGER       NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  academic_year_id INTEGER       NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
  class_id         INTEGER       NOT NULL REFERENCES classes(class_id) ON DELETE RESTRICT,
  section_id       INTEGER       REFERENCES sections(section_id) ON DELETE SET NULL,
  total_obtained   NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_full       NUMERIC(10,2) NOT NULL DEFAULT 0,
  percentage       NUMERIC(5,2)  NOT NULL DEFAULT 0,
  gpa              NUMERIC(3,2),
  overall_grade    VARCHAR(3),
  rank_in_class    INTEGER,
  rank_in_section  INTEGER,
  is_pass          BOOLEAN       NOT NULL DEFAULT false,
  published_at     TIMESTAMPTZ,
  CONSTRAINT chk_result_pct CHECK (percentage >= 0 AND percentage <= 100),
  CONSTRAINT chk_result_gpa CHECK (gpa IS NULL OR (gpa >= 0 AND gpa <= 4.0)),
  CONSTRAINT uq_term_result UNIQUE (exam_id, student_id)
);
-- High-traffic: merit lists + report cards per exam/class.
CREATE INDEX IF NOT EXISTS idx_results_exam_class ON student_term_results (exam_id, class_id, gpa DESC NULLS LAST);

-- Rebuild one exam's aggregates (call after mark entry / before publish).
CREATE OR REPLACE FUNCTION recompute_term_result(p_exam_id INTEGER, p_student_id INTEGER)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_school INTEGER; v_year INTEGER; v_class INTEGER; v_sec INTEGER;
        v_tot NUMERIC; v_full NUMERIC; v_pct NUMERIC; v_gpa NUMERIC;
        v_grade VARCHAR(3); v_scale INTEGER; v_pass BOOLEAN;
BEGIN
  SELECT e.school_id, e.academic_year_id INTO v_school, v_year
    FROM exams e WHERE e.exam_id = p_exam_id;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT m.class_id INTO v_class FROM marks m
   WHERE m.exam_id = p_exam_id AND m.student_id = p_student_id LIMIT 1;
  SELECT en.section_id INTO v_sec FROM enrollments en
   WHERE en.student_id = p_student_id AND en.academic_year_id = v_year;
  SELECT COALESCE(SUM(m.total_obtained),0),
         COALESCE(SUM(COALESCE(s.max_marks,
           (SELECT theory_full_marks + practical_full_marks FROM subjects sb
             WHERE sb.subject_id = m.subject_id))),0),
         AVG(m.grade_point)
    INTO v_tot, v_full, v_gpa
    FROM marks m LEFT JOIN exam_schedules s
      ON s.exam_id = m.exam_id AND s.subject_id = m.subject_id AND s.class_id = m.class_id
   WHERE m.exam_id = p_exam_id AND m.student_id = p_student_id;
  v_pct := CASE WHEN v_full > 0 THEN v_tot * 100 / v_full ELSE 0 END;
  SELECT scale_id INTO v_scale FROM grade_scales
   WHERE school_id = v_school AND is_default AND is_active ORDER BY scale_id LIMIT 1;
  IF v_scale IS NULL THEN
    SELECT scale_id INTO v_scale FROM grade_scales
     WHERE school_id IS NULL AND scale_code = 'NEB-2078' AND is_active LIMIT 1;
  END IF;
  IF v_scale IS NOT NULL THEN
    SELECT grade INTO v_grade FROM grade_scale_lines WHERE scale_id = v_scale
     AND v_pct >= min_percent AND (v_pct < max_percent OR v_pct = 100)
     ORDER BY min_percent DESC LIMIT 1;
  END IF;
  SELECT NOT EXISTS (SELECT 1 FROM marks m
    WHERE m.exam_id = p_exam_id AND m.student_id = p_student_id
      AND (m.grade = 'NG' OR m.is_absent)) INTO v_pass;
  INSERT INTO student_term_results
    (school_id, exam_id, student_id, academic_year_id, class_id, section_id,
     total_obtained, total_full, percentage, gpa, overall_grade, is_pass)
  VALUES (v_school, p_exam_id, p_student_id, v_year, COALESCE(v_class,0), v_sec,
     v_tot, v_full, v_pct, v_gpa, v_grade, COALESCE(v_pass,false))
  ON CONFLICT (exam_id, student_id) DO UPDATE SET
    total_obtained = EXCLUDED.total_obtained, total_full = EXCLUDED.total_full,
    percentage = EXCLUDED.percentage, gpa = EXCLUDED.gpa,
    overall_grade = EXCLUDED.overall_grade, is_pass = EXCLUDED.is_pass,
    class_id = EXCLUDED.class_id, section_id = EXCLUDED.section_id;
END $$;

-- Keep aggregates fresh on every mark write.
CREATE OR REPLACE FUNCTION trg_marks_recompute() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM recompute_term_result(COALESCE(NEW.exam_id, OLD.exam_id),
                                COALESCE(NEW.student_id, OLD.student_id));
  IF TG_OP = 'UPDATE' AND (OLD.exam_id <> NEW.exam_id OR OLD.student_id <> NEW.student_id) THEN
    PERFORM recompute_term_result(OLD.exam_id, OLD.student_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS trg_marks_agg ON marks;
CREATE TRIGGER trg_marks_agg AFTER INSERT OR UPDATE OR DELETE ON marks
  FOR EACH ROW EXECUTE FUNCTION trg_marks_recompute();

-- Rank computation (window RANK; ties share rank). Run after entry closes.
CREATE OR REPLACE FUNCTION recompute_exam_ranks(p_exam_id INTEGER)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  WITH ranked AS (
    SELECT result_id,
           RANK() OVER (PARTITION BY class_id ORDER BY gpa DESC NULLS LAST, percentage DESC) AS rc,
           RANK() OVER (PARTITION BY class_id, section_id ORDER BY gpa DESC NULLS LAST, percentage DESC) AS rs
      FROM student_term_results WHERE exam_id = p_exam_id)
  UPDATE student_term_results r SET rank_in_class = k.rc, rank_in_section = k.rs
    FROM ranked k WHERE k.result_id = r.result_id;
END $$;

-- ============================================================================
-- SEEDS (idempotent): CEHRD caste groups + national NEB-2078 grade template
-- ============================================================================
INSERT INTO caste_ethnicity_groups (caste_code, name_en, name_np, category, iemis_group) VALUES
  ('01A','Brahmin-Hill','बाहुन-थर','BRAHMIN_CHHETRI','Brahmin/Chhetri'),
  ('02B','Chhetri','क्षेत्री','BRAHMIN_CHHETRI','Brahmin/Chhetri'),
  ('03M','Madhesi','मधेसी','MADHESI','Madhesi'),
  ('04D','Dalit-Hill','दलित-पहाड','DALIT','Dalit'),
  ('05E','Dalit-Terai','दलित-तराई','DALIT','Dalit'),
  ('06J','Janajati-Hill','जनजाति-पहाड','JANAJATI','Janajati'),
  ('07K','Janajati-Terai','जनजाति-तराई','JANAJATI','Janajati'),
  ('08U','Muslim','मुस्लिम','MUSLIM','Muslim'),
  ('09T','Tharu','थारु','THARU','Tharu'),
  ('10N','Newar','नेवार','NEWAR','Newar')
ON CONFLICT (caste_code) DO NOTHING;

INSERT INTO grade_scales (school_id, scale_code, scale_name, is_default, is_active) VALUES
  (NULL, 'NEB-2078', 'NEB Letter Grading Guideline 2078 (national template)', false, true)
ON CONFLICT (school_id, scale_code) DO NOTHING;

-- Continuous bounds: lookup is percent >= min AND (percent < max OR =100),
-- so 90 → A+, 80 → A, …, 35 → D, 34.99 → NG. Matches NEB_GRADING constants.
INSERT INTO grade_scale_lines (scale_id, grade, grade_np, grade_point, min_percent, max_percent, remark)
SELECT s.scale_id, v.grade, v.grade_np, v.gp, v.minp, v.maxp, v.remark
FROM grade_scales s JOIN (VALUES
  ('A+','अ+',4.0,90,100,'Outstanding'),
  ('A','अ',3.6,80,90,'Excellent'),
  ('B+','ब+',3.2,70,80,'Very Good'),
  ('B','ब',2.8,60,70,'Good'),
  ('C+','स+',2.4,50,60,'Satisfactory'),
  ('C','स',2.0,40,50,'Acceptable'),
  ('D','डि',1.6,35,40,'Basic'),
  ('NG','एनजी',0,0,35,'Not Graded')
) AS v(grade, grade_np, gp, minp, maxp, remark) ON true
WHERE s.school_id IS NULL AND s.scale_code = 'NEB-2078'
ON CONFLICT (scale_id, grade) DO UPDATE SET
  grade_point = EXCLUDED.grade_point, min_percent = EXCLUDED.min_percent,
  max_percent = EXCLUDED.max_percent, remark = EXCLUDED.remark;
