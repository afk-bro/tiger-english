-- AI Tutor schema (Spec 1) — catalog tables, per-user session/turns, and
-- diagnostic events. Backed by /api/v1/ai-tutor/* and /api/v1/me/ai-tutor/*
-- endpoints; per-user writes go through the service_role from the FastAPI
-- backend via transactional functions added in Task 1.2.
--
-- NOTE: ai_tutor_review_items is intentionally NOT created here — it's
-- deferred to Spec 3 (post-session flow + repeat-after-me).

-- =========================================================================
-- ai_tutor_scenarios — catalog of tutor scenarios (course + free_talk)
-- =========================================================================

CREATE TABLE ai_tutor_scenarios (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT UNIQUE NOT NULL,
  mode                TEXT NOT NULL CHECK (mode IN ('course', 'free_talk')),
  level               TEXT NOT NULL,
  title_en            TEXT NOT NULL,
  title_vi            TEXT NOT NULL,
  description_en      TEXT,
  description_vi      TEXT,
  goal_en             TEXT,
  goal_vi             TEXT,
  is_free             BOOLEAN NOT NULL DEFAULT TRUE,
  ai_persona          TEXT,
  opening_line_en     TEXT NOT NULL,
  opening_audio_path  TEXT,
  sort_order          INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- ai_tutor_scenario_tasks — ordered tasks per scenario, with rule-based
-- evaluator inputs (accept_patterns + correction_templates) inline.
-- =========================================================================

CREATE TABLE ai_tutor_scenario_tasks (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id              UUID NOT NULL REFERENCES ai_tutor_scenarios(id) ON DELETE CASCADE,
  task_key                 TEXT NOT NULL,
  title_en                 TEXT NOT NULL,
  title_vi                 TEXT NOT NULL,
  accept_patterns          JSONB NOT NULL,
  correction_templates     JSONB NOT NULL DEFAULT '[]'::jsonb,
  next_ai_line_en          TEXT,
  next_ai_line_audio_path  TEXT,
  sort_order               INT NOT NULL,
  UNIQUE (scenario_id, task_key)
);

-- =========================================================================
-- ai_tutor_scenario_phrases — phrasebook entries per scenario (≤ ~8/scenario)
-- =========================================================================

CREATE TABLE ai_tutor_scenario_phrases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id     UUID NOT NULL REFERENCES ai_tutor_scenarios(id) ON DELETE CASCADE,
  phrase_en       TEXT NOT NULL,
  translation_vi  TEXT NOT NULL,
  audio_path      TEXT,
  sort_order      INT NOT NULL
);

-- =========================================================================
-- ai_tutor_sessions — one row per (user, scenario, attempt). Partial unique
-- index below enforces ≤1 active session per (user, scenario) at any time.
-- =========================================================================

CREATE TABLE ai_tutor_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id         UUID NOT NULL REFERENCES ai_tutor_scenarios(id),
  status              TEXT NOT NULL CHECK (status IN ('active', 'completed', 'abandoned')),
  current_task_id     UUID REFERENCES ai_tutor_scenario_tasks(id),
  completed_task_ids  UUID[] NOT NULL DEFAULT '{}',
  mistake_count       INT NOT NULL DEFAULT 0,
  xp_awarded          INT NOT NULL DEFAULT 0,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  CHECK (status != 'completed' OR completed_at IS NOT NULL)
);

-- One active session per (user, scenario). Drives resume vs. fresh-start logic.
CREATE UNIQUE INDEX ai_tutor_sessions_user_scenario_active
  ON ai_tutor_sessions (user_id, scenario_id)
  WHERE status = 'active';

-- =========================================================================
-- ai_tutor_turns — append-only dialogue log per session.
-- user_id is denormalized off ai_tutor_sessions for RLS performance
-- (avoids a join in the SELECT-own policy).
-- =========================================================================

CREATE TABLE ai_tutor_turns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES ai_tutor_sessions(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- denormalized for RLS performance
  task_id           UUID REFERENCES ai_tutor_scenario_tasks(id),
  speaker           TEXT NOT NULL CHECK (speaker IN ('ai', 'user')),
  text_en           TEXT,
  audio_path        TEXT,           -- AI: pre-generated; user: NULL in Spec 1
  evaluator_result  JSONB,          -- user turns only
  task_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  correction        JSONB,          -- {corrected_en, explanation_vi, translation_vi, severity, explanation_key}
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ai_tutor_turns_session
  ON ai_tutor_turns (session_id, created_at);

-- =========================================================================
-- ai_tutor_events — product diagnostics (failures, abandons, mic denials).
-- Distinct from user_activity_log; not surfaced to learners.
-- user_id and session_id are both nullable (unauth events; orphaned sessions).
-- =========================================================================

CREATE TABLE ai_tutor_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id  UUID REFERENCES ai_tutor_sessions(id) ON DELETE SET NULL,
  event_type  TEXT NOT NULL,        -- e.g. 'turn.failed.stt', 'session.abandoned', 'mic.denied'
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ai_tutor_events_user_recent
  ON ai_tutor_events (user_id, created_at DESC);

CREATE INDEX ai_tutor_events_type_recent
  ON ai_tutor_events (event_type, created_at DESC);

-- =========================================================================
-- Row Level Security
-- Catalog tables: any authenticated user may SELECT.
-- Per-user tables: SELECT only own rows.
-- ai_tutor_events: NO SELECT policy — diagnostic only, admin endpoint later.
-- All writes go through service_role (bypasses RLS) via transactional fns.
-- =========================================================================

ALTER TABLE ai_tutor_scenarios        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_scenario_tasks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_scenario_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_turns            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_events           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_scenarios" ON ai_tutor_scenarios
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "auth_select_tasks" ON ai_tutor_scenario_tasks
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "auth_select_phrases" ON ai_tutor_scenario_phrases
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "users_select_own_sessions" ON ai_tutor_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "users_select_own_turns" ON ai_tutor_turns
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ai_tutor_events: no SELECT policy — diagnostic only

-- =========================================================================
-- Grants
-- Catalog: SELECT to authenticated.
-- Per-user reads: SELECT to authenticated (RLS narrows to own rows).
-- Writes: scoped to the new tables only (mirrors review_items pattern;
-- avoids the broader ALL TABLES IN SCHEMA public grant).
-- =========================================================================

GRANT SELECT ON ai_tutor_scenarios        TO authenticated;
GRANT SELECT ON ai_tutor_scenario_tasks   TO authenticated;
GRANT SELECT ON ai_tutor_scenario_phrases TO authenticated;
GRANT SELECT ON ai_tutor_sessions         TO authenticated;
GRANT SELECT ON ai_tutor_turns            TO authenticated;
-- ai_tutor_events: no SELECT grant to authenticated.

GRANT INSERT, UPDATE, DELETE ON ai_tutor_scenarios        TO service_role;
GRANT INSERT, UPDATE, DELETE ON ai_tutor_scenario_tasks   TO service_role;
GRANT INSERT, UPDATE, DELETE ON ai_tutor_scenario_phrases TO service_role;
GRANT INSERT, UPDATE, DELETE ON ai_tutor_sessions         TO service_role;
GRANT INSERT, UPDATE, DELETE ON ai_tutor_turns            TO service_role;
GRANT INSERT, UPDATE, DELETE ON ai_tutor_events           TO service_role;

-- =========================================================================
-- user_activity_log: extend the type CHECK to include the two new tutor
-- progress event types written by the (Task 1.2) transactional functions
-- record_tutor_exchange_tx and complete_tutor_session_tx.
--
-- The existing constraint (from 20260503000001_phase1_progress_tracking.sql)
-- is a TEXT CHECK with an inline enum-style list — NOT a Postgres enum
-- type — so we drop and recreate the CHECK with the expanded value set.
-- The constraint name follows Postgres's auto-generated convention
-- (<table>_<column>_check). If a future migration renames it, update here.
-- =========================================================================

ALTER TABLE user_activity_log
  DROP CONSTRAINT IF EXISTS user_activity_log_type_check;

ALTER TABLE user_activity_log
  ADD CONSTRAINT user_activity_log_type_check CHECK (type IN (
    'lesson_section_completed',
    'exercise_attempted',
    'flashcard_reviewed',
    'tutor_session_completed',
    'tutor_task_completed'
  ));
