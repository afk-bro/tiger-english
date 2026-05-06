-- Add CEFR proficiency columns to profiles.
--
-- PR #119 introduced frontend code (useUserStore.fetchProfile, Settings page,
-- YourProgressCard) that reads `cefr_estimate` and `target_cefr_level`, plus
-- a backend PATCH /api/v1/profile that writes `target_cefr_level`. The columns
-- were never added to the schema, so every authenticated page load logs three
-- 400 "column profiles.cefr_estimate does not exist" errors. This migration
-- closes that gap.
--
-- Allowed values match backend/app/models/auth.py::VALID_CEFR_LEVELS.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cefr_estimate TEXT
    CHECK (cefr_estimate IS NULL OR cefr_estimate IN ('A0','A1','A2','B1','B1+','B2','C1')),
  ADD COLUMN IF NOT EXISTS target_cefr_level TEXT
    CHECK (target_cefr_level IS NULL OR target_cefr_level IN ('A0','A1','A2','B1','B1+','B2','C1'));

COMMENT ON COLUMN profiles.cefr_estimate    IS 'Learner''s estimated CEFR level (set by exit assessments / skill scoring).';
COMMENT ON COLUMN profiles.target_cefr_level IS 'Learner''s self-set target CEFR level (set in Settings).';
