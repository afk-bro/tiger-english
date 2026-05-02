-- supabase/migrations/20260502000001_drop_english_essentials_curated_sets.sql
-- Drop the two language-locked "English Essentials" curated sets seeded in
-- 20260319000004_seed_curated_sets.sql. They surfaced in the set list for
-- learners whose native language did not match the set (e.g. a Vietnamese
-- learner saw the Thai and Chinese variants but had no Vietnamese variant
-- to pick), and the curated cards skewed toward advanced vocabulary that
-- isn't actually "essential" for beginners.
--
-- flashcards.set_id and flashcard_translations.flashcard_id both cascade on
-- delete, so removing the two parent rows also removes their 18 cards and
-- the backfilled th/zh translation rows.

DELETE FROM flashcard_sets
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',  -- English Essentials (Thai)
  '00000000-0000-0000-0000-000000000002'   -- English Essentials (Chinese)
);
