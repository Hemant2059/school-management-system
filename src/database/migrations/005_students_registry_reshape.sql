-- ============================================================================
-- Migration 005: students registry reshape (students + guardians +
-- student_guardians) to 001 canonical shapes — IN-PLACE, PK-preserving
-- ============================================================================
-- LOAD-BEARING RULE: student_id / guardian_id values and PKs are preserved
-- (dozens of FKs point at them). Everything here is ADD/BACKFILL/VALIDATE/
-- DROP-unused — no table is recreated, so RLS policies survive untouched.
--
-- STUDENTS
--   ADD: iemis_student_id (uq), middle/last_name_np, has_disability +
--     disability_type (+check), bank_name/account, admission_date_bs,
--     deleted_at (fixes remove()), caste_code FK -> caste_ethnicity_groups.
--   MIGRATE: date_of_birth -> date_of_birth_ad, dob_bs_snapshot ->
--     date_of_birth_bs, ethnicity/code text -> caste_code (master extended
--     below; unmatched stay NULL + NOTICE), gender variants normalized.
--   PLACEMENT -> enrollments (current_class/section_id, academic_year matched
--     to academic_years.session_name, roll_number); unresolvable rows NOTICE.
--   DROP: date_of_birth, dob_bs_snapshot, ethnicity, caste_ethnicity_code,
--     current_class_id, current_section_id, academic_year.
--   KEPT (deviations from 001, each still read by services): is_active (276
--     usages), display_name, admission_class_id, roll_number (denormalized
--     current-roll for promotion/result/deo), birthplace, nationality,
--     caste_ethnicity raw text, blood_group width, created_by/updated_by.
--     gender stays nullable (001 NOT NULL too strict for legacy rows).
--   admission_number: global UNIQUE replaced by per-school partial unique
--     (schools number independently); student_code gains partial unique.
-- GUARDIANS: ADD guardian_code (backfilled, NOT NULL, per-school uq), user_id
--   login link, citizenship_no, address_en/np, updated_at + trigger,
--   deleted_at (fixes remove()); names migrated to _en variants;
--   mobile backfilled from phone; DROP first/middle/last, relationship, phone.
--   KEPT: display_name, relation_to_student, middles, education_level,
--   annual_income, alternate_mobile (all read by services/DTOs).
-- STUDENT_GUARDIANS: ADD updated_at, is_fee_payer; normalize relations (loud
--   on invalid); demote extra primaries (NOTICE); ADD UNIQUE pair + single-
--   primary partial unique. KEPT: surrogate PK + is_active (service code
--   addresses links by student_guardian_id).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- --------------------------------------------------------------------------
-- 0. CEHRD master extension (common groups missing from 001's 10-row seed;
--    codes fit MOEST ^(0[1-9]|1[0-5])[A-Z]$). Must precede caste mapping.
-- --------------------------------------------------------------------------
INSERT INTO caste_ethnicity_groups (caste_code, name_en, name_np, category, iemis_group) VALUES
  ('06C','Rai','राई','JANAJATI','Janajati'),
  ('06D','Limbu','लिम्बू','JANAJATI','Janajati'),
  ('06E','Gurung','गुरुङ','JANAJATI','Janajati'),
  ('06F','Magar','मगर','JANAJATI','Janajati'),
  ('06G','Tamang','तामाङ','JANAJATI','Janajati'),
  ('06H','Sherpa','शेर्पा','JANAJATI','Janajati'),
  ('03Y','Yadav','यादव','MADHESI','Madhesi'),
  ('03H','Mahato','महतो','MADHESI','Madhesi')
ON CONFLICT (caste_code) DO NOTHING;

-- --------------------------------------------------------------------------
-- 1. students: new columns
-- --------------------------------------------------------------------------
ALTER TABLE students ADD COLUMN IF NOT EXISTS iemis_student_id VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS middle_name_np VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_name_np VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS has_disability BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS disability_type VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_date_bs VARCHAR(10);
ALTER TABLE students ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS caste_code VARCHAR(3);

-- 2. students: data migration (idempotent COALESCE guards for re-runs)
UPDATE students SET date_of_birth_ad = COALESCE(date_of_birth_ad, date_of_birth)
  WHERE date_of_birth_ad IS NULL AND date_of_birth IS NOT NULL;
UPDATE students SET date_of_birth_bs = COALESCE(date_of_birth_bs, dob_bs_snapshot)
  WHERE date_of_birth_bs IS NULL AND dob_bs_snapshot IS NOT NULL;

-- Gender variants -> canonical (DTO already emits canonical for new writes).
UPDATE students SET gender = CASE UPPER(TRIM(gender))
  WHEN 'MALE' THEN 'MALE' WHEN 'M' THEN 'MALE' WHEN 'BOY' THEN 'MALE'
  WHEN 'FEMALE' THEN 'FEMALE' WHEN 'F' THEN 'FEMALE' WHEN 'GIRL' THEN 'FEMALE'
  WHEN 'OTHER' THEN 'OTHER' ELSE gender END
  WHERE gender IS NOT NULL;
DO $$ DECLARE n integer; BEGIN
  SELECT COUNT(*) INTO n FROM students
   WHERE gender IS NOT NULL
     AND gender NOT IN ('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY');
  IF n > 0 THEN RAISE EXCEPTION '% students have non-canonical gender', n; END IF;
END $$;

-- Caste text/code -> validated FK (name, group, code, + Brahmin alias).
-- Sources: legacy caste_ethnicity_code, caste_ethnicity AND ethnicity
-- (all three carried raw values in the wild).
UPDATE students s SET caste_code = g.caste_code
  FROM caste_ethnicity_groups g
 WHERE s.caste_code IS NULL
   AND (s.caste_ethnicity_code = g.caste_code
     OR LOWER(s.caste_ethnicity) = LOWER(g.name_en)
     OR LOWER(s.caste_ethnicity) = LOWER(g.iemis_group)
     OR LOWER(s.ethnicity) = LOWER(g.name_en)
     OR LOWER(s.ethnicity) = LOWER(g.iemis_group));
UPDATE students SET caste_code = '01A'
 WHERE caste_code IS NULL AND LOWER(caste_ethnicity) = 'brahmin';
UPDATE students SET caste_code = '01A'
 WHERE caste_code IS NULL AND LOWER(ethnicity) = 'brahmin';
DO $$ DECLARE n integer; BEGIN
  SELECT COUNT(*) INTO n FROM students
   WHERE caste_code IS NULL AND (caste_ethnicity IS NOT NULL OR caste_ethnicity_code IS NOT NULL OR ethnicity IS NOT NULL);
  IF n > 0 THEN RAISE NOTICE '% students keep raw caste text (no CEHRD map); caste_code left NULL', n; END IF;
END $$;

-- Placement -> canonical enrollments (matched to academic_years sessions).
INSERT INTO enrollments
  (school_id, student_id, academic_year_id, class_id, section_id, roll_no, status, enrolled_on_ad)
SELECT s.school_id, s.student_id, ay.academic_year_id,
       s.current_class_id, s.current_section_id, s.roll_number, 'ENROLLED', CURRENT_DATE
  FROM students s
  JOIN academic_years ay ON ay.school_id = s.school_id AND ay.session_name = s.academic_year
 WHERE s.current_class_id IS NOT NULL AND s.current_section_id IS NOT NULL
   AND s.roll_number IS NOT NULL AND s.roll_number > 0
ON CONFLICT (student_id, academic_year_id) DO NOTHING;
DO $$ DECLARE n integer; BEGIN
  SELECT COUNT(*) INTO n FROM students s
   WHERE (s.current_class_id IS NOT NULL OR s.academic_year IS NOT NULL)
     AND NOT EXISTS (SELECT 1 FROM enrollments e
                      WHERE e.student_id = s.student_id
                        AND e.academic_year_id IN (SELECT academic_year_id FROM academic_years
                                                   WHERE school_id = s.school_id AND session_name = s.academic_year));
  IF n > 0 THEN RAISE NOTICE '% students have unmigratable placement (no session/section/roll); enroll via enrollment flow', n; END IF;
END $$;

-- 3. students: integrity (validating — violations abort loudly by design)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_student_gender') THEN
    ALTER TABLE students ADD CONSTRAINT chk_student_gender
      CHECK (gender IS NULL OR gender IN ('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_student_mobile') THEN
    ALTER TABLE students ADD CONSTRAINT chk_student_mobile
      CHECK (student_mobile IS NULL OR student_mobile ~ '^(98|97|96)[0-9]{8}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_student_prov') THEN
    ALTER TABLE students ADD CONSTRAINT chk_student_prov
      CHECK (permanent_province_id IS NULL OR (permanent_province_id BETWEEN 1 AND 7));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_student_ward') THEN
    ALTER TABLE students ADD CONSTRAINT chk_student_ward
      CHECK (permanent_ward_no IS NULL OR (permanent_ward_no BETWEEN 1 AND 35));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_student_dob') THEN
    ALTER TABLE students ADD CONSTRAINT chk_student_dob
      CHECK (date_of_birth_ad IS NULL OR date_of_birth_ad <= CURRENT_DATE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_student_disab') THEN
    ALTER TABLE students ADD CONSTRAINT chk_student_disab
      CHECK (NOT has_disability OR disability_type IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_students_iemis') THEN
    ALTER TABLE students ADD CONSTRAINT uq_students_iemis UNIQUE (iemis_student_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_student_citizen') THEN
    ALTER TABLE students ADD CONSTRAINT uq_student_citizen UNIQUE (citizenship_number);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_student_birth') THEN
    ALTER TABLE students ADD CONSTRAINT uq_student_birth UNIQUE (birth_certificate_number);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_student_caste') THEN
    ALTER TABLE students ADD CONSTRAINT fk_student_caste
      FOREIGN KEY (caste_code) REFERENCES caste_ethnicity_groups(caste_code) ON DELETE RESTRICT;
  END IF;
END $$;
-- admission_number: global UNIQUE -> per-school partial (schools number alone).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_admission_number_key') THEN
    ALTER TABLE students DROP CONSTRAINT students_admission_number_key;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uq_students_adm
  ON students (school_id, admission_number) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_students_code
  ON students (school_id, student_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_caste
  ON students (school_id, caste_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_name_trgm
  ON students USING gin ((first_name_en || ' ' || last_name_en) gin_trgm_ops);
DROP TRIGGER IF EXISTS trg_students_updated ON students;
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. students: drop migrated/superseded columns (consumers fixed in-slice:
-- student.service create, seed.service, deo-report 3 lines, export query).
ALTER TABLE students DROP COLUMN IF EXISTS date_of_birth;
ALTER TABLE students DROP COLUMN IF EXISTS dob_bs_snapshot;
ALTER TABLE students DROP COLUMN IF EXISTS ethnicity;
ALTER TABLE students DROP COLUMN IF EXISTS caste_ethnicity_code;
ALTER TABLE students DROP COLUMN IF EXISTS current_class_id;
ALTER TABLE students DROP COLUMN IF EXISTS current_section_id;
ALTER TABLE students DROP COLUMN IF EXISTS academic_year;

-- --------------------------------------------------------------------------
-- 5. guardians: new columns + backfill
-- --------------------------------------------------------------------------
ALTER TABLE guardians ADD COLUMN IF NOT EXISTS guardian_code VARCHAR(30);
ALTER TABLE guardians ADD COLUMN IF NOT EXISTS user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE guardians ADD COLUMN IF NOT EXISTS citizenship_no VARCHAR(50);
ALTER TABLE guardians ADD COLUMN IF NOT EXISTS address_en TEXT;
ALTER TABLE guardians ADD COLUMN IF NOT EXISTS address_np TEXT;
ALTER TABLE guardians ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE guardians ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE guardians SET first_name_en = COALESCE(first_name_en, first_name) WHERE first_name_en IS NULL;
UPDATE guardians SET middle_name_en = COALESCE(middle_name_en, middle_name) WHERE middle_name_en IS NULL;
UPDATE guardians SET last_name_en = COALESCE(last_name_en, last_name) WHERE last_name_en IS NULL;
UPDATE guardians SET mobile = COALESCE(mobile, phone) WHERE mobile IS NULL;
UPDATE guardians SET relation_to_student = COALESCE(relation_to_student, relationship)
  WHERE relation_to_student IS NULL;
UPDATE guardians SET guardian_code = COALESCE(guardian_code, 'GRD-' || guardian_id) WHERE guardian_code IS NULL;

DO $$ DECLARE n integer; BEGIN
  SELECT COUNT(*) INTO n FROM guardians WHERE last_name_en IS NULL;
  IF n > 0 THEN RAISE NOTICE '% guardians have NULL last_name_en (grandfathered nullable)', n; END IF;
END $$;

ALTER TABLE guardians ALTER COLUMN guardian_code SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_guardian_code') THEN
    ALTER TABLE guardians ADD CONSTRAINT uq_guardian_code UNIQUE (school_id, guardian_code);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_guardian_mobile') THEN
    ALTER TABLE guardians ADD CONSTRAINT chk_guardian_mobile
      CHECK (mobile IS NULL OR mobile ~ '^(98|97|96)[0-9]{8}$');
  END IF;
END $$;
DROP TRIGGER IF EXISTS trg_guardians_updated ON guardians;
CREATE TRIGGER trg_guardians_updated BEFORE UPDATE ON guardians
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE guardians DROP COLUMN IF EXISTS first_name;
ALTER TABLE guardians DROP COLUMN IF EXISTS middle_name;
ALTER TABLE guardians DROP COLUMN IF EXISTS last_name;
ALTER TABLE guardians DROP COLUMN IF EXISTS relationship;
ALTER TABLE guardians DROP COLUMN IF EXISTS phone;

-- --------------------------------------------------------------------------
-- 6. student_guardians: harden in place (surrogate PK + is_active KEPT —
-- service addresses links by student_guardian_id)
-- --------------------------------------------------------------------------
ALTER TABLE student_guardians ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE student_guardians ADD COLUMN IF NOT EXISTS is_fee_payer BOOLEAN NOT NULL DEFAULT false;

UPDATE student_guardians SET relationship_type = UPPER(TRIM(relationship_type));
DO $$ DECLARE n integer; BEGIN
  SELECT COUNT(*) INTO n FROM student_guardians
   WHERE relationship_type NOT IN ('FATHER','MOTHER','GRANDFATHER','GRANDMOTHER','UNCLE','AUNT','BROTHER','SISTER','GUARDIAN','OTHER');
  IF n > 0 THEN RAISE EXCEPTION '% student_guardian links have invalid relationship_type', n; END IF;
END $$;

-- One primary per student: keep earliest, demote the rest (auditable).
WITH ranked AS (
  SELECT student_guardian_id, student_id,
         ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY student_guardian_id) AS rn
    FROM student_guardians WHERE is_primary
)
UPDATE student_guardians sg SET is_primary = false
  FROM ranked r WHERE r.student_guardian_id = sg.student_guardian_id AND r.rn > 1;
DO $$ DECLARE n integer; BEGIN
  SELECT COUNT(*) INTO n FROM (SELECT student_id FROM student_guardians WHERE is_primary GROUP BY student_id HAVING COUNT(*) > 1) t;
  RAISE NOTICE 'extra primaries demoted; remaining multi-primary students: %', n;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_sg_relation') THEN
    ALTER TABLE student_guardians ADD CONSTRAINT chk_sg_relation
      CHECK (relationship_type IN ('FATHER','MOTHER','GRANDFATHER','GRANDMOTHER','UNCLE','AUNT','BROTHER','SISTER','GUARDIAN','OTHER'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_sg_pair') THEN
    ALTER TABLE student_guardians ADD CONSTRAINT uq_sg_pair UNIQUE (student_id, guardian_id);
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uq_sg_primary ON student_guardians (student_id) WHERE is_primary;
CREATE INDEX IF NOT EXISTS idx_sg_guardian ON student_guardians (guardian_id);
