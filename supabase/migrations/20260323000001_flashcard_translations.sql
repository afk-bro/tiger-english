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
      '00000000-0000-0000-0000-000000000002',
      'c5543caa-e6bc-b529-1c87-f8fb105ca57d',
      '4dd49c50-0c22-95f8-778c-604aecab4a5a',
      '87cc9ab4-0e1c-be14-3286-9a05e906effe',
      '0d716dca-681a-1ee0-a7b7-1f093d5429cc',
      '39b3a616-f9f2-e290-a7d4-bc03c30851cd',
      '86bb7f26-33ff-e4fa-4268-51b1d2a965b8',
      'cecc9bfc-8086-b8e5-c793-839f50eb7b8b',
      '28c8f4ca-d072-8c4a-fbd2-6f4438cf574b',
      '6c14435e-ac23-c1db-78d7-5c5f9e30f9b0',
      '3e698b90-bfda-c9cb-8042-a0616ef85910',
      'f6af32e3-ed88-ec1e-3004-8736d589cf2e',
      '4375bc23-c8e6-ae1f-0925-70a8eeefed39',
      '10dcdbb5-517c-257e-56e6-258458edcf25',
      '75edd4a4-8f3f-b458-de8a-7398a9e0faf5',
      'bdb49c90-9690-3598-2a43-4bc811df2ddd',
      'dcf29f3d-3d44-ce90-0f15-9461e79af43e',
      'bf91ca3a-1356-273e-fe1f-f837199eb9c9'
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
