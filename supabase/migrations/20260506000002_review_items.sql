-- review_items: SM-2 spaced repetition queue per user.
-- Backed by /api/v1/me/review/* endpoints; writes go through the
-- service_role from the FastAPI backend (conversations.py, review.py).

CREATE TABLE review_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type        TEXT NOT NULL CHECK (item_type IN (
                     'word',
                     'phrase',
                     'grammar_pattern',
                     'common_error',
                     'dialogue_line'
                   )),
  prompt           TEXT NOT NULL,
  answer           TEXT NOT NULL,
  translation      TEXT,
  note             TEXT,
  -- SM-2 scheduling state
  ease_factor      FLOAT NOT NULL DEFAULT 2.5,
  interval_days    INTEGER NOT NULL DEFAULT 1,
  streak_correct   INTEGER NOT NULL DEFAULT 0,
  next_review_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Provenance: which exercise/conversation generated this item
  source_type      TEXT,
  source_id        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_review_items_user_due
  ON review_items (user_id, next_review_at);

CREATE INDEX idx_review_items_user_source
  ON review_items (user_id, source_type, source_id);

ALTER TABLE review_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_review_items" ON review_items
  FOR SELECT USING (auth.uid() = user_id);

GRANT SELECT ON review_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON review_items TO service_role;
