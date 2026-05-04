-- Reviewer feedback: section_key was free-form TEXT on both
-- lesson_section_progress and exercise_attempts, but downstream logic
-- (lessons_completed counting in get_summary) treats it as a closed
-- enum of five canonical values. An accidental or malicious write of
-- an unexpected key would skew the dashboard or, in the previous
-- relaxed `>= REQUIRED_SECTIONS_PER_UNIT` count, even inflate the
-- completed-units number.
--
-- This migration adds CHECK constraints mirroring the canonical set.
-- The same set lives in:
--   - backend/app/models/progress.py (Pydantic Literal `SectionKey`)
--   - backend/app/services/progress_service.py (REQUIRED_SECTION_KEYS)
--   - src/features/lessons/lesson.types.ts (frontend SectionKey)
-- Adding a new section type is a deliberate four-place change.

ALTER TABLE lesson_section_progress
  ADD CONSTRAINT lesson_section_progress_section_key_check
  CHECK (section_key IN ('overview', 'grammar', 'vocabulary', 'dialogues', 'activities'));

ALTER TABLE exercise_attempts
  ADD CONSTRAINT exercise_attempts_section_key_check
  CHECK (section_key IN ('overview', 'grammar', 'vocabulary', 'dialogues', 'activities'));
