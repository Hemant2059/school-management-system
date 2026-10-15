-- ============================================================================
-- Migration 023: drop student email/mobile (students have neither)
-- ============================================================================
-- Contact for a student goes through guardians (guardians.mobile). The
-- students.student_email / student_mobile columns are removed entirely.
-- ============================================================================

ALTER TABLE students DROP COLUMN IF EXISTS student_email;
ALTER TABLE students DROP COLUMN IF EXISTS student_mobile;
