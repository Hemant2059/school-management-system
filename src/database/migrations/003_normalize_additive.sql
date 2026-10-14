-- ============================================================================
-- Migration 003: Phase-2 normalization, step 1 — ADDITIVE tables (no collisions)
-- ============================================================================
-- Promotes every 001_nepal_core object whose NAME does not collide with a
-- legacy initSchema table. Zero service breakage: no existing table is
-- altered, only new ones are added. RLS for the new tables is applied here
-- (002 already ran on existing DBs and will not re-run).
--
-- PROMOTED VERBATIM from 001 (same names/columns/constraints/indexes/triggers)
--   fiscal_years, academic_years, terms, caste_ethnicity_groups,
--   scholarships, student_scholarships, enrollments, transport_routes,
--   hostel_allocations, fee_heads, discount_rules, penalty_rules,
--   fee_invoices (+updated_at trigger), fee_invoice_lines (+totals trigger),
--   student_fee_discounts, payment_allocations (+paid trigger),
--   class_subjects, grade_scale_lines (+band trigger), exam_schedules,
--   student_term_results, caste seed, set_updated_at().
--
-- DEFERRED to reshape migrations (name collides, different shape — services
-- today read the legacy shapes; reshaping them means rewriting services):
--   classes, sections, subjects, students, guardians, teachers,
--   student_guardians, transport_assignments, hostels, fee_structures,
--   payments, grade_scales (+ NEB-2078 seed), exams, marks.
--
-- INTERIM DEVIATIONS from 001 (reverted at reshape time, each marked below):
--   D1 payment_allocations.payment_id is INTEGER (legacy payments PK is
--      SERIAL; PG rejects bigint->integer FK). 001's BIGINT returns with the
--      payments reshape.
--   D2 grade_scale_lines.scale_id has NO FK (legacy grade_scales PK is id,
--      not scale_id). FK + NEB seed return with the grade_scales reshape.
--   D3 exam_schedules chk parenthesised: 001's
--      "... AND exam_date_bs IS NULL OR exam_date_bs ~ ..." parses as
--      "(... AND bs IS NULL) OR (bs ~ ...)", letting a matching BS date
--      bypass the other checks. Fixed here AND in 001 (kept identical).
-- ============================================================================

-- Reusable updated_at trigger (same as 001).
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

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

-- Yearly enrollment: exactly one row per student per session.
-- (Coexists with legacy student_enrollments until the reshape retires it.)
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

-- Transport master feeding the fee engine (TRANSPORT head invoiced off
-- monthly_fee). Coexists with legacy routes/transports until reshape.
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

-- Split one payment across invoices (partial / advance handling).
-- D1: payment_id is INTEGER here (legacy payments PK is SERIAL); 001's BIGINT
-- returns with the payments reshape.
CREATE TABLE IF NOT EXISTS payment_allocations (
  allocation_id BIGSERIAL PRIMARY KEY,
  payment_id    INTEGER       NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
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

-- Which subjects a class takes in a session.
CREATE TABLE IF NOT EXISTS class_subjects (
  class_id         INTEGER NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
  subject_id       INTEGER NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
  academic_year_id INTEGER NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
  is_compulsory    BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT pk_class_subject PRIMARY KEY (class_id, subject_id, academic_year_id)
);

-- Grade bands. D2: scale_id has NO FK here (legacy grade_scales PK is id,
-- not scale_id); FK + NEB-2078 seed return with the grade_scales reshape.
CREATE TABLE IF NOT EXISTS grade_scale_lines (
  line_id      SERIAL PRIMARY KEY,
  scale_id     INTEGER       NOT NULL,
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

-- Per-subject schedule within an exam (full/pass copied from subject at
-- scheduling time so later syllabus changes don't rewrite history).
-- D3: parenthesised BS-date branch (001 had "... AND bs IS NULL OR bs ~ ..."
-- which parses as "(... AND bs IS NULL) OR (bs ~ ...)", letting a matching BS
-- date bypass the other checks). Fixed here and in 001 alike.
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

-- Terminal aggregation for report cards. GPA/ranks filled by the Phase-2
-- reshape migration's recompute functions (which need the marks reshape).
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

-- CEHRD caste/ethnicity seed (idempotent).
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

-- ============================================================================
-- RLS for the new tables. school_id tables go through the reusable function
-- (defined here so later migrations just SELECT apply_tenant_rls()); link
-- tables get explicit guarded policies, mirroring 002's pattern.
-- ============================================================================
CREATE OR REPLACE FUNCTION apply_tenant_rls() RETURNS void
LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT t.tablename FROM pg_tables t
    JOIN information_schema.columns c
      ON c.table_schema = t.schemaname AND c.table_name = t.tablename
     AND c.column_name = 'school_id'
    WHERE t.schemaname = 'public'
      AND t.tablename NOT IN (
        'users', 'schools',            -- pre-context lookups
        'grade_scales',                -- custom global-template rule
        'school_members',              -- own policy (membership checks)
        'provinces','districts','local_bodies','wards',  -- global geo
        'fiscal_years','caste_ethnicity_groups'          -- global masters
      )
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.tablename);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', r.tablename);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (school_id = current_school_id()) WITH CHECK (school_id = current_school_id())',
      r.tablename);
  END LOOP;
END $$;

SELECT apply_tenant_rls();

-- student_scholarships has no school_id (scoped via students); 002 predates
-- it, so its policy lands here.
DO $$ BEGIN
  IF to_regclass('public.student_scholarships') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = to_regclass('public.student_scholarships') AND polname = 'tenant_ownership') THEN
    ALTER TABLE student_scholarships ENABLE ROW LEVEL SECURITY;
    ALTER TABLE student_scholarships FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON student_scholarships;
    CREATE POLICY tenant_isolation ON student_scholarships
      USING (EXISTS (SELECT 1 FROM students s
                     WHERE s.student_id = student_scholarships.student_id
                       AND s.school_id = current_school_id()))
      WITH CHECK (EXISTS (SELECT 1 FROM students s
                     WHERE s.student_id = student_scholarships.student_id
                       AND s.school_id = current_school_id()));
  END IF;
END $$;

-- grade_scale_lines, INTERIM: legacy grade_scales PK is id (not scale_id).
-- Global-template readability preserved; reshape restores the 001 FK + policy.
DO $$ BEGIN
  IF to_regclass('public.grade_scale_lines') IS NOT NULL
     AND to_regclass('public.grade_scales') IS NOT NULL THEN
    ALTER TABLE grade_scale_lines ENABLE ROW LEVEL SECURITY;
    ALTER TABLE grade_scale_lines FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON grade_scale_lines;
    CREATE POLICY tenant_isolation ON grade_scale_lines
      USING (EXISTS (SELECT 1 FROM grade_scales s
                     WHERE s.id = grade_scale_lines.scale_id
                       AND (s.school_id IS NULL OR s.school_id = current_school_id())))
      WITH CHECK (EXISTS (SELECT 1 FROM grade_scales s
                     WHERE s.id = grade_scale_lines.scale_id
                       AND s.school_id = current_school_id()));
  END IF;
END $$;

-- The remaining link tables below were absent when 002 ran, so 002's guarded
-- blocks skipped them; (re)applied here idempotently.
DO $$ BEGIN
  IF to_regclass('public.fee_invoice_lines') IS NOT NULL
     AND to_regclass('public.fee_invoices') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = to_regclass('public.fee_invoice_lines') AND polname = 'tenant_ownership') THEN
    ALTER TABLE fee_invoice_lines ENABLE ROW LEVEL SECURITY;
    ALTER TABLE fee_invoice_lines FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON fee_invoice_lines;
    CREATE POLICY tenant_isolation ON fee_invoice_lines
      USING (EXISTS (SELECT 1 FROM fee_invoices i
                     WHERE i.invoice_id = fee_invoice_lines.invoice_id
                       AND i.school_id = current_school_id()))
      WITH CHECK (EXISTS (SELECT 1 FROM fee_invoices i
                     WHERE i.invoice_id = fee_invoice_lines.invoice_id
                       AND i.school_id = current_school_id()));
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.payment_allocations') IS NOT NULL
     AND to_regclass('public.fee_invoices') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = to_regclass('public.payment_allocations') AND polname = 'tenant_ownership') THEN
    ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE payment_allocations FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON payment_allocations;
    CREATE POLICY tenant_isolation ON payment_allocations
      USING (EXISTS (SELECT 1 FROM fee_invoices i
                     WHERE i.invoice_id = payment_allocations.invoice_id
                       AND i.school_id = current_school_id()))
      WITH CHECK (EXISTS (SELECT 1 FROM fee_invoices i
                     WHERE i.invoice_id = payment_allocations.invoice_id
                       AND i.school_id = current_school_id()));
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.terms') IS NOT NULL
     AND to_regclass('public.academic_years') IS NOT NULL THEN
    ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
    ALTER TABLE terms FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON terms;
    CREATE POLICY tenant_isolation ON terms
      USING (EXISTS (SELECT 1 FROM academic_years a
                     WHERE a.academic_year_id = terms.academic_year_id
                       AND a.school_id = current_school_id()))
      WITH CHECK (EXISTS (SELECT 1 FROM academic_years a
                     WHERE a.academic_year_id = terms.academic_year_id
                       AND a.school_id = current_school_id()));
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.class_subjects') IS NOT NULL THEN
    ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
    ALTER TABLE class_subjects FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON class_subjects;
    CREATE POLICY tenant_isolation ON class_subjects
      USING (EXISTS (SELECT 1 FROM classes c
                     WHERE c.class_id = class_subjects.class_id
                       AND c.school_id = current_school_id()))
      WITH CHECK (EXISTS (SELECT 1 FROM classes c
                     WHERE c.class_id = class_subjects.class_id
                       AND c.school_id = current_school_id()));
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.exam_schedules') IS NOT NULL THEN
    ALTER TABLE exam_schedules ENABLE ROW LEVEL SECURITY;
    ALTER TABLE exam_schedules FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON exam_schedules;
    CREATE POLICY tenant_isolation ON exam_schedules
      USING (EXISTS (SELECT 1 FROM exams e
                     WHERE e.exam_id = exam_schedules.exam_id
                       AND e.school_id = current_school_id()))
      WITH CHECK (EXISTS (SELECT 1 FROM exams e
                     WHERE e.exam_id = exam_schedules.exam_id
                       AND e.school_id = current_school_id()));
  END IF;
END $$;
