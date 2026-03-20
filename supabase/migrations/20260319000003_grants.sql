-- supabase/migrations/20260319000003_grants.sql
-- Allow anon and authenticated roles to read public flashcard data.
-- RLS policies still enforce row-level visibility; these grants only permit role access.

grant select on flashcard_sets       to anon, authenticated;
grant select on flashcards           to anon, authenticated;
grant select on user_card_progress   to authenticated;
grant insert, update, delete
  on user_card_progress              to authenticated;
grant select on profiles             to authenticated;
grant select on user_stats           to authenticated;
grant insert on flashcard_sets       to authenticated;
grant update, delete on flashcard_sets to authenticated;
grant insert, update, delete on flashcards to authenticated;
