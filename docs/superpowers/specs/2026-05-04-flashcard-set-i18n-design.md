# Flashcard set i18n — design

**Status:** approved (spec under review)
**Author:** afk-bro
**Last updated:** 2026-05-04

## Problem

On `/flashcards`, set titles and descriptions render the raw English values from the `flashcard_sets.title` / `.description` columns regardless of the user's `native_language`. A Vietnamese learner sees "Greetings & Small Talk" instead of "Lời chào & Trò chuyện hàng ngày." Per-card translations work (via the `flashcard_translations` table joined at fetch time), but the set-level metadata rendered by `FlashcardSetList` never had a translation path.

## Goals

1. Curated set titles and descriptions translate with the active i18n language for the four supported locales: `en`, `vi`, `th`, `zh-CN`.
2. Adding a new curated set in the future is a three-place change (seed CSV, migration UPDATE for the slug, locale files) — explicit, not magic.
3. User-created sets (`created_by IS NOT NULL`) keep rendering the user's typed title untouched.
4. Missing i18n keys never leak as raw key strings to the UI; they fall back to the DB column.

## Non-goals

- Re-translating per-card content (already covered by `flashcard_translations`).
- Translating user-created set titles.
- Regenerating `src/lib/database.types.ts` from the live schema (separate deferred-Minor cleanup).
- A backend service for managing translations — locales live in the repo.

## Approach

Two coordinated changes: a nullable `slug` column on `flashcard_sets`, and i18n keys in the `src/locales/` files keyed by that slug.

**Why slug + i18n keys instead of a `flashcard_set_translations` table:** set metadata is short, ~17 rows, changes rarely, and translation prose reviews better in a markdown/JSON PR diff than inside a SQL `INSERT`. The card-translation table is justified by data volume (hundreds of cards per set); set metadata is closer to UI strings.

## Architecture

### Schema change

```sql
ALTER TABLE flashcard_sets ADD COLUMN slug TEXT;

CREATE UNIQUE INDEX flashcard_sets_slug_unique
  ON flashcard_sets (slug) WHERE slug IS NOT NULL;

-- Backfill: 17 UPDATEs, one per curated UUID, slugs from the CSV filenames
-- recorded in the seed-migration comments (greetings_small_talk.csv → "greetings_small_talk").
UPDATE flashcard_sets SET slug = 'greetings_small_talk'
  WHERE id = 'c5543caa-e6bc-b529-1c87-f8fb105ca57d';
-- … (one row per curated UUID)
```

The unique index is partial on `slug IS NOT NULL` — not on `created_by IS NULL`. Two reasons: (1) it directly enforces the actual constraint (no two curated sets share a slug), and (2) it leaves user-created sets free to have `slug = NULL` without colliding with each other on the index.

### Frontend rendering

A small helper centralizes the t()-vs-fallback logic:

```tsx
// src/features/flashcards/hooks/useSetCopy.ts
import { useTranslation } from 'react-i18next';
import type { FlashcardSet } from '../types';

export function useSetCopy(set: FlashcardSet) {
  const { t } = useTranslation();
  if (!set.slug) {
    return {
      title: set.title,
      description: set.description ?? '',
    };
  }
  return {
    title: t(`flashcards.sets.${set.slug}.title`, { defaultValue: set.title }),
    description: t(`flashcards.sets.${set.slug}.description`, {
      defaultValue: set.description ?? '',
    }),
  };
}
```

The `defaultValue` argument means when a slug exists but a locale lookup misses (e.g. zh-CN hasn't been written yet, OR the slug is new and the locale file wasn't updated), i18next returns the DB raw column instead of the key string. No i18n misses can leak as `flashcards.sets.foo.title` text in the UI.

`FlashcardSetList` calls `useSetCopy(set)` per row and renders `{title}` / `{description}` from there. The component otherwise stays as-is.

### Locale-file shape

Under the existing `flashcards.sets` block in each of `src/locales/{en,vi,th,zh-CN}/<lang>.json`:

```json
"sets": {
  "heading": "...existing UI label, unchanged...",
  "create": "...existing...",
  "empty": "...existing...",
  "card_singular": "...existing...",
  "card_plural": "...existing...",
  "greetings_small_talk": {
    "title": "Greetings & Small Talk",
    "description": "Everyday greetings, introductions, and casual conversation phrases"
  }
  // ... one block per slug, 17 total
}
```

The new per-slug subkeys live alongside the existing string keys. Nothing iterates `flashcards.sets.*` today (confirmed by grep), so adding nested objects under that prefix doesn't break any caller.

## Data flow

```
flashcard_sets row (DB)
    ↓ getVisibleSets()
mapSet(row) → FlashcardSet { id, title, description, slug, ... }
    ↓ FlashcardSetList renders each set
useSetCopy(set):
  if !set.slug → use raw title/description
  else → t(`...${slug}.title`, { defaultValue: set.title })
    ↓
JSX: <h3>{title}</h3> <p>{description}</p>
```

`getVisibleSets` already uses `select('*, flashcards(count)')` so no SQL change is needed past the migration. `mapSet` adds one line to copy `slug` from the row.

## TypeScript / type changes

- `src/features/flashcards/types.ts` — `FlashcardSet` gains `slug: string | null`.
- `src/lib/database.types.ts` — `flashcard_sets.Row` and `.Insert` get `slug: string | null`. This file is hand-edited per the existing pattern; the deferred-Minor "regenerate from live schema" item still applies separately.
- `mapSet()` in `src/features/flashcards/api/flashcards.ts` — read `slug` from the row.

## Error handling and edge cases

| Case | Behavior |
|---|---|
| `slug = NULL` (user-created set) | Render raw `title` and `description ?? ''` — no t() call |
| `slug` present, locale key exists | Render translated string |
| `slug` present, locale key missing in user's lang but present in `en` | i18next's `fallbackLng: 'en'` returns the English value (existing behavior) |
| `slug` present, locale key missing entirely (e.g., new slug not yet keyed) | `defaultValue` kicks in — render the DB raw `title`/`description` instead of the key path |
| `description` column is NULL on the DB row | Render `''` (existing component already conditionally hides empty descriptions) |
| Two curated sets accidentally given the same slug | Unique index rejects the migration `UPDATE`; caught at deploy time, not runtime |

## Testing

- **Unit test**: `useSetCopy` covers the four branches (no slug; slug + key present; slug + key missing → fallback to DB; description null → `''`).
- **Existing tests**: `FlashcardSetList.test.tsx` (and any flashcards-page tests) likely assert raw English strings. Update where they're loading sets without slugs (still works as fallback) or update the mock `set` fixtures with slugs and add an i18n test wrapper.
- **Repo grep gate**: per the project's "Run full test suite for data rewrites" rule, before declaring done: grep `src/` and tests for any of the 17 literal English titles/descriptions. Anything that hardcodes them needs updating.

## Migration safety

Single migration `supabase/migrations/20260504000003_flashcard_set_slugs.sql`:

1. `ALTER TABLE … ADD COLUMN slug TEXT;` — additive, safe on a populated table.
2. `CREATE UNIQUE INDEX … WHERE slug IS NOT NULL;` — applies only after the column exists, succeeds against currently-empty slug values.
3. 17 `UPDATE flashcard_sets SET slug = '<slug>' WHERE id = '<uuid>'` statements — each idempotent, scoped by stable curated UUIDs from `20260319000004_seed_curated_sets.sql` and `20260322000001_seed_csv_sets.sql`.
4. Optional sanity check at end: `DO $$ BEGIN IF (SELECT COUNT(*) FROM flashcard_sets WHERE created_by IS NULL AND slug IS NULL) > 0 THEN RAISE EXCEPTION 'curated set without slug after backfill'; END IF; END $$;` to catch any curated UUIDs that drift between this migration's UPDATE list and reality.

## Out of scope (explicit)

- New curated sets added after this PR are a three-place change: (a) the seed CSV pipeline that would generate a new `INSERT`, (b) a new migration with the slug `UPDATE`, (c) locale files for all 4 languages. Add a brief note to `CLAUDE.md` (next to the Lesson images section, which already documents an analogous content-pipeline discipline) so future sessions don't miss step (c).
- The hand-edited `database.types.ts` regeneration story stays as the existing deferred-Minor note.

## Acceptance criteria

- [ ] Logging in as a `vi` user, every curated set on `/flashcards` shows a Vietnamese title and description.
- [ ] Same for `th` and `zh-CN`.
- [ ] User-created sets render their original (English-or-otherwise) title unchanged.
- [ ] If a locale file is missing a slug key, the UI shows the DB raw English string instead of the key path (e.g., a Korean future locale that hasn't been filled in still renders `"Greetings & Small Talk"`, not `"flashcards.sets.greetings_small_talk.title"`).
- [ ] Migration applies cleanly to the hosted DB; the partial unique index allows multiple `slug = NULL` rows for user-created sets.
- [ ] `npm test` and `pytest` green.
