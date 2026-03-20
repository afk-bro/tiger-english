# Database Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the Supabase PostgreSQL schema (tables, RLS policies, indexes) via versioned SQL migration files and generate TypeScript types from the live schema.

**Architecture:** Two SQL migration files under `supabase/migrations/` — one for tables/enums/indexes, one for RLS policies. Applied to the remote Supabase project via `supabase db push`. TypeScript types generated with `supabase gen types typescript` into `src/types/database.types.ts`.

**Tech Stack:** Supabase CLI, PostgreSQL, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-19-database-schema-design.md`

---

## File Map

| File | Action |
|------|--------|
| `src/features/auth/registerUser.ts` | Delete — dead code, superseded by `registerUserAPI.ts` |
| `supabase/config.toml` | Create — via `supabase init` |
| `supabase/migrations/20260319000001_initial_schema.sql` | Create — tables, enum, indexes, moddatetime trigger |
| `supabase/migrations/20260319000002_rls_policies.sql` | Create — enable RLS + all policies |
| `src/types/database.types.ts` | Create (generated) — auto-generated from live schema |

---

## Task 1: Remove Dead Code

**Files:**
- Delete: `src/features/auth/registerUser.ts`

- [ ] **Step 1: Confirm the file is unused**

```bash
grep -r "from.*registerUser'" src/ --include="*.ts" --include="*.tsx"
grep -r 'from.*registerUser"' src/ --include="*.ts" --include="*.tsx"
```

Expected: no results (only `registerUserAPI` is imported by `useRegisterSubmit.ts`).

- [ ] **Step 2: Delete the file**

```bash
git rm src/features/auth/registerUser.ts
```

- [ ] **Step 3: Verify no TypeScript errors**

```bash
cd /home/x/dev/projects/gain-english && npm run type-check
```

Expected: same pre-existing errors as before — no new errors from the deletion.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove dead registerUser.ts (superseded by registerUserAPI)"
```

---

## Task 2: Supabase CLI Setup

**Files:**
- Create: `supabase/config.toml` (via init)

**What this does:** Installs the Supabase CLI as a dev dependency, initialises the `supabase/` project directory, and links it to the remote Supabase project so migrations can be pushed.

- [ ] **Step 1: Install the Supabase CLI**

```bash
cd /home/x/dev/projects/gain-english && npm install supabase --save-dev
```

Expected: `supabase` appears in `devDependencies` in `package.json`.

- [ ] **Step 2: Initialise the Supabase project directory**

```bash
npx supabase init
```

Expected: Creates `supabase/config.toml` and `supabase/migrations/` directory. If prompted to override an existing file, say no.

- [ ] **Step 3: Link to the remote project**

Find your project reference in the Supabase dashboard URL: `https://supabase.com/dashboard/project/<project-ref>`

```bash
npx supabase link --project-ref <your-project-ref>
```

You will be prompted for your **database password** (set when you created the Supabase project — check your Supabase dashboard under Settings → Database if you need to reset it).

Expected: `Finished supabase link.`

- [ ] **Step 4: Commit the init files**

```bash
git add supabase/config.toml supabase/.gitignore
git commit -m "chore: initialise supabase cli project"
```

---

## Task 3: Initial Schema Migration

**Files:**
- Create: `supabase/migrations/20260319000001_initial_schema.sql`

**What this does:** Creates the `card_status` enum, all five tables, the `moddatetime` trigger for `flashcard_sets.updated_at`, and all indexes.

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/20260319000001_initial_schema.sql` with this exact content:

```sql
-- Enable moddatetime extension for auto-updating updated_at columns
create extension if not exists moddatetime schema extensions;

-- Enum: card study status
create type card_status as enum ('unseen', 'known', 'unknown');

-- profiles: mirrors auth.users, created by FastAPI backend on registration
-- (anon/authenticated clients cannot insert — service role only)
create table profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text not null,
  first_name  text not null,
  last_name   text not null,
  username    text not null unique,
  created_at  timestamptz not null default now()
);

-- user_stats: one row per user, created by FastAPI backend on registration
-- user_id is the same UUID as auth.users.id / profiles.id
create table user_stats (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references profiles(id) on delete cascade,
  xp            int not null default 0,
  level         int not null default 1,
  study_streak  int not null default 0,
  last_login    timestamptz,
  created_at    timestamptz not null default now()
);

-- flashcard_sets: curated global sets (created_by IS NULL)
--                and user-created sets (created_by IS NOT NULL)
-- is_public: owner explicitly makes set browsable by all (future feature)
-- share_token: UUID used for private share-by-link (resolved server-side, not via RLS)
create table flashcard_sets (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  created_by   uuid references profiles(id) on delete set null,
  is_public    bool not null default false,
  share_token  uuid unique,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-update updated_at on every UPDATE to flashcard_sets
create trigger handle_flashcard_sets_updated_at
  before update on flashcard_sets
  for each row execute procedure extensions.moddatetime(updated_at);

-- flashcards: cards belonging to a set
-- level must be one of the three values matching the frontend Flashcard type
create table flashcards (
  id                uuid primary key default gen_random_uuid(),
  set_id            uuid not null references flashcard_sets(id) on delete cascade,
  native_word       text not null,
  english_word      text not null,
  part_of_speech    text,
  level             text check (level in ('basic', 'intermediate', 'advanced')),
  example_sentence  text,
  image_url         text,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now()
);

-- user_card_progress: pass/fail state per user per card
-- one row per (user, card) pair — upserted as the user studies
create table user_card_progress (
  user_id        uuid not null references profiles(id) on delete cascade,
  flashcard_id   uuid not null references flashcards(id) on delete cascade,
  status         card_status not null default 'unseen',
  last_studied_at  timestamptz,
  created_at     timestamptz not null default now(),
  primary key (user_id, flashcard_id)
);

-- Indexes
create index on flashcard_sets(created_by);          -- lookup sets by owner
create index on flashcards(set_id, sort_order);      -- ordered cards in a set
create index on user_card_progress(user_id);         -- progress by user
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260319000001_initial_schema.sql
git commit -m "feat: add initial schema migration (tables, enum, indexes)"
```

---

## Task 4: RLS Policies Migration

**Files:**
- Create: `supabase/migrations/20260319000002_rls_policies.sql`

**What this does:** Enables Row Level Security on all five tables and creates access policies for each. The Supabase service role key (used by FastAPI) bypasses RLS entirely — these policies only constrain anon/authenticated browser clients.

Key rules:
- `profiles` + `user_stats`: SELECT only for own row; INSERT/UPDATE by service role only
- `flashcard_sets`: curated (null `created_by`), own, or public sets are readable; write restricted to owner
- `flashcards`: visibility and write access inherited from parent set ownership
- `user_card_progress`: full CRUD for own rows only

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/20260319000002_rls_policies.sql` with this exact content:

```sql
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
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260319000002_rls_policies.sql
git commit -m "feat: add RLS policies migration"
```

---

## Task 5: Apply Migrations and Verify

**What this does:** Pushes both migration files to the remote Supabase project and verifies the schema was created correctly.

- [ ] **Step 1: Push migrations to remote**

```bash
cd /home/x/dev/projects/gain-english && npx supabase db push
```

You will be prompted for your database password again.

Expected output (no errors):
```
Applying migration 20260319000001_initial_schema.sql...ok
Applying migration 20260319000002_rls_policies.sql...ok
```

If an error occurs, read it carefully:
- `extension "moddatetime" does not exist` → the extension name is correct for Supabase-managed projects; if it fails, replace `extensions.moddatetime` with `moddatetime` in the trigger.
- `type "card_status" already exists` → the migration was partially applied; connect via Supabase SQL editor and run `drop type card_status cascade;` then re-push.

- [ ] **Step 2: Verify tables exist in Supabase Studio**

Open your Supabase project → Table Editor. You should see:
- `profiles`
- `user_stats`
- `flashcard_sets`
- `flashcards`
- `user_card_progress`

- [ ] **Step 3: Verify RLS is enabled**

In Supabase Studio → Authentication → Policies. Each of the five tables should show RLS as enabled with the policies listed.

- [ ] **Step 4: Verify the updated_at trigger fires**

In the Supabase SQL editor, run:

```sql
-- Insert a test set (as service role, bypasses RLS)
insert into flashcard_sets (title, created_by)
values ('Test', null)
returning id, created_at, updated_at;

-- Note the id, then update it and check updated_at changes:
update flashcard_sets set title = 'Test Updated' where title = 'Test';
select title, created_at, updated_at from flashcard_sets where title = 'Test Updated';
```

Expected: `updated_at` is later than `created_at`.

Clean up the test row afterwards:
```sql
delete from flashcard_sets where title = 'Test Updated';
```

---

## Task 6: Generate TypeScript Types

**Files:**
- Create: `src/types/database.types.ts`

**What this does:** Generates fully-typed TypeScript interfaces from the live Supabase schema. These types represent the raw database shape (snake_case columns, nullable fields) and can be used directly or aliased to the existing camelCase types in `src/types/`.

- [ ] **Step 1: Generate the types file**

```bash
cd /home/x/dev/projects/gain-english && npx supabase gen types typescript --linked > src/types/database.types.ts
```

- [ ] **Step 2: Verify the output**

```bash
head -60 src/types/database.types.ts
```

Expected: A file starting with `export type Json = ...` followed by a `Database` type with a `public` key containing `Tables` with entries for `flashcard_sets`, `flashcards`, `profiles`, `user_card_progress`, `user_stats`.

Also verify the `card_status` enum is present:
```bash
grep "card_status\|unseen\|known\|unknown" src/types/database.types.ts
```

Expected: the enum values appear in the generated types.

- [ ] **Step 3: Verify no TypeScript errors from the new file**

```bash
npm run type-check
```

Expected: same pre-existing errors as before — no new errors from the generated file.

- [ ] **Step 4: Commit**

```bash
git add src/types/database.types.ts
git commit -m "feat: add generated supabase typescript types"
```

---

## Final Verification

- [ ] `npm run type-check` passes with no new errors
- [ ] All five tables visible in Supabase Studio Table Editor
- [ ] RLS enabled and policies listed for all five tables in Authentication → Policies
- [ ] `src/types/database.types.ts` contains `Database` type with all five tables
- [ ] The app registers a new user successfully end-to-end (FastAPI creates `profiles` + `user_stats` rows using service role, bypassing RLS)
