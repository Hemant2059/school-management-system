-- ============================================================================
-- Migration 010: row-ownership scoping (low-level RBAC) on top of tenancy
-- ============================================================================
-- Two layers, by design:
--   PermissionsGuard = COARSE action gates (can you open this endpoint).
--   RLS below       = ROW ownership (which rows you may see).
-- A teacher with result:read passes the guard but RLS limits rows to their
-- assigned classes/subjects; a student/parent sees only self/linked rows;
-- back-office identities (no student/guardian/teacher link) keep full
-- tenant visibility. Sessions with school set but no user keep legacy
-- tenant-wide visibility (background jobs, admin tooling); every login sets
-- a user id via the interceptor, so identity holders are always scoped.
--
-- MECHANICS
--   * app.current_user_id rides with app.current_school_id (ALS plumbing in
--     DatabaseService; both set via set_config(..., true) per transaction).
--   * Helper functions are SECURITY DEFINER (owner bypasses RLS) so policies
--     never recurse into each other. search_path pinned against hijack.
--   * Every ownership rule ALSO pins school to current_school_id() inside the
--     helper — callers pass row values, never trust them for tenancy.
--   * teacher_assignments (teacher x year x class x [section] x [subject];
--     NULL section/subject = all) is the only new grant surface.
--   * apply_tenant_rls() is REPLACED with an exclusion list: re-running it
--     must never resurrect the plain tenant policy alongside these combined
--     ones (two permissive policies OR together -> leak).
-- KNOWN EDGES (v1): dual-role users (teacher+parent) are scoped as teachers
--   everywhere except their own children's subject rows; teachers never see
--   fee rows (financial privacy); subject-less legacy mark rows are invisible
--   to teachers (no subject to match).
-- ============================================================================

CREATE OR REPLACE FUNCTION current_user_id() RETURNS integer
LANGUAGE sql STABLE AS $$
  SELECT CASE WHEN current_setting('app.current_user_id', true) ~ '^[0-9]+$'
    THEN current_setting('app.current_user_id', true)::integer
    ELSE NULL END
$$;

-- Teacher <-> class/section/subject grants, per academic session.
CREATE TABLE IF NOT EXISTS teacher_assignments (
  assignment_id    BIGSERIAL PRIMARY KEY,
  school_id        INTEGER NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  teacher_id       BIGINT  NOT NULL REFERENCES teachers(teacher_id) ON DELETE CASCADE,
  academic_year_id INTEGER NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
  class_id         INTEGER NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
  section_id       INTEGER REFERENCES sections(section_id) ON DELETE CASCADE,
  subject_id       INTEGER REFERENCES subjects(subject_id) ON DELETE CASCADE,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_teacher_assign UNIQUE NULLS NOT DISTINCT
    (teacher_id, academic_year_id, class_id, section_id, subject_id)
);
CREATE INDEX IF NOT EXISTS idx_ta_teacher_year ON teacher_assignments (teacher_id, academic_year_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_ta_class ON teacher_assignments (school_id, academic_year_id, class_id) WHERE is_active;
DROP TRIGGER IF EXISTS trg_ta_updated ON teacher_assignments;
CREATE TRIGGER trg_ta_updated BEFORE UPDATE ON teacher_assignments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- --------------------------------------------------------------------------
-- Ownership helpers (SECURITY DEFINER: policy-safe, no recursion)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_identity_user() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM students  WHERE user_id = current_user_id())
      OR EXISTS (SELECT 1 FROM guardians WHERE user_id = current_user_id())
      OR EXISTS (SELECT 1 FROM teachers  WHERE user_id = current_user_id())
$$;

-- Core student visibility: tenant-pinned + (open staff OR self/parent/teaches).
CREATE OR REPLACE FUNCTION can_see_student(p_school integer, p_student integer)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT p_school = current_school_id()
     AND EXISTS (SELECT 1 FROM students s WHERE s.student_id = p_student AND s.school_id = p_school)
     AND (NOT is_identity_user()
          OR EXISTS (SELECT 1 FROM students s WHERE s.student_id = p_student AND s.user_id = current_user_id())
          OR EXISTS (SELECT 1 FROM student_guardians sg JOIN guardians g ON g.guardian_id = sg.guardian_id
                     WHERE sg.student_id = p_student AND g.user_id = current_user_id())
          OR EXISTS (SELECT 1 FROM teacher_assignments ta JOIN teachers t ON t.teacher_id = ta.teacher_id
                     JOIN enrollments e ON e.student_id = p_student
                                        AND e.academic_year_id = ta.academic_year_id
                                        AND e.class_id = ta.class_id
                                        AND (ta.section_id IS NULL OR e.section_id = ta.section_id)
                     WHERE t.user_id = current_user_id() AND ta.school_id = p_school AND ta.is_active))
$$;

-- Marks add the subject dimension for teacher identities (plus a guardian
-- exception so teacher-parents still see their own children's rows).
CREATE OR REPLACE FUNCTION can_see_subject_marks(p_school integer, p_student integer, p_subject integer)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT can_see_student(p_school, p_student)
     AND (NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id())
          -- NULL-subject legacy rows match only all-subjects assignments
          OR EXISTS (SELECT 1 FROM student_guardians sg JOIN guardians g ON g.guardian_id = sg.guardian_id
                     WHERE sg.student_id = p_student AND g.user_id = current_user_id())
          OR EXISTS (SELECT 1 FROM teacher_assignments ta JOIN teachers t ON t.teacher_id = ta.teacher_id
                     JOIN enrollments e ON e.student_id = p_student
                                        AND e.academic_year_id = ta.academic_year_id
                                        AND e.class_id = ta.class_id
                                        AND (ta.section_id IS NULL OR e.section_id = ta.section_id)
                     WHERE t.user_id = current_user_id() AND ta.school_id = p_school AND ta.is_active
                       AND (ta.subject_id IS NULL OR ta.subject_id = p_subject)))
$$;

-- Invoices: self/parent only (teachers are out of financial scope by design).
CREATE OR REPLACE FUNCTION can_see_invoice(p_invoice bigint)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM fee_invoices i
                 WHERE i.invoice_id = p_invoice AND i.school_id = current_school_id()
                   AND (NOT is_identity_user()
                        OR EXISTS (SELECT 1 FROM students s WHERE s.student_id = i.student_id AND s.user_id = current_user_id())
                        OR EXISTS (SELECT 1 FROM student_guardians sg JOIN guardians g ON g.guardian_id = sg.guardian_id
                                   WHERE sg.student_id = i.student_id AND g.user_id = current_user_id())))
$$;

-- --------------------------------------------------------------------------
-- Combined policies (each REPLACES the plain tenant_isolation on its table)
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_isolation ON students;
DROP POLICY IF EXISTS tenant_ownership ON students;
CREATE POLICY tenant_ownership ON students
  USING (can_see_student(school_id, student_id))
  WITH CHECK (school_id = current_school_id());

DROP POLICY IF EXISTS tenant_isolation ON guardians;
DROP POLICY IF EXISTS tenant_ownership ON guardians;
CREATE POLICY tenant_ownership ON guardians
  USING (school_id = current_school_id()
         AND (NOT is_identity_user()
              OR guardians.user_id = current_user_id()
              OR EXISTS (SELECT 1 FROM student_guardians sg JOIN students s ON s.student_id = sg.student_id
                         WHERE sg.guardian_id = guardians.guardian_id
                           AND can_see_student(s.school_id, s.student_id))))
  WITH CHECK (school_id = current_school_id());

DROP POLICY IF EXISTS tenant_isolation ON student_guardians;
DROP POLICY IF EXISTS tenant_ownership ON student_guardians;
CREATE POLICY tenant_ownership ON student_guardians
  USING (EXISTS (SELECT 1 FROM students s WHERE s.student_id = student_guardians.student_id
                   AND can_see_student(s.school_id, s.student_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM students s WHERE s.student_id = student_guardians.student_id
                   AND s.school_id = current_school_id()));

DROP POLICY IF EXISTS tenant_isolation ON marks;
DROP POLICY IF EXISTS tenant_ownership ON marks;
CREATE POLICY tenant_ownership ON marks
  USING (can_see_subject_marks(school_id, student_id, subject_id))
  WITH CHECK (school_id = current_school_id());

DROP POLICY IF EXISTS tenant_isolation ON attendance;
DROP POLICY IF EXISTS tenant_ownership ON attendance;
CREATE POLICY tenant_ownership ON attendance
  USING (can_see_student(school_id, student_id))
  WITH CHECK (school_id = current_school_id());

DROP POLICY IF EXISTS tenant_isolation ON attendance_records;
DROP POLICY IF EXISTS tenant_ownership ON attendance_records;
CREATE POLICY tenant_ownership ON attendance_records
  USING (EXISTS (SELECT 1 FROM students s WHERE s.student_id = attendance_records.student_id
                   AND can_see_student(s.school_id, s.student_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM students s WHERE s.student_id = attendance_records.student_id
                   AND s.school_id = current_school_id()));

DROP POLICY IF EXISTS tenant_isolation ON enrollments;
DROP POLICY IF EXISTS tenant_ownership ON enrollments;
CREATE POLICY tenant_ownership ON enrollments
  USING (can_see_student(school_id, student_id))
  WITH CHECK (school_id = current_school_id());

DROP POLICY IF EXISTS tenant_isolation ON fee_invoices;
DROP POLICY IF EXISTS tenant_ownership ON fee_invoices;
CREATE POLICY tenant_ownership ON fee_invoices
  USING (can_see_invoice(invoice_id))
  WITH CHECK (school_id = current_school_id());

DROP POLICY IF EXISTS tenant_isolation ON fee_invoice_lines;
DROP POLICY IF EXISTS tenant_ownership ON fee_invoice_lines;
CREATE POLICY tenant_ownership ON fee_invoice_lines
  USING (can_see_invoice(invoice_id))
  WITH CHECK (EXISTS (SELECT 1 FROM fee_invoices i WHERE i.invoice_id = fee_invoice_lines.invoice_id
                   AND i.school_id = current_school_id()));

DROP POLICY IF EXISTS tenant_isolation ON fees;
DROP POLICY IF EXISTS tenant_ownership ON fees;
CREATE POLICY tenant_ownership ON fees
  USING (school_id = current_school_id()
         AND (NOT is_identity_user()
              OR EXISTS (SELECT 1 FROM students s WHERE s.student_id = fees.student_id AND s.user_id = current_user_id())
              OR EXISTS (SELECT 1 FROM student_guardians sg JOIN guardians g ON g.guardian_id = sg.guardian_id
                         WHERE sg.student_id = fees.student_id AND g.user_id = current_user_id())))
  WITH CHECK (school_id = current_school_id());

DROP POLICY IF EXISTS tenant_isolation ON payments;
DROP POLICY IF EXISTS tenant_ownership ON payments;
CREATE POLICY tenant_ownership ON payments
  USING (school_id = current_school_id()
         AND (NOT is_identity_user()
              OR EXISTS (SELECT 1 FROM students s WHERE s.student_id = payments.student_id AND s.user_id = current_user_id())
              OR EXISTS (SELECT 1 FROM student_guardians sg JOIN guardians g ON g.guardian_id = sg.guardian_id
                         WHERE sg.student_id = payments.student_id AND g.user_id = current_user_id())))
  WITH CHECK (school_id = current_school_id());

DROP POLICY IF EXISTS tenant_isolation ON payment_allocations;
DROP POLICY IF EXISTS tenant_ownership ON payment_allocations;
CREATE POLICY tenant_ownership ON payment_allocations
  USING (can_see_invoice(invoice_id))
  WITH CHECK (EXISTS (SELECT 1 FROM fee_invoices i WHERE i.invoice_id = payment_allocations.invoice_id
                   AND i.school_id = current_school_id()));

DROP POLICY IF EXISTS tenant_isolation ON student_fee_discounts;
DROP POLICY IF EXISTS tenant_ownership ON student_fee_discounts;
CREATE POLICY tenant_ownership ON student_fee_discounts
  USING (school_id = current_school_id()
         AND (NOT is_identity_user()
              OR EXISTS (SELECT 1 FROM students s WHERE s.student_id = student_fee_discounts.student_id AND s.user_id = current_user_id())
              OR EXISTS (SELECT 1 FROM student_guardians sg JOIN guardians g ON g.guardian_id = sg.guardian_id
                         WHERE sg.student_id = student_fee_discounts.student_id AND g.user_id = current_user_id())))
  WITH CHECK (school_id = current_school_id());

DROP POLICY IF EXISTS tenant_isolation ON student_scholarships;
DROP POLICY IF EXISTS tenant_ownership ON student_scholarships;
CREATE POLICY tenant_ownership ON student_scholarships
  USING (EXISTS (SELECT 1 FROM students s WHERE s.student_id = student_scholarships.student_id
                   AND can_see_student(s.school_id, s.student_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM students s WHERE s.student_id = student_scholarships.student_id
                   AND s.school_id = current_school_id()));

DROP POLICY IF EXISTS tenant_isolation ON fee_transactions;
DROP POLICY IF EXISTS tenant_ownership ON fee_transactions;
CREATE POLICY tenant_ownership ON fee_transactions
  USING (EXISTS (SELECT 1 FROM student_fees sf JOIN students s ON s.student_id = sf.student_id
                 WHERE sf.id = fee_transactions.student_fee_id
                   AND can_see_student(s.school_id, s.student_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM student_fees sf JOIN students s ON s.student_id = sf.student_id
                 WHERE sf.id = fee_transactions.student_fee_id
                   AND s.school_id = current_school_id()));

-- --------------------------------------------------------------------------
-- apply_tenant_rls(): ownership tables excluded (re-create would OR-widen).
-- --------------------------------------------------------------------------
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
        'fiscal_years','caste_ethnicity_groups',         -- global masters
        'students','guardians',        -- ownership (010)
        'marks','attendance','attendance_records','enrollments',
        'fee_invoices','fees','payments','student_fee_discounts'
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
