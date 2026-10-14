-- ============================================================================
-- Migration 008: admission funnel + parent portal + school directory
-- ============================================================================
-- ADMISSION (online_admissions was a stub: 12 cols vs the 40-col CRM intake
-- the service writes). Expanded to the service contract; review trail
-- (remarks/reviewed_at/reviewed_by) included.
-- STUDENTS: user_id login link (student portal accounts), parent snapshot
-- (father/mother name+phone, as on Nepali admission forms), profile_photo_url.
-- USERS: must_change_password (first-login flow).
-- SCHOOLS: full directory profile per school.service (code/type/ownership/
-- affiliation/registration/address/mobile/website/audit). school_name is the
-- canonical display going forward; legacy `name` is kept in sync by trigger
-- so every existing reader (seed/auth/ai/deo) keeps working.
-- ============================================================================

-- --------------------------------------------------------------------------
-- online_admissions: full CRM intake
-- --------------------------------------------------------------------------
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS first_name_np VARCHAR(100);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS middle_name_np VARCHAR(100);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS last_name_np VARCHAR(100);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS date_of_birth_bs VARCHAR(20);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS birth_place VARCHAR(100);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS nationality VARCHAR(50);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS religion VARCHAR(50);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS caste VARCHAR(50);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS father_name VARCHAR(100);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS father_phone VARCHAR(20);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS father_occupation VARCHAR(100);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS mother_name VARCHAR(100);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS mother_phone VARCHAR(20);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS mother_occupation VARCHAR(100);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(100);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS guardian_phone VARCHAR(20);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS guardian_relation VARCHAR(50);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS province_id INTEGER;
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS district_id INTEGER;
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS municipality_id INTEGER;
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS ward_number INTEGER;
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS previous_school VARCHAR(200);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS previous_class VARCHAR(50);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS previous_grade VARCHAR(50);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS transfer_certificate BOOLEAN;
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS class_id INTEGER REFERENCES classes(class_id) ON DELETE SET NULL;
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS documents JSONB NOT NULL DEFAULT '[]';
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE online_admissions ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL;

-- --------------------------------------------------------------------------
-- students: account link + admission snapshot + photo
-- --------------------------------------------------------------------------
ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_name VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_phone VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_name VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_phone VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500);

ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT true;

-- --------------------------------------------------------------------------
-- schools: full directory profile (service contract)
-- --------------------------------------------------------------------------
ALTER TABLE schools ADD COLUMN IF NOT EXISTS school_code VARCHAR(50);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS school_name VARCHAR(255);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS school_name_nepali VARCHAR(255);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS school_type VARCHAR(50);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS ownership_type VARCHAR(50);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS established_date DATE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS established_date_bs VARCHAR(20);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS affiliation_number VARCHAR(100);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS province_id INTEGER;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS district_id INTEGER;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS municipality_id INTEGER;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS ward_no INTEGER;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS tole VARCHAR(200);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS tole_nepali VARCHAR(200);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS street_address VARCHAR(255);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS street_address_nepali VARCHAR(255);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS updated_by INTEGER;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_school_code') THEN
    ALTER TABLE schools ADD CONSTRAINT uq_school_code UNIQUE (school_code);
  END IF;
END $$;

-- Backfill canonical display, then keep name/school_name in sync forever.
UPDATE schools SET school_name = COALESCE(school_name, name) WHERE school_name IS NULL;
CREATE OR REPLACE FUNCTION sync_school_names() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.school_name IS NOT NULL AND NEW.name IS NULL THEN
    NEW.name := NEW.school_name;
  ELSIF NEW.name IS NOT NULL AND NEW.school_name IS NULL THEN
    NEW.school_name := NEW.name;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_schools_sync_names ON schools;
CREATE TRIGGER trg_schools_sync_names BEFORE INSERT OR UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION sync_school_names();

-- RLS for the touched tables (online_admissions gains coverage here).
SELECT apply_tenant_rls();
