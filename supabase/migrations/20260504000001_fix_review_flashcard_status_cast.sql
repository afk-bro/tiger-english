-- Fix: review_flashcard_tx was inserting p_status (text) directly into
-- user_card_progress.status, which is the card_status enum. Postgres
-- requires an explicit cast for text → enum, so the original function
-- failed at runtime with:
--   column "status" is of type card_status but expression is of type text
--
-- Surface: any flashcard known/unknown click from the UI got a 500 from
-- /me/progress/review-flashcard. flashcard_reviews and user_activity_log
-- never picked up rows for review events.
--
-- Fix: cast p_status to card_status at the upsert. flashcard_reviews.status
-- is TEXT and stays as-is.

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
  VALUES (p_user_id, p_flashcard_id, p_status::card_status, NOW())
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
    jsonb_build_object(
      'flashcard_id', p_flashcard_id,
      'status', p_status
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
