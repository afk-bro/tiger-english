-- Add `role` column to profiles to back the frontend RequireTeacher route
-- guard (and a forthcoming RequireAdmin guard shipping in a follow-up PR).
-- Purely a UI-gating signal — the authoritative gate for /api/v1/admin/*
-- endpoints remains the env-based SUPER_ADMIN_USER_IDS allowlist in
-- backend/app/api/v1/admin.py.
--
-- Default is 'user'; role assignment for teachers/admins is an operational
-- concern handled out-of-band (e.g. SQL update after onboarding).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'teacher', 'admin'));

COMMENT ON COLUMN profiles.role IS
  'UI-gating role: ''user'' | ''teacher'' | ''admin''. Frontend route guards (RequireTeacher, RequireAdmin) read this. Backend /admin endpoints use SUPER_ADMIN_USER_IDS env allowlist as the authoritative gate, not this column.';
