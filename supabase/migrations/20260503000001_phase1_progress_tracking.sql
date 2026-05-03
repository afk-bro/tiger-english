-- Phase 1: Progress tracking — projection tables, event log, transactional
-- write functions, and RLS policies.

-- =========================================================================
-- profiles.timezone
-- =========================================================================

ALTER TABLE profiles ADD COLUMN timezone TEXT;

-- =========================================================================
-- user_activity_log: source-of-truth event stream (append-only)
-- =========================================================================

CREATE TABLE user_activity_log (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN (
                    'lesson_section_completed',
                    'exercise_attempted',
                    'flashcard_reviewed'
                  )),
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key TEXT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_log_user_created
  ON user_activity_log (user_id, created_at DESC);

CREATE UNIQUE INDEX idx_activity_log_idempotency
  ON user_activity_log (user_id, type, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_activity_log" ON user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

-- =========================================================================
-- lesson_section_progress: current-state projection (one row per completion)
-- =========================================================================

CREATE TABLE lesson_section_progress (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_slug    TEXT NOT NULL,
  section_key  TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, unit_slug, section_key)
);

CREATE INDEX idx_lsp_user ON lesson_section_progress (user_id);

ALTER TABLE lesson_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_lesson_progress" ON lesson_section_progress
  FOR SELECT USING (auth.uid() = user_id);

-- =========================================================================
-- exercise_attempts: append-only history of every answer
-- =========================================================================

CREATE TABLE exercise_attempts (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_slug    TEXT NOT NULL,
  section_key  TEXT NOT NULL,
  exercise_id  TEXT NOT NULL,
  is_correct   BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ea_user_attempted ON exercise_attempts (user_id, attempted_at DESC);
CREATE INDEX idx_ea_user_exercise  ON exercise_attempts (user_id, exercise_id);

ALTER TABLE exercise_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_exercise_attempts" ON exercise_attempts
  FOR SELECT USING (auth.uid() = user_id);

-- =========================================================================
-- flashcard_reviews: append-only review history (sits alongside
-- existing user_card_progress current-state table)
-- =========================================================================

CREATE TABLE flashcard_reviews (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  status       TEXT NOT NULL CHECK (status IN ('known', 'unknown')),
  reviewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fr_user_reviewed ON flashcard_reviews (user_id, reviewed_at DESC);

ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_flashcard_reviews" ON flashcard_reviews
  FOR SELECT USING (auth.uid() = user_id);

-- =========================================================================
-- Transactional write functions (one per domain action).
-- Each function is the SINGLE write path for its domain action; the
-- backend service layer calls these via supabase.rpc().
-- =========================================================================

CREATE OR REPLACE FUNCTION complete_lesson_section_tx(
  p_user_id UUID,
  p_unit_slug TEXT,
  p_section_key TEXT,
  p_idempotency_key TEXT
) RETURNS lesson_section_progress
SET search_path = public, pg_temp, auth
AS $$
DECLARE
  result lesson_section_progress;
BEGIN
  INSERT INTO lesson_section_progress (user_id, unit_slug, section_key)
  VALUES (p_user_id, p_unit_slug, p_section_key)
  ON CONFLICT (user_id, unit_slug, section_key) DO NOTHING;

  INSERT INTO user_activity_log (user_id, type, payload, idempotency_key)
  VALUES (
    p_user_id,
    'lesson_section_completed',
    jsonb_build_object('unit_slug', p_unit_slug, 'section_key', p_section_key),
    p_idempotency_key
  )
  ON CONFLICT (user_id, type, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

  SELECT * INTO result FROM lesson_section_progress
  WHERE user_id = p_user_id AND unit_slug = p_unit_slug AND section_key = p_section_key;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION submit_exercise_attempt_tx(
  p_user_id UUID,
  p_unit_slug TEXT,
  p_section_key TEXT,
  p_exercise_id TEXT,
  p_is_correct BOOLEAN
) RETURNS exercise_attempts
SET search_path = public, pg_temp, auth
AS $$
DECLARE
  result exercise_attempts;
BEGIN
  INSERT INTO exercise_attempts (user_id, unit_slug, section_key, exercise_id, is_correct)
  VALUES (p_user_id, p_unit_slug, p_section_key, p_exercise_id, p_is_correct)
  RETURNING * INTO result;

  INSERT INTO user_activity_log (user_id, type, payload)
  VALUES (
    p_user_id,
    'exercise_attempted',
    jsonb_build_object(
      'unit_slug', p_unit_slug,
      'section_key', p_section_key,
      'exercise_id', p_exercise_id,
      'is_correct', p_is_correct
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION review_flashcard_tx(
  p_user_id UUID,
  p_flashcard_id UUID,
  p_status TEXT
) RETURNS flashcard_reviews
SET search_path = public, pg_temp, auth
AS $$
DECLARE
  result flashcard_reviews;
BEGIN
  -- Upsert current state
  INSERT INTO user_card_progress (user_id, flashcard_id, status, last_studied_at)
  VALUES (p_user_id, p_flashcard_id, p_status, NOW())
  ON CONFLICT (user_id, flashcard_id) DO UPDATE
    SET status = EXCLUDED.status,
        last_studied_at = EXCLUDED.last_studied_at;

  -- Append review history row
  INSERT INTO flashcard_reviews (user_id, flashcard_id, status)
  VALUES (p_user_id, p_flashcard_id, p_status)
  RETURNING * INTO result;

  -- Append event log row
  INSERT INTO user_activity_log (user_id, type, payload)
  VALUES (
    p_user_id,
    'flashcard_reviewed',
    jsonb_build_object('flashcard_id', p_flashcard_id, 'status', p_status)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_study_days(p_user_id UUID, p_tz TEXT)
RETURNS TABLE(day DATE)
SET search_path = public, pg_temp, auth
AS $$
  SELECT DISTINCT (created_at AT TIME ZONE p_tz)::date AS day
  FROM user_activity_log
  WHERE user_id = p_user_id
  ORDER BY day DESC;
$$ LANGUAGE sql SECURITY DEFINER;

-- =========================================================================
-- Function permissions: progress functions are callable ONLY by the
-- backend service role (which uses the Supabase service-role key and
-- bypasses RLS). Anon and authenticated clients cannot call these via
-- supabase.rpc() — writes happen exclusively through the FastAPI
-- backend, matching the project's "secrets/writes behind the backend"
-- pattern.
--
-- Without this, Postgres's default GRANT EXECUTE TO PUBLIC combined
-- with Supabase auto-exposing functions via PostgREST RPC would let
-- any authenticated user call e.g.
--   supabase.rpc('review_flashcard_tx', { p_user_id: '<victim>', ... })
-- and corrupt another user's data.
-- =========================================================================

REVOKE EXECUTE ON FUNCTION complete_lesson_section_tx(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION complete_lesson_section_tx(UUID, TEXT, TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION complete_lesson_section_tx(UUID, TEXT, TEXT, TEXT) FROM authenticated;

REVOKE EXECUTE ON FUNCTION submit_exercise_attempt_tx(UUID, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION submit_exercise_attempt_tx(UUID, TEXT, TEXT, TEXT, BOOLEAN) FROM anon;
REVOKE EXECUTE ON FUNCTION submit_exercise_attempt_tx(UUID, TEXT, TEXT, TEXT, BOOLEAN) FROM authenticated;

REVOKE EXECUTE ON FUNCTION review_flashcard_tx(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION review_flashcard_tx(UUID, UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION review_flashcard_tx(UUID, UUID, TEXT) FROM authenticated;

REVOKE EXECUTE ON FUNCTION user_study_days(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION user_study_days(UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION user_study_days(UUID, TEXT) FROM authenticated;

GRANT EXECUTE ON FUNCTION complete_lesson_section_tx(UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION submit_exercise_attempt_tx(UUID, TEXT, TEXT, TEXT, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION review_flashcard_tx(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION user_study_days(UUID, TEXT) TO service_role;

-- =========================================================================
-- Table grants: defense-in-depth alongside the SELECT-own RLS policies.
-- The backend service role bypasses RLS via service_role key, so writes
-- always work. The SELECT grants make the RLS SELECT-own policies
-- meaningful for any future direct-from-frontend reads via the anon
-- key (currently none in Phase 1, but the policies are now active
-- rather than dead code).
-- =========================================================================

GRANT SELECT ON user_activity_log TO authenticated;
GRANT SELECT ON lesson_section_progress TO authenticated;
GRANT SELECT ON exercise_attempts TO authenticated;
GRANT SELECT ON flashcard_reviews TO authenticated;
