-- ============================================================================
-- Migration 016: backfill school_id on transport link tables (006 added the
-- columns; legacy rows carry NULL and would go invisible under RLS).
--   route_stops.school_id        <- parent routes.school_id
--   transport_assignments.school_id <- parent routes.school_id, else the
--      student's school as fallback. Unresolvable rows are NOTICE-reported
--      (kept NULL; visible to no tenant session by design).
-- Idempotent (WHERE school_id IS NULL guards).
-- ============================================================================

UPDATE route_stops rs SET school_id = r.school_id
  FROM routes r WHERE r.route_id = rs.route_id AND rs.school_id IS NULL;

UPDATE transport_assignments ta SET school_id = r.school_id
  FROM routes r WHERE r.route_id = ta.route_id AND ta.school_id IS NULL;

UPDATE transport_assignments ta SET school_id = s.school_id
  FROM students s WHERE s.student_id = ta.student_id AND ta.school_id IS NULL;

DO $$ DECLARE n integer; BEGIN
  SELECT COUNT(*) INTO n FROM route_stops WHERE school_id IS NULL;
  IF n > 0 THEN RAISE NOTICE '% route_stops without resolvable school (orphaned routes)', n; END IF;
  SELECT COUNT(*) INTO n FROM transport_assignments WHERE school_id IS NULL;
  IF n > 0 THEN RAISE NOTICE '% transport_assignments without resolvable school', n; END IF;
END $$;
