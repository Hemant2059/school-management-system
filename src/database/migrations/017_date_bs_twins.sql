-- ============================================================================
-- Migration 017: AD+BS date twins for every business date
-- ============================================================================
-- Rule: every DATE column (business date) must have a BS twin alongside it.
-- System audit timestamps (created_at / updated_at / deleted_at and other
-- *_at TIMESTAMPTZ workflow stamps) are deliberately excluded — BS is not
-- meaningful for them.
--
-- Naming follows the existing codebase convention:
--   bare AD name  -> <name>_bs   (e.g. due_date      -> due_date_bs)
--   *_ad AD name  -> <stem>_bs   (e.g. valid_from_ad -> valid_from_bs)
-- All twins are nullable VARCHAR(10) ('YYYY-MM-DD'), additive only
-- (ADD COLUMN IF NOT EXISTS), so this is safe to replay on any database.
-- ============================================================================

-- attendance_records.date (column literally named "date")
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS date_bs VARCHAR(10);

-- certificates family
ALTER TABLE bonafide_certificates ADD COLUMN IF NOT EXISTS issue_date_bs VARCHAR(10);
ALTER TABLE character_certificates ADD COLUMN IF NOT EXISTS issue_date_bs VARCHAR(10);
ALTER TABLE transfer_certificates ADD COLUMN IF NOT EXISTS issue_date_bs VARCHAR(10);
ALTER TABLE transfer_certificates ADD COLUMN IF NOT EXISTS joining_date_bs VARCHAR(10);

-- library
ALTER TABLE books ADD COLUMN IF NOT EXISTS acquisition_date_bs VARCHAR(10);

-- fee master (validity windows + due dates)
ALTER TABLE discount_rules ADD COLUMN IF NOT EXISTS valid_from_bs VARCHAR(10);
ALTER TABLE discount_rules ADD COLUMN IF NOT EXISTS valid_to_bs VARCHAR(10);
ALTER TABLE fee_installments ADD COLUMN IF NOT EXISTS due_date_bs VARCHAR(10);
ALTER TABLE fees ADD COLUMN IF NOT EXISTS due_date_bs VARCHAR(10);
ALTER TABLE late_fine_rules ADD COLUMN IF NOT EXISTS applicable_from_bs VARCHAR(10);
ALTER TABLE student_scholarships ADD COLUMN IF NOT EXISTS valid_from_bs VARCHAR(10);
ALTER TABLE student_scholarships ADD COLUMN IF NOT EXISTS valid_to_bs VARCHAR(10);

-- exams scheduling window
ALTER TABLE exams ADD COLUMN IF NOT EXISTS start_date_bs VARCHAR(10);
ALTER TABLE exams ADD COLUMN IF NOT EXISTS end_date_bs VARCHAR(10);

-- payments / HR
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cheque_date_bs VARCHAR(10);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS date_of_birth_bs VARCHAR(10);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS joining_date_bs VARCHAR(10);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS license_expiry_date_bs VARCHAR(10);

-- enrollment / promotion trail
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS enrollment_date_bs VARCHAR(10);
ALTER TABLE student_promotions ADD COLUMN IF NOT EXISTS promotion_date_bs VARCHAR(10);

-- transport operations
ALTER TABLE transport_assignments ADD COLUMN IF NOT EXISTS effective_from_bs VARCHAR(10);
ALTER TABLE transport_assignments ADD COLUMN IF NOT EXISTS effective_to_bs VARCHAR(10);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_expiry_bs VARCHAR(10);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS permit_expiry_bs VARCHAR(10);

-- Legacy dead tables (no code refs, still present): same rule for uniformity.
ALTER TABLE exam ADD COLUMN IF NOT EXISTS start_date_bs VARCHAR(10);
ALTER TABLE exam ADD COLUMN IF NOT EXISTS end_date_bs VARCHAR(10);
ALTER TABLE fee_transactions ADD COLUMN IF NOT EXISTS payment_date_bs VARCHAR(10);
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS payment_date_bs VARCHAR(10);
