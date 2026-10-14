-- ============================================================================
-- Migration 015: drop student bank columns (no disbursement use-case)
-- ============================================================================
-- Scholarships in this system are fee discounts (student_scholarships /
-- discount rules), never cash disbursements, so there is no legitimate
-- reason to hold student bank accounts. Removed per data minimization:
-- fewer sensitive fields, smaller breach surface. Refunds, if ever needed,
-- are handled against the payer's payment instrument, not a stored account.
-- (Staff/teacher bank columns stay: salary disbursement requires them.
-- Payment rows keep bank_name: the school's receiving bank per transaction.)
-- ============================================================================

ALTER TABLE students DROP COLUMN IF EXISTS bank_name;
ALTER TABLE students DROP COLUMN IF EXISTS bank_account_number;
