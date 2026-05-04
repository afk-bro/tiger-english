-- supabase/migrations/20260504000003_flashcard_set_slugs.sql
-- Adds a nullable slug column to flashcard_sets for the 17 curated sets,
-- so the frontend can key i18n locale lookups by stable slug rather than
-- mutable title text. User-created sets (created_by IS NOT NULL) keep
-- slug = NULL and render the user's typed title untouched.

ALTER TABLE flashcard_sets ADD COLUMN slug TEXT;

-- Partial unique index: enforces no two curated sets share a slug,
-- without forcing user-created sets to invent one.
CREATE UNIQUE INDEX flashcard_sets_slug_unique
  ON flashcard_sets (slug) WHERE slug IS NOT NULL;

-- Backfill the 17 curated sets seeded by 20260322000001_seed_csv_sets.sql.
-- Slugs come from the CSV filenames in that seed's section headers.
UPDATE flashcard_sets SET slug = 'greetings_small_talk'        WHERE id = 'c5543caa-e6bc-b529-1c87-f8fb105ca57d';
UPDATE flashcard_sets SET slug = 'numbers_1_100'                WHERE id = '4dd49c50-0c22-95f8-778c-604aecab4a5a';
UPDATE flashcard_sets SET slug = 'numbers_1_100_words'          WHERE id = '87cc9ab4-0e1c-be14-3286-9a05e906effe';
UPDATE flashcard_sets SET slug = 'numbers_1_100_phonetic'       WHERE id = '0d716dca-681a-1ee0-a7b7-1f093d5429cc';
UPDATE flashcard_sets SET slug = 'fruit_20_basic'               WHERE id = '39b3a616-f9f2-e290-a7d4-bc03c30851cd';
UPDATE flashcard_sets SET slug = 'vegetables_20_basic'          WHERE id = '86bb7f26-33ff-e4fa-4268-51b1d2a965b8';
UPDATE flashcard_sets SET slug = 'food_single_words_basic'      WHERE id = 'cecc9bfc-8086-b8e5-c793-839f50eb7b8b';
UPDATE flashcard_sets SET slug = 'cutlery_china_10_basic'       WHERE id = '28c8f4ca-d072-8c4a-fbd2-6f4438cf574b';
UPDATE flashcard_sets SET slug = 'daily_life_20'                WHERE id = '6c14435e-ac23-c1db-78d7-5c5f9e30f9b0';
UPDATE flashcard_sets SET slug = 'time_20'                      WHERE id = '3e698b90-bfda-c9cb-8042-a0616ef85910';
UPDATE flashcard_sets SET slug = 'shopping_money_20'            WHERE id = 'f6af32e3-ed88-ec1e-3004-8736d589cf2e';
UPDATE flashcard_sets SET slug = 'directions_transportation_20' WHERE id = '4375bc23-c8e6-ae1f-0925-70a8eeefed39';
UPDATE flashcard_sets SET slug = 'accommodation_hotels_20'      WHERE id = '10dcdbb5-517c-257e-56e6-258458edcf25';
UPDATE flashcard_sets SET slug = 'travel_essentials'            WHERE id = '75edd4a4-8f3f-b458-de8a-7398a9e0faf5';
UPDATE flashcard_sets SET slug = 'work_business_20'             WHERE id = 'bdb49c90-9690-3598-2a43-4bc811df2ddd';
UPDATE flashcard_sets SET slug = 'dating_social_20'             WHERE id = 'dcf29f3d-3d44-ce90-0f15-9461e79af43e';
UPDATE flashcard_sets SET slug = 'emergencies_health_20'        WHERE id = 'bf91ca3a-1356-273e-fe1f-f837199eb9c9';

-- Sanity check: catch curated UUIDs that drifted between this migration's
-- UPDATE list and reality. Fails the migration if any curated set is left
-- with a NULL slug.
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM flashcard_sets WHERE created_by IS NULL AND slug IS NULL) > 0 THEN
    RAISE EXCEPTION 'curated set without slug after backfill — update migration UPDATE list';
  END IF;
END $$;
