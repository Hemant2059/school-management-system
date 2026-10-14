-- ============================================================================
-- Migration 019: remaining attribute-level EN+NP twins
-- ============================================================================
-- Follow-up to 018: vehicle attributes, book edition and route ETA label.
-- Same rule (nullable, additive only) and convention (frontend sends both,
-- backend stores both, calcs on AD).
-- ============================================================================

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS manufacturer_np VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS color_np VARCHAR(50);
ALTER TABLE books ADD COLUMN IF NOT EXISTS edition_np VARCHAR(50);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS estimated_time_np VARCHAR(50);
