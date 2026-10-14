-- ============================================================================
-- Migration 011: drop dead tables (no code references; verified by audit)
-- ============================================================================
--   results ............. referenced nowhere (admin export list cleaned)
--   payroll (singular) .. superseded by payrolls (Nepal model); dashboard moved
--   exam (singular) ..... superseded by exams; no references
--   transports .......... fleet lives in vehicles/routes; no references
--   libraries ........... no reads/writes (books.library_id FK dropped first)
--   fee_transactions .... legacy split-payment ledger; superseded by
--                         payment_allocations; no references
-- KEPT deliberately: grade_scales_legacy (004 audit trail), student_fees
-- (dashboard/ai balance reads), payroll rows? No — payroll table itself goes.
-- Policies on dropped tables die with them; the RLS loop is dynamic so
-- future apply_tenant_rls() runs simply stop seeing these names.
-- ============================================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'books_library_id_fkey') THEN
    ALTER TABLE books DROP CONSTRAINT books_library_id_fkey;
  END IF;
END $$;

DROP TABLE IF EXISTS fee_transactions;
DROP TABLE IF EXISTS libraries;
DROP TABLE IF EXISTS transports;
DROP TABLE IF EXISTS exam;
DROP TABLE IF EXISTS payroll;
DROP TABLE IF EXISTS results;
