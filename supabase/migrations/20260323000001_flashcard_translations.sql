-- supabase/migrations/20260323000001_flashcard_translations.sql

-- 1. Languages reference table
CREATE TABLE languages (
  code  text PRIMARY KEY CHECK (code = lower(trim(code)) AND length(trim(code)) > 0),
  name  text NOT NULL
);

INSERT INTO languages (code, name) VALUES
  ('th', 'Thai'),
  ('zh', 'Chinese'),
  ('vi', 'Vietnamese');

GRANT SELECT ON languages TO anon, authenticated;

-- 2. Flashcard translations table
CREATE TABLE flashcard_translations (
  flashcard_id      uuid NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  language_code     text NOT NULL REFERENCES languages(code),
  native_text       text NOT NULL CHECK (length(trim(native_text)) > 0),
  native_audio_url  text,
  source            text NOT NULL DEFAULT 'ai'
                    CHECK (source IN ('ai', 'human', 'import')),
  is_reviewed       bool NOT NULL DEFAULT false,
  updated_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (flashcard_id, language_code)
);

CREATE INDEX idx_flashcard_translations_lookup
  ON flashcard_translations (flashcard_id, language_code);

-- extensions.moddatetime is already enabled in 20260319000001_initial_schema.sql
CREATE TRIGGER handle_flashcard_translations_updated_at
  BEFORE UPDATE ON flashcard_translations
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);

ALTER TABLE flashcard_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flashcard_translations_select" ON flashcard_translations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM flashcards f
      JOIN flashcard_sets s ON s.id = f.set_id
      WHERE f.id = flashcard_translations.flashcard_id
        AND (
          s.created_by IS NULL
          OR s.is_public = true
          OR s.created_by = auth.uid()
        )
    )
  );

GRANT SELECT ON flashcard_translations TO anon, authenticated;

-- 3. Drop native_audio_url from flashcards (added in schema v2 but never populated)
ALTER TABLE flashcards DROP COLUMN native_audio_url;

-- 4. Add profiles.native_language (nullable FK — NOT NULL enforced in follow-up migration)
ALTER TABLE profiles
  ADD COLUMN native_language text REFERENCES languages(code);

-- 5. Guard: fail if unexpected curated sets exist (UUIDs are stable constants)
DO $$
DECLARE unexpected_count int;
BEGIN
  SELECT COUNT(*) INTO unexpected_count
  FROM flashcard_sets
  WHERE created_by IS NULL
    AND id NOT IN (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002'
    );
  IF unexpected_count > 0 THEN
    RAISE EXCEPTION 'Unexpected curated sets found — update migration before proceeding';
  END IF;
END $$;

-- 6. Backfill existing curated sets into flashcard_translations
INSERT INTO flashcard_translations
  (flashcard_id, language_code, native_text, source, is_reviewed)
SELECT
  f.id,
  CASE s.id
    WHEN '00000000-0000-0000-0000-000000000001' THEN 'th'
    WHEN '00000000-0000-0000-0000-000000000002' THEN 'zh'
  END,
  f.native_text,
  'human',
  true
FROM flashcards f
JOIN flashcard_sets s ON s.id = f.set_id
WHERE s.created_by IS NULL
  AND s.id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002'
  )
ON CONFLICT (flashcard_id, language_code) DO NOTHING;
