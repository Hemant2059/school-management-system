-- ============================================================================
-- Migration 012: National Identity Number (NIN) for students + guardians
-- ============================================================================
-- Completes the identity set per registry rules:
--   students : birth_certificate_number (exists) + NIN (new) + citizenship
--              (exists) + iemis_student_id (exists, 001/005).
--   guardians: citizenship_no (exists, 005) + NIN (new).
-- All nullable (age/document-gated in real life) + globally UNIQUE (national
-- IDs are never reused). No format CHECK: NID formats evolve; the API
-- validates shape, the DB guarantees uniqueness. No RLS changes (columns,
-- not tables).
-- ============================================================================

ALTER TABLE students ADD COLUMN IF NOT EXISTS nin VARCHAR(30);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_student_nin') THEN
    ALTER TABLE students ADD CONSTRAINT uq_student_nin UNIQUE (nin);
  END IF;
END $$;

ALTER TABLE guardians ADD COLUMN IF NOT EXISTS nin VARCHAR(30);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_guardian_nin') THEN
    ALTER TABLE guardians ADD CONSTRAINT uq_guardian_nin UNIQUE (nin);
  END IF;
END $$;
