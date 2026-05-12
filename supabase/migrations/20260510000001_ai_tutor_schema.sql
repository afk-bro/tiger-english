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

-- =========================================================================
-- Transactional functions for the AI Tutor session lifecycle.
--
-- All four functions are SECURITY DEFINER and called only by the FastAPI
-- backend via supabase.rpc() under the service_role key. EXECUTE is
-- REVOKEd from PUBLIC/anon/authenticated and GRANTed to service_role at
-- the bottom of this section, mirroring the progress-tracking functions
-- in 20260503000001_phase1_progress_tracking.sql.
--
-- Pattern parity with complete_lesson_section_tx:
--   * SET search_path = public, pg_temp, auth
--   * SECURITY DEFINER
--   * LANGUAGE plpgsql
--   * One BEGIN...END block per function; everything inside is atomic.
-- =========================================================================

-- ---------- start_tutor_session_tx ----------------------------------------
-- Returns the active session_id for (user, scenario), creating one if
-- needed. _mode='continue' resumes any existing active session;
-- _mode='fresh' marks an existing active session as abandoned (with a
-- 'session.abandoned' event, reason='started_fresh') before creating a
-- new one. Both new-session branches emit a 'session.started' event.
-- The UNIQUE(user_id, scenario_id) WHERE status='active' partial index
-- backstops the abandon-then-insert sequence.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION start_tutor_session_tx(
  _user_id UUID,
  _scenario_id UUID,
  _mode TEXT
) RETURNS UUID
SET search_path = public, pg_temp, auth
AS $$
DECLARE
  existing_session_id UUID;
  new_session_id      UUID;
  first_task_id       UUID;
  scenario_slug_v     TEXT;
BEGIN
  IF _mode NOT IN ('fresh', 'continue') THEN
    RAISE EXCEPTION 'invalid mode: %', _mode;
  END IF;

  -- Look up any currently-active session for (user, scenario).
  SELECT id INTO existing_session_id
  FROM ai_tutor_sessions
  WHERE user_id = _user_id
    AND scenario_id = _scenario_id
    AND status = 'active'
  LIMIT 1;

  IF _mode = 'continue' AND existing_session_id IS NOT NULL THEN
    RETURN existing_session_id;
  END IF;

  -- 'fresh' branch: implicitly abandon the existing active session, if any.
  IF _mode = 'fresh' AND existing_session_id IS NOT NULL THEN
    UPDATE ai_tutor_sessions
    SET status = 'abandoned'
    WHERE id = existing_session_id;

    INSERT INTO ai_tutor_events (user_id, session_id, event_type, payload)
    VALUES (
      _user_id,
      existing_session_id,
      'session.abandoned',
      jsonb_build_object('reason', 'started_fresh')
    );
  END IF;

  -- Resolve first task (by sort_order) for the scenario.
  SELECT id INTO first_task_id
  FROM ai_tutor_scenario_tasks
  WHERE scenario_id = _scenario_id
  ORDER BY sort_order ASC
  LIMIT 1;

  -- Resolve scenario slug for the session.started event payload.
  SELECT slug INTO scenario_slug_v
  FROM ai_tutor_scenarios
  WHERE id = _scenario_id;

  -- Create the new active session.
  INSERT INTO ai_tutor_sessions (
    user_id, scenario_id, status, current_task_id
  )
  VALUES (
    _user_id, _scenario_id, 'active', first_task_id
  )
  RETURNING id INTO new_session_id;

  INSERT INTO ai_tutor_events (user_id, session_id, event_type, payload)
  VALUES (
    _user_id,
    new_session_id,
    'session.started',
    jsonb_build_object('scenario_slug', scenario_slug_v, 'mode', _mode)
  );

  RETURN new_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------- record_tutor_exchange_tx --------------------------------------
-- One atomic exchange: user turn (always) + optional AI turn + optional
-- task advance + optional mistake-count bump. The user turn carries the
-- task_id read BEFORE any update, so it remains attributed to the task
-- that was current when the user spoke, even when this same call advances
-- the session's current_task_id.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION record_tutor_exchange_tx(
  _session_id            UUID,
  _user_id               UUID,
  _user_text             TEXT,
  _user_evaluator_result JSONB,
  _user_correction       JSONB,
  _completed_task_id     UUID,
  _next_task_id          UUID,
  _ai_text               TEXT,
  _ai_audio_path         TEXT,
  _ai_task_id            UUID
) RETURNS VOID
SET search_path = public, pg_temp, auth
AS $$
DECLARE
  pre_update_task_id UUID;
  scenario_slug_v    TEXT;
  task_key_v         TEXT;
  severity_v         TEXT;
BEGIN
  -- Read current_task_id BEFORE any update; the user turn is attributed
  -- to the task that was current when they spoke.
  SELECT s.current_task_id, sc.slug
  INTO pre_update_task_id, scenario_slug_v
  FROM ai_tutor_sessions s
  JOIN ai_tutor_scenarios sc ON sc.id = s.scenario_id
  WHERE s.id = _session_id;

  -- 1. User turn (always inserted).
  INSERT INTO ai_tutor_turns (
    session_id, user_id, task_id, speaker, text_en,
    evaluator_result, correction, task_completed
  )
  VALUES (
    _session_id, _user_id, pre_update_task_id, 'user', _user_text,
    _user_evaluator_result, _user_correction,
    (_completed_task_id IS NOT NULL)
  );

  -- 2. AI turn (optional).
  IF _ai_text IS NOT NULL THEN
    INSERT INTO ai_tutor_turns (
      session_id, user_id, task_id, speaker, text_en, audio_path
    )
    VALUES (
      _session_id, _user_id, _ai_task_id, 'ai', _ai_text, _ai_audio_path
    );
  END IF;

  -- 3. Single consolidated session UPDATE: task advance (if any),
  --    mistake bump (if any), and last_activity_at bump (always).
  --    Folding the previous three separate UPDATEs into one reduces WAL
  --    volume and dodges any lock-ordering risk between them.
  UPDATE ai_tutor_sessions
  SET completed_task_ids = CASE
        WHEN _completed_task_id IS NOT NULL
        THEN completed_task_ids || _completed_task_id
        ELSE completed_task_ids
      END,
      current_task_id    = CASE
        WHEN _completed_task_id IS NOT NULL
        THEN _next_task_id
        ELSE current_task_id
      END,
      mistake_count      = mistake_count
        + (CASE WHEN _user_correction IS NOT NULL THEN 1 ELSE 0 END),
      last_activity_at   = NOW()
  WHERE id = _session_id;

  -- 4. Learner-facing activity log row for the task advance (still gated
  --    on _completed_task_id IS NOT NULL — separate from the UPDATE above).
  IF _completed_task_id IS NOT NULL THEN
    SELECT task_key INTO task_key_v
    FROM ai_tutor_scenario_tasks
    WHERE id = _completed_task_id;

    severity_v := COALESCE(_user_correction->>'severity', 'none');

    INSERT INTO user_activity_log (user_id, type, payload)
    VALUES (
      _user_id,
      'tutor_task_completed',
      jsonb_build_object(
        'session_id',     _session_id,
        'scenario_slug',  scenario_slug_v,
        'task_key',       task_key_v,
        'severity',       severity_v,
        'has_correction', (_user_correction IS NOT NULL)
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------- complete_tutor_session_tx -------------------------------------
-- Marks the session completed, awards XP (additive on user_stats), and
-- writes the learner-facing tutor_session_completed activity log row.
-- All three writes are atomic.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION complete_tutor_session_tx(
  _session_id  UUID,
  _xp_awarded  INT
) RETURNS VOID
SET search_path = public, pg_temp, auth
AS $$
DECLARE
  user_id_v          UUID;
  scenario_slug_v    TEXT;
  tasks_completed_v  INT;
  mistake_count_v    INT;
  duration_s_v       INT;
BEGIN
  -- Mark session completed, capture activity-log payload fields, AND
  -- resolve the scenario slug in one round trip (UPDATE ... FROM ...).
  -- The status='active' guard makes double-finish a silent no-op:
  -- a second call after the first succeeded will RETURNING zero rows,
  -- leaving user_id_v NULL, and we return early below — no second XP
  -- award, no second activity_log row, no second event.
  UPDATE ai_tutor_sessions s
  SET status           = 'completed',
      completed_at     = NOW(),
      xp_awarded       = _xp_awarded,
      last_activity_at = NOW()
  FROM ai_tutor_scenarios sc
  WHERE s.id = _session_id
    AND s.status = 'active'
    AND sc.id = s.scenario_id
  RETURNING
    s.user_id,
    sc.slug,
    COALESCE(array_length(s.completed_task_ids, 1), 0),
    s.mistake_count,
    EXTRACT(EPOCH FROM (NOW() - s.started_at))::INT
  INTO user_id_v, scenario_slug_v, tasks_completed_v, mistake_count_v, duration_s_v;

  -- Idempotent no-op: session was already completed/abandoned, or doesn't
  -- exist. Either way, do NOT re-award XP or re-emit the activity row.
  IF user_id_v IS NULL THEN
    RETURN;
  END IF;

  -- Award XP additively. user_stats has a row per user (seeded at
  -- registration); use UPDATE rather than UPSERT to surface missing rows.
  UPDATE user_stats
  SET xp = xp + _xp_awarded
  WHERE user_id = user_id_v;

  INSERT INTO user_activity_log (user_id, type, payload)
  VALUES (
    user_id_v,
    'tutor_session_completed',
    jsonb_build_object(
      'session_id',      _session_id,
      'scenario_slug',   scenario_slug_v,
      'xp_awarded',      _xp_awarded,
      'tasks_completed', tasks_completed_v,
      'mistake_count',   mistake_count_v,
      'duration_s',      duration_s_v
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------- abandon_tutor_session_tx --------------------------------------
-- Explicit-cancel path. The 'fresh' branch of start_tutor_session_tx
-- handles the implicit-abandon-on-restart case inline.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION abandon_tutor_session_tx(
  _session_id UUID,
  _reason     TEXT
) RETURNS VOID
SET search_path = public, pg_temp, auth
AS $$
DECLARE
  user_id_v UUID;
BEGIN
  -- The status='active' guard makes double-abandon a silent no-op:
  -- a second call after the first succeeded RETURNING zero rows leaves
  -- user_id_v NULL and we return early — no duplicate session.abandoned
  -- event is emitted.
  UPDATE ai_tutor_sessions
  SET status = 'abandoned'
  WHERE id = _session_id
    AND status = 'active'
  RETURNING user_id INTO user_id_v;

  -- Idempotent no-op: session was already completed/abandoned, or doesn't
  -- exist. Either way, do NOT re-emit the abandoned event.
  IF user_id_v IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO ai_tutor_events (user_id, session_id, event_type, payload)
  VALUES (
    user_id_v,
    _session_id,
    'session.abandoned',
    jsonb_build_object('reason', _reason)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- Function permissions: tutor session functions are callable ONLY by the
-- backend service role. Mirrors the progress-tracking pattern in
-- 20260503000001_phase1_progress_tracking.sql — without these REVOKEs
-- Postgres's default GRANT EXECUTE TO PUBLIC combined with PostgREST
-- auto-RPC exposure would let any authenticated user call e.g.
--   supabase.rpc('complete_tutor_session_tx', { _session_id, _xp_awarded })
-- and award themselves XP / corrupt other users' sessions.
-- =========================================================================

REVOKE EXECUTE ON FUNCTION start_tutor_session_tx(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION start_tutor_session_tx(UUID, UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION start_tutor_session_tx(UUID, UUID, TEXT) FROM authenticated;

REVOKE EXECUTE ON FUNCTION record_tutor_exchange_tx(UUID, UUID, TEXT, JSONB, JSONB, UUID, UUID, TEXT, TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION record_tutor_exchange_tx(UUID, UUID, TEXT, JSONB, JSONB, UUID, UUID, TEXT, TEXT, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION record_tutor_exchange_tx(UUID, UUID, TEXT, JSONB, JSONB, UUID, UUID, TEXT, TEXT, UUID) FROM authenticated;

REVOKE EXECUTE ON FUNCTION complete_tutor_session_tx(UUID, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION complete_tutor_session_tx(UUID, INT) FROM anon;
REVOKE EXECUTE ON FUNCTION complete_tutor_session_tx(UUID, INT) FROM authenticated;

REVOKE EXECUTE ON FUNCTION abandon_tutor_session_tx(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION abandon_tutor_session_tx(UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION abandon_tutor_session_tx(UUID, TEXT) FROM authenticated;

GRANT EXECUTE ON FUNCTION start_tutor_session_tx(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION record_tutor_exchange_tx(UUID, UUID, TEXT, JSONB, JSONB, UUID, UUID, TEXT, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION complete_tutor_session_tx(UUID, INT) TO service_role;
GRANT EXECUTE ON FUNCTION abandon_tutor_session_tx(UUID, TEXT) TO service_role;
