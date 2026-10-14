-- ============================================================================
-- Migration 014: widen PII columns for AES-256-CBC hex ciphertext
-- ============================================================================
-- Identity/financial fields are now encrypted at rest (deterministic CBC so
-- DB UNIQUE constraints on citizenship/NIN keep working — see EncryptionUtil
-- header for the tradeoff). Hex ciphertext needs ~2x plaintext + 1 block:
--   nin VARCHAR(30)               -> VARCHAR(128)   (30 chars = 2 blocks)
--   citizenship_number (50)       -> VARCHAR(128)
--   birth_certificate_number (50) -> VARCHAR(128)
--   bank_account_number (50)      -> VARCHAR(128)
--   guardians.citizenship_no (50) -> VARCHAR(128)
--   guardians.nin (30)            -> VARCHAR(128)
-- Existing plaintext rows keep working: decrypt() falls back to the input
-- when it is not valid ciphertext; run scripts/encrypt-pii.ts once per
-- environment to convert them (inventories leftovers).
-- ============================================================================

ALTER TABLE students ALTER COLUMN nin TYPE VARCHAR(128);
ALTER TABLE students ALTER COLUMN citizenship_number TYPE VARCHAR(128);
ALTER TABLE students ALTER COLUMN birth_certificate_number TYPE VARCHAR(128);
ALTER TABLE students ALTER COLUMN bank_account_number TYPE VARCHAR(128);
ALTER TABLE guardians ADD COLUMN IF NOT EXISTS nin VARCHAR(128);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'guardians'
               AND column_name = 'nin' AND character_maximum_length < 128) THEN
    ALTER TABLE guardians ALTER COLUMN nin TYPE VARCHAR(128);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'guardians'
               AND column_name = 'citizenship_no' AND character_maximum_length < 128) THEN
    ALTER TABLE guardians ALTER COLUMN citizenship_no TYPE VARCHAR(128);
  END IF;
END $$;
