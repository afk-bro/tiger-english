-- skill_scores: per-user, per-skill EWMA score with sample-size counter.
-- Backed by /api/v1/me/skills/summary and updated by
-- backend/app/services/skill_scoring_service.py after every exercise
-- attempt and AI-tutor / conversation interaction.
--
-- Why this migration exists: the service has always been written to
-- this schema (it issues SELECT skill, score, sample_size, last_updated_at
-- FROM skill_scores plus an UPSERT keyed on user_id,skill), but no
-- migration ever created the table. The service silently caught the
-- "relation does not exist" error and fell back to a process-lifetime
-- in-memory dict (backend/app/core/in_memory_skills.py), which is why
-- the dashboard's skill breakdown appears to save during a session and
-- then resets — every Railway redeploy / idle scale-down / worker
-- recycle wiped the dict.

CREATE TABLE skill_scores (
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill            TEXT NOT NULL CHECK (skill IN (
                     'vocabulary_range',
                     'vocabulary_accuracy',
                     'grammar_accuracy',
                     'grammar_range',
                     'pronunciation',
                     'fluency',
                     'listening_comprehension',
                     'reading_comprehension',
                     'writing_organization',
                     'task_completion',
                     'interaction_quality'
                   )),
  score            FLOAT NOT NULL DEFAULT 0.0 CHECK (score >= 0.0 AND score <= 5.0),
  sample_size      INTEGER NOT NULL DEFAULT 0 CHECK (sample_size >= 0),
  last_updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, skill)
);

ALTER TABLE skill_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_skill_scores" ON skill_scores
  FOR SELECT USING (auth.uid() = user_id);

GRANT SELECT ON skill_scores TO authenticated;
-- Explicit service_role grants. Supabase Cloud's default role config
-- gives service_role broad access on tables in `public`, so existing
-- migrations (e.g. review_items) work without these. Listing them
-- here documents intent and protects the FastAPI backend's read +
-- upsert flow against any future tightening of role defaults — without
-- the SELECT grant, get_summary's SELECT would fail with permission
-- denied and the service would fall right back into the in-memory
-- store this migration is meant to retire.
GRANT SELECT, INSERT, UPDATE, DELETE ON skill_scores TO service_role;
