# Database Schema — Design Spec

**Date:** 2026-03-19
**Scope:** Define Supabase PostgreSQL schema, RLS policies, and TypeScript type generation for the gain-english platform. Implemented via Supabase CLI SQL migration files.

---

## Problem

The app has a new Supabase project with no tables. The frontend already has TypeScript types (`UserProfile`, `Flashcard`, `StudyStats`) that need a backing database schema. The backend (`FastAPI`) creates users and profiles on registration — those tables must exist.

---

## Solution

Supabase CLI migration files (`supabase/migrations/*.sql`) define all tables, enums, indexes, and RLS policies in version-controlled SQL. TypeScript types are auto-generated from the live schema via `supabase gen types typescript`.

---

## Prerequisites

**`src/features/auth/registerUser.ts` must be deleted before this migration is applied.** This file inserts into `profiles` directly from the browser using the anon key — it is already dead code (the active path is `registerUserAPI.ts` via `useRegisterSubmit.ts`). The RLS policy for `profiles` INSERT is service-role-only (FastAPI backend). Leaving this file in the codebase risks it being accidentally re-imported. Delete it unconditionally.

---

## Schema

### Enums

```sql
create type card_status as enum ('unseen', 'known', 'unknown');
```

### `profiles`

Mirrors `auth.users` — created by the FastAPI backend on registration using the service role key.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | FK → `auth.users(id)` ON DELETE CASCADE |
| `email` | `text` NOT NULL | |
| `first_name` | `text` NOT NULL | |
| `last_name` | `text` NOT NULL | |
| `username` | `text` NOT NULL UNIQUE | |
| `created_at` | `timestamptz` | default `now()` |

### `user_stats`

One row per user. Created alongside `profiles` on registration. `user_id` is the same UUID as `auth.users.id` / `profiles.id` — these are the same value, not separate concepts.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | default `gen_random_uuid()` |
| `user_id` | `uuid` NOT NULL UNIQUE | FK → `profiles(id)` ON DELETE CASCADE |
| `xp` | `int` | default `0` |
| `level` | `int` | default `1` |
| `study_streak` | `int` | default `0` |
| `last_login` | `timestamptz` | nullable |
| `created_at` | `timestamptz` | default `now()` |

### `flashcard_sets`

Holds both curated (admin) and user-created sets. `created_by IS NULL` = curated/global; `created_by IS NOT NULL` = user-created.

`updated_at` requires a `before update` trigger (e.g., Supabase `moddatetime` extension) to update automatically — see migration notes.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | default `gen_random_uuid()` |
| `title` | `text` NOT NULL | |
| `description` | `text` | nullable |
| `created_by` | `uuid` | nullable FK → `profiles(id)` ON DELETE SET NULL |
| `is_public` | `bool` | default `false` |
| `share_token` | `uuid` UNIQUE | nullable — generated on share. The `UNIQUE` constraint serves as the lookup index; no additional index needed. |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` — requires trigger to auto-update |

### `flashcards`

Cards belonging to a set. `level` values must match the frontend enum: `'basic'`, `'intermediate'`, `'advanced'`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | default `gen_random_uuid()` |
| `set_id` | `uuid` NOT NULL | FK → `flashcard_sets(id)` ON DELETE CASCADE |
| `native_word` | `text` NOT NULL | |
| `english_word` | `text` NOT NULL | |
| `part_of_speech` | `text` | nullable |
| `level` | `text` | nullable — values: `'basic'`, `'intermediate'`, `'advanced'` |
| `example_sentence` | `text` | nullable |
| `image_url` | `text` | nullable |
| `sort_order` | `int` | default `0` |
| `created_at` | `timestamptz` | default `now()` |

### `user_card_progress`

Tracks pass/fail state per user per card. One row per (user, card) pair.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | `uuid` NOT NULL | FK → `profiles(id)` ON DELETE CASCADE |
| `flashcard_id` | `uuid` NOT NULL | FK → `flashcards(id)` ON DELETE CASCADE |
| `status` | `card_status` | default `'unseen'` |
| `last_studied_at` | `timestamptz` | nullable |
| `created_at` | `timestamptz` | default `now()` |
| PRIMARY KEY | `(user_id, flashcard_id)` | |

---

## Indexes

```sql
-- Fast lookup of sets owned by a user
create index on flashcard_sets(created_by);

-- Fast lookup of cards in a set (in order)
create index on flashcards(set_id, sort_order);

-- Fast lookup of progress for a user
create index on user_card_progress(user_id);
```

---

## RLS Policies

Enable RLS on all tables. The Supabase service role key (used by FastAPI) bypasses RLS — these policies apply only to anon/authenticated browser clients.

### `profiles`
- **SELECT**: `id = auth.uid()` (users read own profile only)
- **INSERT**: service role only (no policy — anon/authenticated inserts are blocked)
- **UPDATE**: service role only — users cannot self-update profiles from the frontend. If self-editing (display name, username) is added later, this policy must be revisited.

### `user_stats`
- **SELECT**: `user_id = auth.uid()`
- **UPDATE**: service role only — all stat updates go through FastAPI. PostgreSQL RLS cannot restrict which columns are written (column-level privileges are a separate mechanism not surfaced in Supabase). Routing all writes through the backend is the only reliable way to prevent client-side `xp`/`level` manipulation.
- **INSERT**: service role only

### `flashcard_sets`
- **SELECT**: `created_by IS NULL` (curated) OR `created_by = auth.uid()` OR `is_public = true`
- **INSERT**: authenticated users, with `WITH CHECK (created_by = auth.uid())` — prevents spoofing another user's ownership
- **UPDATE**: `USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid())` — prevents re-assigning ownership to another user
- **DELETE**: `created_by = auth.uid()`

### `flashcards`

Cards inherit visibility from their parent set. The SELECT policy uses a subquery:

```sql
create policy "flashcards_select" on flashcards
  for select using (
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
```

```sql
create policy "flashcards_insert" on flashcards
  for insert with check (
    exists (
      select 1 from flashcard_sets
      where flashcard_sets.id = set_id
        and flashcard_sets.created_by = auth.uid()
    )
  );

create policy "flashcards_update" on flashcards
  for update using (
    exists (
      select 1 from flashcard_sets
      where flashcard_sets.id = flashcards.set_id
        and flashcard_sets.created_by = auth.uid()
    )
  ) with check (
    exists (
      select 1 from flashcard_sets
      where flashcard_sets.id = set_id
        and flashcard_sets.created_by = auth.uid()
    )
  );

create policy "flashcards_delete" on flashcards
  for delete using (
    exists (
      select 1 from flashcard_sets
      where flashcard_sets.id = flashcards.set_id
        and flashcard_sets.created_by = auth.uid()
    )
  );
```

### `user_card_progress`
- **SELECT/INSERT/UPDATE/DELETE**: `user_id = auth.uid()`

---

## Share Token Flow

RLS cannot validate a share token without complex session-variable plumbing — keep RLS simple. Private share-link access is handled entirely server-side:

1. User requests a share link → FastAPI generates `gen_random_uuid()`, stores it in `share_token`. `is_public` remains `false`.
2. Share URL: `/sets/[share_token]`
3. Browser hits `GET /api/v1/sets/share/:token` — FastAPI looks up the set by `share_token` using the service role key (bypasses RLS), returns the set + cards if found.
4. Revoke sharing: set `share_token = null`. The endpoint returns 404.

**RLS SELECT rule stays as-is** (`created_by IS NULL OR created_by = auth.uid() OR is_public = true`) — no token logic in RLS.

`is_public` is reserved for sets the owner explicitly makes discoverable to all users (e.g., a future "browse public sets" feature). Share-by-link does not set `is_public = true`.

---

## TypeScript Types

Generated via:
```bash
supabase gen types typescript --linked > src/types/database.types.ts
```

The existing hand-written types (`src/types/user.ts`, `src/types/flashcard.ts`) remain for now and can be gradually replaced or aliased to the generated types.

---

## Out of Scope

- Spaced repetition (SRS intervals, ease factors, due dates) — deferred
- Social features (following users, liking sets) — deferred
- Flashcard set forking/copying — deferred
- Admin tooling for curated content management — deferred
- Self-service profile editing from the frontend — deferred
