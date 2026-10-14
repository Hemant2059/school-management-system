-- ============================================================================
-- Migration 002: Multi-tenancy hardening — memberships + Row Level Security
-- Runtime: raw pg, applies on top of legacy initSchema shapes AND 001 shapes.
-- ============================================================================
-- WHAT THIS DOES
--   1. school_members (user × school) so one login can belong to many schools.
--   2. Backfills memberships from the legacy single users.school_id column.
--   3. Schools hardening columns (subdomain, status) — ADD COLUMN IF NOT EXISTS.
--   4. current_school_id() helper: fail-closed parse of app.current_school_id.
--   5. ENABLE + FORCE RLS with tenant_isolation policies on:
--        a. every table carrying its own school_id (dynamic loop), EXCEPT
--           users/schools (see below) and grade_scales (custom global rule);
--        b. link tables scoped through a parent (explicit, guarded blocks).
--   6. DOES NOT create app roles. The app must connect as a NON-superuser,
--      non-owner role in staging/prod (else RLS is bypassed). Dev docker
--      (postgres superuser) is unaffected — enforcement is proven by the
--      RLS matrix spec via SET ROLE. See docs + TenantTx (SET LOCAL).
--
-- DELIBERATELY NOT RLS-COVERED
--   users, schools — login/tenant-directory lookups run pre-tenant-context;
--   the app MUST always scope these by school_id (MultiTenancyGuard +
--   TenantInterceptor remain as defense-in-depth). service/infra tables
--   without tenant scope (sync_queue, rate_limits, provinces/districts/
--   local_bodies/wards, fiscal_years, caste_ethnicity_groups) are skipped.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 0. Fail-closed tenant setting helper (missing/garbage => NULL => no rows)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_school_id() RETURNS integer
LANGUAGE sql STABLE AS $$
  SELECT CASE WHEN current_setting('app.current_school_id', true) ~ '^[0-9]+$'
    THEN current_setting('app.current_school_id', true)::integer
    ELSE NULL END
$$;

-- --------------------------------------------------------------------------
-- 1. Memberships: one user, many schools (replaces users.school_id as the
--    single source of tenant access; that column stays as the DEFAULT school)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_members (
  user_id    INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  school_id  INTEGER NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
  status     VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_member_status CHECK (status IN ('ACTIVE','SUSPENDED')),
  CONSTRAINT pk_school_members PRIMARY KEY (user_id, school_id)
);
CREATE INDEX IF NOT EXISTS idx_school_members_school ON school_members (school_id, status);

-- Backfill from legacy single-school column (idempotent).
INSERT INTO school_members (user_id, school_id, status)
SELECT user_id, school_id, 'ACTIVE' FROM users WHERE school_id IS NOT NULL
ON CONFLICT (user_id, school_id) DO NOTHING;

-- --------------------------------------------------------------------------
-- 2. Schools hardening (SaaS directory fields; safe on legacy shape)
-- --------------------------------------------------------------------------
ALTER TABLE schools ADD COLUMN IF NOT EXISTS subdomain VARCHAR(100);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_school_status') THEN
    ALTER TABLE schools ADD CONSTRAINT chk_school_status
      CHECK (status IN ('TRIAL','ACTIVE','SUSPENDED','ARCHIVED'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_school_subdomain') THEN
    ALTER TABLE schools ADD CONSTRAINT uq_school_subdomain UNIQUE (subdomain);
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 3a. RLS on every table with its own school_id (dynamic; future-proof:
--     covers 001 tables once Phase-2 normalization lands them)
-- --------------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT t.tablename FROM pg_tables t
    JOIN information_schema.columns c
      ON c.table_schema = t.schemaname AND c.table_name = t.tablename
     AND c.column_name = 'school_id'
    WHERE t.schemaname = 'public'
      AND t.tablename NOT IN (
        'users', 'schools',            -- pre-context lookups (see header)
        'grade_scales',                -- custom global-template rule below
        'school_members',              -- handled with users (pre-context)
        'provinces','districts','local_bodies','wards',  -- global geo
        'fiscal_years','caste_ethnicity_groups',         -- global masters
        -- ownership-managed (010): a plain tenant policy here would
        -- OR-widen alongside tenant_ownership and defeat row scoping
        'students','guardians',
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

-- --------------------------------------------------------------------------
-- 3b. school_members: scoped like users (membership checks run pre-context
--     via admin path, but belt-and-braces RLS for tenant sessions)
-- --------------------------------------------------------------------------
ALTER TABLE school_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_members FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON school_members;
CREATE POLICY tenant_isolation ON school_members
  USING (school_id = current_school_id()) WITH CHECK (school_id = current_school_id());

-- --------------------------------------------------------------------------
-- 3c. grade_scales: tenants read the national template (school_id NULL),
--     but can only write their own school's scales
-- --------------------------------------------------------------------------
DO $$ BEGIN
  IF to_regclass('public.grade_scales') IS NOT NULL THEN
    ALTER TABLE grade_scales ENABLE ROW LEVEL SECURITY;
    ALTER TABLE grade_scales FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON grade_scales;
    CREATE POLICY tenant_isolation ON grade_scales
      USING (school_id IS NULL OR school_id = current_school_id())
      WITH CHECK (school_id = current_school_id());
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 3d. Link tables scoped through a parent (each guarded: skips cleanly when
--     the table/columns do not exist on legacy shapes)
-- --------------------------------------------------------------------------

-- fee_invoice_lines -> fee_invoices (001)
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

-- payment_allocations -> fee_invoices (001)
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

-- student_guardians -> students (both shapes carry student_id)
DO $$ BEGIN
  IF to_regclass('public.student_guardians') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = to_regclass('public.student_guardians') AND polname = 'tenant_ownership') THEN
    ALTER TABLE student_guardians ENABLE ROW LEVEL SECURITY;
    ALTER TABLE student_guardians FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON student_guardians;
    CREATE POLICY tenant_isolation ON student_guardians
      USING (EXISTS (SELECT 1 FROM students s
                     WHERE s.student_id = student_guardians.student_id
                       AND s.school_id = current_school_id()))
      WITH CHECK (EXISTS (SELECT 1 FROM students s
                     WHERE s.student_id = student_guardians.student_id
                       AND s.school_id = current_school_id()));
  END IF;
END $$;

-- terms -> academic_years (001)
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

-- class_subjects -> classes (001; classes carries school_id in both shapes)
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

-- exam_schedules -> exams (001; exams carries school_id in both shapes)
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

-- grade_scale_lines -> grade_scales (global template readable, own writable).
-- Shape-aware: reshaped grade_scales PK is scale_id (001), legacy PK is id.
-- (003_normalize_additive carries the same interim rule for fresh 003-first
-- orderings; both are idempotent DROP+CREATE.)
DO $$ BEGIN
  IF to_regclass('public.grade_scale_lines') IS NOT NULL
     AND to_regclass('public.grade_scales') IS NOT NULL THEN
    ALTER TABLE grade_scale_lines ENABLE ROW LEVEL SECURITY;
    ALTER TABLE grade_scale_lines FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON grade_scale_lines;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'grade_scales'
                 AND column_name = 'scale_id') THEN
      CREATE POLICY tenant_isolation ON grade_scale_lines
        USING (EXISTS (SELECT 1 FROM grade_scales s
                       WHERE s.scale_id = grade_scale_lines.scale_id
                         AND (s.school_id IS NULL OR s.school_id = current_school_id())))
        WITH CHECK (EXISTS (SELECT 1 FROM grade_scales s
                       WHERE s.scale_id = grade_scale_lines.scale_id
                         AND s.school_id = current_school_id()));
    ELSE
      CREATE POLICY tenant_isolation ON grade_scale_lines
        USING (EXISTS (SELECT 1 FROM grade_scales s
                       WHERE s.id = grade_scale_lines.scale_id
                         AND (s.school_id IS NULL OR s.school_id = current_school_id())))
        WITH CHECK (EXISTS (SELECT 1 FROM grade_scales s
                       WHERE s.id = grade_scale_lines.scale_id
                         AND s.school_id = current_school_id()));
    END IF;
  END IF;
END $$;

-- student_fee_discounts carries school_id in 001 (loop covers it); legacy
-- student_fees -> students
DO $$ BEGIN
  IF to_regclass('public.student_fees') IS NOT NULL THEN
    ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;
    ALTER TABLE student_fees FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON student_fees;
    CREATE POLICY tenant_isolation ON student_fees
      USING (EXISTS (SELECT 1 FROM students s
                     WHERE s.student_id = student_fees.student_id
                       AND s.school_id = current_school_id()))
      WITH CHECK (EXISTS (SELECT 1 FROM students s
                     WHERE s.student_id = student_fees.student_id
                       AND s.school_id = current_school_id()));
  END IF;
END $$;

-- fee_transactions -> student_fees -> students (legacy chain)
DO $$ BEGIN
  IF to_regclass('public.fee_transactions') IS NOT NULL
     AND to_regclass('public.student_fees') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = to_regclass('public.fee_transactions') AND polname = 'tenant_ownership') THEN
    ALTER TABLE fee_transactions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE fee_transactions FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON fee_transactions;
    CREATE POLICY tenant_isolation ON fee_transactions
      USING (EXISTS (SELECT 1 FROM student_fees sf JOIN students s
                       ON s.student_id = sf.student_id
                     WHERE sf.id = fee_transactions.student_fee_id
                       AND s.school_id = current_school_id()))
      WITH CHECK (EXISTS (SELECT 1 FROM student_fees sf JOIN students s
                       ON s.student_id = sf.student_id
                     WHERE sf.id = fee_transactions.student_fee_id
                       AND s.school_id = current_school_id()));
  END IF;
END $$;

-- fee_installments -> fee_structures (legacy; fee_structures has school_id)
DO $$ BEGIN
  IF to_regclass('public.fee_installments') IS NOT NULL
     AND to_regclass('public.fee_structures') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='fee_structures'
                   AND column_name='school_id') THEN
    ALTER TABLE fee_installments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE fee_installments FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON fee_installments;
    CREATE POLICY tenant_isolation ON fee_installments
      USING (EXISTS (SELECT 1 FROM fee_structures fs
                     WHERE fs.id = fee_installments.fee_structure_id
                       AND fs.school_id = current_school_id()))
      WITH CHECK (EXISTS (SELECT 1 FROM fee_structures fs
                     WHERE fs.id = fee_installments.fee_structure_id
                       AND fs.school_id = current_school_id()));
  END IF;
END $$;

-- student_enrollments / student_promotions -> students (legacy)
DO $$ BEGIN
  IF to_regclass('public.student_enrollments') IS NOT NULL THEN
    ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE student_enrollments FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON student_enrollments;
    CREATE POLICY tenant_isolation ON student_enrollments
      USING (EXISTS (SELECT 1 FROM students s
                     WHERE s.student_id = student_enrollments.student_id
                       AND s.school_id = current_school_id()))
      WITH CHECK (EXISTS (SELECT 1 FROM students s
                     WHERE s.student_id = student_enrollments.student_id
                       AND s.school_id = current_school_id()));
  END IF;
  IF to_regclass('public.student_promotions') IS NOT NULL THEN
    ALTER TABLE student_promotions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE student_promotions FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON student_promotions;
    CREATE POLICY tenant_isolation ON student_promotions
      USING (EXISTS (SELECT 1 FROM students s
                     WHERE s.student_id = student_promotions.student_id
                       AND s.school_id = current_school_id()))
      WITH CHECK (EXISTS (SELECT 1 FROM students s
                     WHERE s.student_id = student_promotions.student_id
                       AND s.school_id = current_school_id()));
  END IF;
END $$;

-- payroll -> staff (legacy; staff carries school_id)
DO $$ BEGIN
  IF to_regclass('public.payroll') IS NOT NULL
     AND to_regclass('public.staff') IS NOT NULL THEN
    ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
    ALTER TABLE payroll FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON payroll;
    CREATE POLICY tenant_isolation ON payroll
      USING (EXISTS (SELECT 1 FROM staff st
                     WHERE st.staff_id = payroll.staff_id
                       AND st.school_id = current_school_id()))
      WITH CHECK (EXISTS (SELECT 1 FROM staff st
                     WHERE st.staff_id = payroll.staff_id
                       AND st.school_id = current_school_id()));
  END IF;
END $$;

-- route_stops -> routes (legacy; routes carries school_id)
DO $$ BEGIN
  IF to_regclass('public.route_stops') IS NOT NULL
     AND to_regclass('public.routes') IS NOT NULL THEN
    ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
    ALTER TABLE route_stops FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON route_stops;
    CREATE POLICY tenant_isolation ON route_stops
      USING (EXISTS (SELECT 1 FROM routes r
                     WHERE r.route_id = route_stops.route_id
                       AND r.school_id = current_school_id()))
      WITH CHECK (EXISTS (SELECT 1 FROM routes r
                     WHERE r.route_id = route_stops.route_id
                       AND r.school_id = current_school_id()));
  END IF;
END $$;

-- hostel_rooms -> hostels (legacy; hostels carries school_id)
DO $$ BEGIN
  IF to_regclass('public.hostel_rooms') IS NOT NULL
     AND to_regclass('public.hostels') IS NOT NULL THEN
    ALTER TABLE hostel_rooms ENABLE ROW LEVEL SECURITY;
    ALTER TABLE hostel_rooms FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON hostel_rooms;
    CREATE POLICY tenant_isolation ON hostel_rooms
      USING (EXISTS (SELECT 1 FROM hostels h
                     WHERE h.hostel_id = hostel_rooms.hostel_id
                       AND h.school_id = current_school_id()))
      WITH CHECK (EXISTS (SELECT 1 FROM hostels h
                     WHERE h.hostel_id = hostel_rooms.hostel_id
                       AND h.school_id = current_school_id()));
  END IF;
END $$;

-- book_issues -> books (legacy; books carries school_id)
DO $$ BEGIN
  IF to_regclass('public.book_issues') IS NOT NULL
     AND to_regclass('public.books') IS NOT NULL THEN
    ALTER TABLE book_issues ENABLE ROW LEVEL SECURITY;
    ALTER TABLE book_issues FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON book_issues;
    CREATE POLICY tenant_isolation ON book_issues
      USING (EXISTS (SELECT 1 FROM books b
                     WHERE b.book_id = book_issues.book_id
                       AND b.school_id = current_school_id()))
      WITH CHECK (EXISTS (SELECT 1 FROM books b
                     WHERE b.book_id = book_issues.book_id
                       AND b.school_id = current_school_id()));
  END IF;
END $$;

-- webhook_logs -> webhooks (webhooks carries school_id)
DO $$ BEGIN
  IF to_regclass('public.webhook_logs') IS NOT NULL
     AND to_regclass('public.webhooks') IS NOT NULL THEN
    ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE webhook_logs FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON webhook_logs;
    CREATE POLICY tenant_isolation ON webhook_logs
      USING (EXISTS (SELECT 1 FROM webhooks w
                     WHERE w.id = webhook_logs.webhook_id
                       AND w.school_id = current_school_id()))
      WITH CHECK (EXISTS (SELECT 1 FROM webhooks w
                     WHERE w.id = webhook_logs.webhook_id
                       AND w.school_id = current_school_id()));
  END IF;
END $$;

-- student_documents -> students (legacy)
DO $$ BEGIN
  IF to_regclass('public.student_documents') IS NOT NULL THEN
    ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;
    ALTER TABLE student_documents FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON student_documents;
    CREATE POLICY tenant_isolation ON student_documents
      USING (EXISTS (SELECT 1 FROM students s
                     WHERE s.student_id = student_documents.student_id
                       AND s.school_id = current_school_id()))
      WITH CHECK (EXISTS (SELECT 1 FROM students s
                     WHERE s.student_id = student_documents.student_id
                       AND s.school_id = current_school_id()));
  END IF;
END $$;
