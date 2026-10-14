-- ============================================================================
-- Migration 007: enrollment/promotion canonicalization — expand legacy tables
-- to the service contract (no service rewrite for promotion; small
-- DTO-honoring touch-ups in enrollment.service alongside).
-- ============================================================================
-- student_enrollments legacy: id, student_id, class_id, section_id,
--   academic_year(VARCHAR), enrollment_date, status, created_at.
--   Service needs: enrollment_id PK, school_id, roll_number, is_current,
--   board_exam_registration, updated_at, deleted_at.
-- student_promotions legacy: id, student_id, from/to_class_id,
--   academic_year, promotion_date, status, created_at.
--   Service needs: promotion_id PK, school_id, from/to_academic_year,
--   promotion_status, previous/new_roll_number, promoted_by, remarks.
-- No FKs reference either PK (verified) -> renames are safe. RLS policies
-- attach by table, so renames preserve them; both tables gain school_id and
-- are picked up by apply_tenant_rls() at the end.
-- ============================================================================

-- --------------------------------------------------------------------------
-- student_enrollments -> service shape
-- --------------------------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'student_enrollments'
               AND column_name = 'id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'student_enrollments'
               AND column_name = 'enrollment_id') THEN
    ALTER TABLE student_enrollments RENAME COLUMN id TO enrollment_id;
  END IF;
END $$;

ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(school_id) ON DELETE CASCADE;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS roll_number INTEGER;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS board_exam_registration VARCHAR(20);
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Backfill school from the student (rows predate multi-tenancy columns).
UPDATE student_enrollments e SET school_id = s.school_id
  FROM students s WHERE s.student_id = e.student_id AND e.school_id IS NULL;
DO $$ DECLARE n integer; BEGIN
  SELECT COUNT(*) INTO n FROM student_enrollments WHERE school_id IS NULL;
  IF n > 0 THEN RAISE NOTICE '% enrollments reference missing students; school_id left NULL', n; END IF;
END $$;

-- Currency: latest row per student is the current one (legacy had no flag).
UPDATE student_enrollments e SET is_current = false
 WHERE EXISTS (SELECT 1 FROM student_enrollments newer
                WHERE newer.student_id = e.student_id
                  AND newer.enrollment_id > e.enrollment_id);

-- Normalize free-text statuses to the service vocabulary.
UPDATE student_enrollments SET status = UPPER(TRIM(status)) WHERE status IS NOT NULL;
DO $$ DECLARE n integer; BEGIN
  SELECT COUNT(*) INTO n FROM student_enrollments
   WHERE status NOT IN ('ACTIVE','PROMOTED','REPEATED','TRANSFERRED_OUT','DROPPED','GRADUATED','WITHDRAWN','LEFT');
  IF n > 0 THEN RAISE NOTICE '% enrollments carry non-vocabulary status (grandfathered)', n; END IF;
END $$;

-- --------------------------------------------------------------------------
-- student_promotions -> service shape
-- --------------------------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'student_promotions'
               AND column_name = 'id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'student_promotions'
               AND column_name = 'promotion_id') THEN
    ALTER TABLE student_promotions RENAME COLUMN id TO promotion_id;
  END IF;
END $$;

ALTER TABLE student_promotions ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(school_id) ON DELETE CASCADE;
ALTER TABLE student_promotions ADD COLUMN IF NOT EXISTS from_academic_year VARCHAR(10);
ALTER TABLE student_promotions ADD COLUMN IF NOT EXISTS to_academic_year VARCHAR(10);
ALTER TABLE student_promotions ADD COLUMN IF NOT EXISTS promotion_status VARCHAR(20) NOT NULL DEFAULT 'PROMOTED';
ALTER TABLE student_promotions ADD COLUMN IF NOT EXISTS previous_roll_number INTEGER;
ALTER TABLE student_promotions ADD COLUMN IF NOT EXISTS new_roll_number INTEGER;
ALTER TABLE student_promotions ADD COLUMN IF NOT EXISTS promoted_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE student_promotions ADD COLUMN IF NOT EXISTS remarks TEXT;

UPDATE student_promotions p SET school_id = s.school_id
  FROM students s WHERE s.student_id = p.student_id AND p.school_id IS NULL;
-- Legacy single academic_year best maps to the destination year; origin unknown.
UPDATE student_promotions SET to_academic_year = COALESCE(to_academic_year, academic_year)
  WHERE to_academic_year IS NULL AND academic_year IS NOT NULL;
UPDATE student_promotions SET promotion_status = UPPER(TRIM(status))
  WHERE status IS NOT NULL AND promotion_status = 'PROMOTED';

-- New school_id tables are picked up for RLS here.
SELECT apply_tenant_rls();
