-- ============================================================================
-- Migration 013: full citizenship details for students + guardians
-- ============================================================================
-- Mirrors the teachers table convention (number + issue district + issue
-- date AD/BS). All nullable: under-16 students typically hold none of these,
-- and guardian records are often created before documents arrive.
-- No format CHECKs (district spellings and date edge cases vary); the API
-- validates shape, the DB stores. No RLS changes (columns, not tables).
-- ============================================================================

ALTER TABLE students ADD COLUMN IF NOT EXISTS citizenship_issue_district VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS citizenship_issue_date DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS citizenship_issue_date_bs VARCHAR(10);

ALTER TABLE guardians ADD COLUMN IF NOT EXISTS citizenship_issue_district VARCHAR(100);
ALTER TABLE guardians ADD COLUMN IF NOT EXISTS citizenship_issue_date DATE;
ALTER TABLE guardians ADD COLUMN IF NOT EXISTS citizenship_issue_date_bs VARCHAR(10);
