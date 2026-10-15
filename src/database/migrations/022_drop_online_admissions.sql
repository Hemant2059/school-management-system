-- ============================================================================
-- Migration 022: drop online admissions (no online-apply flow)
-- ============================================================================
-- Admissions are entered directly by admins (POST /students with full
-- profile + placement). The online application funnel (online_admissions
-- table + admission module) is unused, so the table goes. The legacy
-- inline DDL no longer recreates it (removed alongside), and its RLS
-- policies die with the table.
-- ============================================================================

DROP TABLE IF EXISTS online_admissions;
