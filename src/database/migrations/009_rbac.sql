-- ============================================================================
-- Migration 009: dynamic RBAC — permissions catalog, per-school roles,
-- grants, memberships, cache-busting versions
-- ============================================================================
-- Replaces the static ROLE_PERMISSIONS map (common/decorators) with data:
--   permissions: global catalog seeded from the Permission enum (59 codes).
--     No RLS (read-only reference; no school_id by design).
--   roles: NULL school_id = locked system template; per-school rows are
--     custom roles (cloned from templates via copy). UNIQUE NULLS NOT
--     DISTINCT (school_id, code). Custom RLS (template readable globally).
--   role_permissions: PK pair, CASCADE on role delete.
--   user_roles: composite PK (user, role, school); school_id denormalized
--     for RLS + fast checks. Covered by the standard loop.
--   school_perm_versions: bumped by RbacService on every mutation (same
--     transaction as the change); Redis mirrors it for request-path caching.
-- Backfill: one user_roles row per user from users.user_type (GUARDIAN and
--   PARENT -> PARENT template, VICE_PRINCIPAL -> PRINCIPAL); NULL-school and
--   unknown types are NOTICE-skipped (their static-map fallback still applies
--   at runtime, so nothing breaks).
-- RUNTIME CONTRACT (PermissionsGuard): user with ANY db roles in the tenant
--   -> db permissions only; otherwise legacy static map. is_system users and
--   ADMIN userType bypass as before.
-- ============================================================================

CREATE TABLE IF NOT EXISTS permissions (
  permission_id SERIAL PRIMARY KEY,
  code          VARCHAR(60)  NOT NULL,   -- e.g. 'student:create'
  resource      VARCHAR(30)  NOT NULL,   -- e.g. 'student'
  action        VARCHAR(30)  NOT NULL,   -- e.g. 'create'
  description   VARCHAR(200),
  CONSTRAINT uq_permission_code UNIQUE (code)
);

INSERT INTO permissions (code, resource, action, description) VALUES
  ('student:create','student','create','Create student records'),
  ('student:read','student','read','View student records'),
  ('student:update','student','update','Update student records'),
  ('student:delete','student','delete','Delete student records'),
  ('teacher:create','teacher','create','Create teacher records'),
  ('teacher:read','teacher','read','View teacher records'),
  ('teacher:update','teacher','update','Update teacher records'),
  ('teacher:delete','teacher','delete','Delete teacher records'),
  ('guardian:create','guardian','create','Create guardian records'),
  ('guardian:read','guardian','read','View guardian records'),
  ('guardian:update','guardian','update','Update guardian records'),
  ('academic:create','academic','create','Manage academic structure'),
  ('academic:read','academic','read','View academic structure'),
  ('academic:update','academic','update','Update academic structure'),
  ('attendance:create','attendance','create','Mark attendance'),
  ('attendance:read','attendance','read','View attendance'),
  ('exam:create','exam','create','Create exams and schedules'),
  ('exam:read','exam','read','View exams'),
  ('exam:update','exam','update','Update exams'),
  ('result:enter','result','enter','Enter marks'),
  ('result:submit','result','submit','Submit marks for verification'),
  ('result:verify','result','verify','Verify submitted marks'),
  ('result:approve','result','approve','Approve verified marks'),
  ('result:publish','result','publish','Publish results'),
  ('result:lock','result','lock','Lock published results'),
  ('result:read','result','read','View results'),
  ('fee:create','fee','create','Create fee charges'),
  ('fee:read','fee','read','View fees'),
  ('fee:update','fee','update','Update fees'),
  ('fee:payment','fee','payment','Collect payments'),
  ('fee:approve','fee','approve','Approve waivers and discounts'),
  ('report:generate','report','generate','Generate reports'),
  ('report:export','report','export','Export report data'),
  ('certificate:create','certificate','create','Issue certificates'),
  ('certificate:verify','certificate','verify','Verify certificates'),
  ('user:create','user','create','Create user accounts'),
  ('user:read','user','read','View users'),
  ('user:update','user','update','Update users'),
  ('user:delete','user','delete','Deactivate users'),
  ('school:read','school','read','View school profile'),
  ('school:update','school','update','Update school profile'),
  ('sms:send','sms','send','Send SMS messages'),
  ('sms:template','sms','template','Manage SMS templates'),
  ('settings:read','settings','read','View settings'),
  ('settings:update','settings','update','Update settings'),
  ('hr:create','hr','create','Create staff and payroll'),
  ('hr:read','hr','read','View HR records'),
  ('hr:update','hr','update','Update HR records'),
  ('transport:read','transport','read','View transport'),
  ('transport:update','transport','update','Manage transport'),
  ('library:read','library','read','Use library'),
  ('library:update','library','update','Manage library'),
  ('compliance:deo-report','compliance','deo-report','DEO enrollment reports'),
  ('compliance:free-seat','compliance','free-seat','Free-seat reports'),
  ('compliance:annual-stats','compliance','annual-stats','Annual statistics'),
  ('document:verify','document','verify','Verify documents'),
  ('date:bs-convert','date','bs-convert','BS/AD date tools'),
  ('role:manage','role','manage','Manage roles and permissions'),
  ('admin:full','admin','full','Full administrative access')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS roles (
  role_id    SERIAL PRIMARY KEY,
  school_id  INTEGER REFERENCES schools(school_id) ON DELETE CASCADE,
  code       VARCHAR(40)  NOT NULL,   -- ADMIN, PRINCIPAL, ... or custom slug
  name_en    VARCHAR(100) NOT NULL,
  name_np    VARCHAR(100),
  is_system  BOOLEAN NOT NULL DEFAULT false,  -- locked template, not editable
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_role_code UNIQUE NULLS NOT DISTINCT (school_id, code)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       INTEGER NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(permission_id) ON DELETE RESTRICT,
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pk_role_permissions PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role_id     INTEGER NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  school_id   INTEGER NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role_id, school_id)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup ON user_roles (school_id, user_id);

CREATE TABLE IF NOT EXISTS school_perm_versions (
  school_id  INTEGER PRIMARY KEY REFERENCES schools(school_id) ON DELETE CASCADE,
  version    BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- System template roles (mirrors ROLE_PERMISSIONS; ADMIN = everything)
-- --------------------------------------------------------------------------
INSERT INTO roles (school_id, code, name_en, is_system, is_active) VALUES
  (NULL,'ADMIN','Administrator',true,true),
  (NULL,'PRINCIPAL','Principal',true,true),
  (NULL,'TEACHER','Teacher',true,true),
  (NULL,'ACCOUNTANT','Accountant',true,true),
  (NULL,'LIBRARIAN','Librarian',true,true),
  (NULL,'STAFF','Staff',true,true),
  (NULL,'STUDENT','Student',true,true),
  (NULL,'PARENT','Parent',true,true)
ON CONFLICT (school_id, code) DO NOTHING;

-- Template grants (ADMIN skipped: resolved as "all permissions" in code).
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM (VALUES
  ('PRINCIPAL','result:read'),('PRINCIPAL','result:approve'),('PRINCIPAL','result:publish'),
  ('PRINCIPAL','certificate:verify'),('PRINCIPAL','report:generate'),('PRINCIPAL','report:export'),
  ('PRINCIPAL','user:read'),('PRINCIPAL','compliance:deo-report'),('PRINCIPAL','compliance:annual-stats'),
  ('PRINCIPAL','school:read'),
  ('TEACHER','student:read'),('TEACHER','guardian:read'),('TEACHER','academic:read'),
  ('TEACHER','attendance:create'),('TEACHER','attendance:read'),('TEACHER','exam:create'),
  ('TEACHER','exam:read'),('TEACHER','result:enter'),('TEACHER','result:submit'),
  ('TEACHER','result:read'),('TEACHER','report:generate'),
  ('ACCOUNTANT','fee:create'),('ACCOUNTANT','fee:read'),('ACCOUNTANT','fee:update'),
  ('ACCOUNTANT','fee:payment'),('ACCOUNTANT','report:generate'),('ACCOUNTANT','report:export'),
  ('LIBRARIAN','library:read'),('LIBRARIAN','library:update'),('LIBRARIAN','student:read'),
  ('STAFF','student:read'),('STAFF','attendance:read'),('STAFF','academic:read'),
  ('STUDENT','student:read'),('STUDENT','result:read'),('STUDENT','attendance:read'),('STUDENT','library:read'),
  ('PARENT','student:read'),('PARENT','result:read'),('PARENT','attendance:read'),('PARENT','fee:read')
) AS v(role_code, perm_code)
JOIN roles r ON r.school_id IS NULL AND r.code = v.role_code
JOIN permissions p ON p.code = v.perm_code
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Backfill memberships from the legacy single user_type column.
INSERT INTO user_roles (user_id, role_id, school_id)
SELECT u.user_id, r.role_id, u.school_id
  FROM users u
  JOIN roles r ON r.school_id IS NULL AND r.code = CASE u.user_type
    WHEN 'ADMIN' THEN 'ADMIN' WHEN 'PRINCIPAL' THEN 'PRINCIPAL'
    WHEN 'TEACHER' THEN 'TEACHER' WHEN 'ACCOUNTANT' THEN 'ACCOUNTANT'
    WHEN 'LIBRARIAN' THEN 'LIBRARIAN' WHEN 'STAFF' THEN 'STAFF'
    WHEN 'STUDENT' THEN 'STUDENT' WHEN 'PARENT' THEN 'PARENT'
    WHEN 'GUARDIAN' THEN 'PARENT' WHEN 'VICE_PRINCIPAL' THEN 'PRINCIPAL'
    ELSE NULL END
 WHERE u.school_id IS NOT NULL
ON CONFLICT (user_id, role_id, school_id) DO NOTHING;
DO $$ DECLARE n integer; BEGIN
  SELECT COUNT(*) INTO n FROM users u
   WHERE u.school_id IS NOT NULL AND NOT EXISTS
    (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.user_id);
  IF n > 0 THEN RAISE NOTICE '% users have unmapped types; static-map fallback applies', n; END IF;
END $$;

-- RLS: templates readable globally, writable never via tenant sessions.
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON roles;
CREATE POLICY tenant_isolation ON roles
  USING (school_id IS NULL OR school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

DO $$ BEGIN
  IF to_regclass('public.role_permissions') IS NOT NULL THEN
    ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE role_permissions FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation ON role_permissions;
    -- readable when the role is global or owned; writable only when owned
    CREATE POLICY tenant_isolation ON role_permissions
      USING (EXISTS (SELECT 1 FROM roles r
                     WHERE r.role_id = role_permissions.role_id
                       AND (r.school_id IS NULL OR r.school_id = current_school_id())))
      WITH CHECK (EXISTS (SELECT 1 FROM roles r
                     WHERE r.role_id = role_permissions.role_id
                       AND r.school_id = current_school_id()));
  END IF;
END $$;

SELECT apply_tenant_rls();
