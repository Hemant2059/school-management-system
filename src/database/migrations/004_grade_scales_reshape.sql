-- ============================================================================
-- Migration 004: grade_scales reshape — legacy band-rows to 001 canonical
-- (scale header + grade_scale_lines) + NEB-2078 national template
-- ============================================================================
-- WHY: legacy grade_scales stored one row PER BAND (id, school_id,
-- grade_name, min_marks, max_marks, grade_point, description) with no active
-- flag, no code, no global template. 001 models a scale HEADER (per school
-- or global) + LINES. The grade service is rewritten alongside (same slice).
--
-- STEPS
--   1. RENAME legacy -> grade_scales_legacy (audit trail; its RLS policy
--      follows the rename; dropped in a later cleanup migration).
--   2. CREATE canonical grade_scales (001 shape verbatim) + default index.
--   3. Per school: one 'MIGRATED' header (is_default) + lines copied from
--      legacy bands whose grade_name is a valid NEB letter; others RAISE
--      NOTICE (auditable, no silent coercion). NULL-school legacy rows
--      cannot be attributed -> NOTICE + skip.
--   4. Seed national NEB-2078 template (001 block verbatim).
--   5. Remap orphan grade_scale_lines (pre-reshape test rows) to the template
--      on exact grade match, then ADD the deferred FK (D2 resolved).
--   6. RLS: custom global-template policy on grade_scales + scale_id-branch
--      policy on grade_scale_lines (replaces 003's interim s.id version).
-- ============================================================================

-- 1. Park the legacy table (kept for audit; cleanup later).
ALTER TABLE IF EXISTS grade_scales RENAME TO grade_scales_legacy;

-- 2. Canonical headers (001 shape verbatim).
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

-- 3. Migrate legacy bands -> header + lines, per school.
DO $$
DECLARE
  sch   record;
  hdr   integer;
  moved integer;
  skipped integer;
BEGIN
  FOR sch IN SELECT DISTINCT school_id FROM grade_scales_legacy WHERE school_id IS NOT NULL
  LOOP
    INSERT INTO grade_scales (school_id, scale_code, scale_name, is_default, is_active)
    VALUES (sch.school_id, 'MIGRATED', 'Migrated custom scale', true, true)
    ON CONFLICT (school_id, scale_code) DO NOTHING;

    SELECT scale_id INTO hdr FROM grade_scales
     WHERE school_id = sch.school_id AND scale_code = 'MIGRATED';

    INSERT INTO grade_scale_lines (scale_id, grade, grade_point, min_percent, max_percent, remark)
    SELECT hdr, grade_name, grade_point, min_marks, max_marks, description
      FROM grade_scales_legacy
     WHERE school_id = sch.school_id
       AND grade_name IN ('A+','A','B+','B','C+','C','D','NG')
    ON CONFLICT (scale_id, grade) DO NOTHING;
    GET DIAGNOSTICS moved = ROW_COUNT;

    SELECT COUNT(*) INTO skipped FROM grade_scales_legacy
     WHERE school_id = sch.school_id
       AND NOT (grade_name IN ('A+','A','B+','B','C+','C','D','NG'));

    RAISE NOTICE 'grade_scales migrate: school % header %, bands moved %, skipped %',
      sch.school_id, hdr, moved, skipped;
  END LOOP;

  SELECT COUNT(*) INTO skipped FROM grade_scales_legacy WHERE school_id IS NULL;
  IF skipped > 0 THEN
    RAISE NOTICE 'grade_scales migrate: % unattributed (NULL school) legacy rows skipped', skipped;
  END IF;
END $$;

-- 4. National NEB-2078 template (001 block verbatim).
INSERT INTO grade_scales (school_id, scale_code, scale_name, is_default, is_active) VALUES
  (NULL, 'NEB-2078', 'NEB Letter Grading Guideline 2078 (national template)', false, true)
ON CONFLICT (school_id, scale_code) DO NOTHING;

-- Continuous bounds: lookup is percent >= min AND (percent < max OR =100),
-- so 90 -> A+, 80 -> A, ..., 35 -> D, 34.99 -> NG.
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

-- 5. Resolve D2: remap orphan lines to the template on exact grade match,
-- then attach the deferred FK (validating — true conflicts abort loudly).
UPDATE grade_scale_lines l SET scale_id = t.scale_id
  FROM grade_scales t
 WHERE t.school_id IS NULL AND t.scale_code = 'NEB-2078'
   AND l.grade IN (SELECT grade FROM grade_scale_lines tl WHERE tl.scale_id = t.scale_id)
   AND NOT EXISTS (SELECT 1 FROM grade_scales s WHERE s.scale_id = l.scale_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_grade_lines_scale') THEN
    ALTER TABLE grade_scale_lines
      ADD CONSTRAINT fk_grade_lines_scale
      FOREIGN KEY (scale_id) REFERENCES grade_scales(scale_id) ON DELETE CASCADE;
  END IF;
END $$;

-- 6a. RLS on canonical headers: tenants read the national template, write own.
ALTER TABLE grade_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_scales FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON grade_scales;
CREATE POLICY tenant_isolation ON grade_scales
  USING (school_id IS NULL OR school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

-- 6b. Lines policy, scale_id branch (replaces 003's interim s.id version;
-- 002's shape-aware block converges here on re-runs).
DROP POLICY IF EXISTS tenant_isolation ON grade_scale_lines;
CREATE POLICY tenant_isolation ON grade_scale_lines
  USING (EXISTS (SELECT 1 FROM grade_scales s
                 WHERE s.scale_id = grade_scale_lines.scale_id
                   AND (s.school_id IS NULL OR s.school_id = current_school_id())))
  WITH CHECK (EXISTS (SELECT 1 FROM grade_scales s
                 WHERE s.scale_id = grade_scale_lines.scale_id
                   AND s.school_id = current_school_id()));
