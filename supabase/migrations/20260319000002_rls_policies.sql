-- Enable Row Level Security on all tables
alter table profiles            enable row level security;
alter table user_stats          enable row level security;
alter table flashcard_sets      enable row level security;
alter table flashcards          enable row level security;
alter table user_card_progress  enable row level security;

-- ============================================================
-- profiles
-- INSERT/UPDATE: service role only (no policy = blocked for all other roles)
-- ============================================================
create policy "profiles_select"
  on profiles for select
  using (id = auth.uid());

-- ============================================================
-- user_stats
-- INSERT/UPDATE: service role only (all stat writes go through FastAPI)
-- Reasoning: PostgreSQL RLS cannot restrict which columns are written,
--            so all writes are routed through the backend to prevent
--            client-side xp/level manipulation.
-- ============================================================
create policy "user_stats_select"
  on user_stats for select
  using (user_id = auth.uid());

-- ============================================================
-- flashcard_sets
-- ============================================================
create policy "flashcard_sets_select"
  on flashcard_sets for select
  using (
    created_by is null        -- curated/global sets
    or created_by = auth.uid() -- own sets
    or is_public = true        -- explicitly published sets
    -- Note: private share-by-link access is handled by FastAPI endpoint,
    --       not by RLS. See spec share token flow section.
  );

create policy "flashcard_sets_insert"
  on flashcard_sets for insert
  with check (created_by = auth.uid());

create policy "flashcard_sets_update"
  on flashcard_sets for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());  -- prevents re-assigning ownership

create policy "flashcard_sets_delete"
  on flashcard_sets for delete
  using (created_by = auth.uid());

-- ============================================================
-- flashcards
-- Visibility inherited from parent set: a card is readable
-- if its set is curated, owned by the user, or public.
-- ============================================================
create policy "flashcards_select"
  on flashcards for select
  using (
    exists (
      select 1 from flashcard_sets
      where flashcard_sets.id = flashcards.set_id
        and (
          flashcard_sets.created_by is null
          or flashcard_sets.created_by = auth.uid()
          or flashcard_sets.is_public = true
        )
    )
  );

create policy "flashcards_insert"
  on flashcards for insert
  with check (
    exists (
      select 1 from flashcard_sets
      where flashcard_sets.id = set_id
        and flashcard_sets.created_by = auth.uid()
    )
  );

create policy "flashcards_update"
  on flashcards for update
  using (
    exists (
      select 1 from flashcard_sets
      where flashcard_sets.id = flashcards.set_id
        and flashcard_sets.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from flashcard_sets
      where flashcard_sets.id = set_id
        and flashcard_sets.created_by = auth.uid()
    )
  );

create policy "flashcards_delete"
  on flashcards for delete
  using (
    exists (
      select 1 from flashcard_sets
      where flashcard_sets.id = flashcards.set_id
        and flashcard_sets.created_by = auth.uid()
    )
  );

-- ============================================================
-- user_card_progress
-- Full CRUD restricted to own rows
-- ============================================================
create policy "user_card_progress_select"
  on user_card_progress for select
  using (user_id = auth.uid());

create policy "user_card_progress_insert"
  on user_card_progress for insert
  with check (user_id = auth.uid());

create policy "user_card_progress_update"
  on user_card_progress for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "user_card_progress_delete"
  on user_card_progress for delete
  using (user_id = auth.uid());
