# Seed Migration Design — CSV Sets

**Date:** 2026-03-22
**Branch:** feat/flashcard-schema-v2
**Status:** Approved

## Overview

Generate a Supabase SQL migration from CSV flashcard sets. Each CSV file maps to one `flashcard_set` row and N `flashcard` rows. The migration is committed alongside a generator script and a metadata file.

## Files

| Path | Purpose |
|---|---|
| `src/data/seed/sets/meta.ts` | Product metadata: title, description, is_public, sort_order keyed by filename |
| `scripts/generate-seed-migration.ts` | Dev-time generator — reads CSVs + meta, emits SQL |
| `supabase/migrations/20260322000001_seed_csv_sets.sql` | Generated output — committed, runs via `supabase db push` |
| `src/data/seed/sets/*.csv` | Source data — unchanged |

## Metadata File (`meta.ts`)

```ts
export const SET_META: Record<string, {
  title: string;
  description: string;
  is_public?: boolean;   // defaults to true
  sort_order: number;
}> = {
  "fruit_20_basic.csv": {
    title: "Fruit",
    description: "Common fruits for everyday vocabulary",
    sort_order: 1,
  },
  // ... one entry per CSV
};
```

The filename is the stable source key. The generator skips any CSV not present in `SET_META`.

## Generator (`generate-seed-migration.ts`)

Runs with `npx tsx scripts/generate-seed-migration.ts`.

### Steps

1. Import `SET_META`, sort entries by `sort_order`
2. For each entry:
   - Read CSV from `src/data/seed/sets/<filename>`
   - Detect format (v2 standard vs legacy `travel_essentials` format)
   - Parse and normalize each row (see Normalization)
   - Compute UUIDs (see UUID Scheme)
   - Emit SQL blocks
3. Write output to `supabase/migrations/20260322000001_seed_csv_sets.sql`

### CSV Formats

**Standard (v2):** `native_text, english_text, category, part_of_speech, level, example_sentence, english_audio_url, native_audio_url, image_url, sort_order`

**Legacy (`travel_essentials.csv`):** `English Phrase, Category` — mapped as:
- `english_text` ← `English Phrase`
- `category` ← `Category`
- All other fields → `null`

### Normalization

Applied to every row before UUID computation and SQL emission:

- `category`: lowercase, trim whitespace
- All text fields: curly/smart quotes (`'` `'` `"` `"`) → straight equivalents (`'` `"`)
- All text fields: trim leading/trailing whitespace
- Empty strings → `null`

### UUID Scheme

Both UUIDs are derived by taking the first 32 hex characters of a SHA-256 hash and formatting as a standard UUID (8-4-4-4-12):

```
set_id  = sha256(filename)
card_id = sha256(filename + ':' + english_text + ':' + category + ':' + sort_order)
```

Stable across regeneration as long as filename and card content don't change.

## SQL Output Structure

```sql
-- === <Title> (<filename>) ===

INSERT INTO flashcard_sets (id, title, description, is_public, created_by)
VALUES ('<set_uuid>', '<title>', '<description>', <is_public>, null)
ON CONFLICT (id) DO NOTHING;

INSERT INTO flashcards (
  id, set_id, native_text, english_text, category,
  part_of_speech, level, example_sentence,
  english_audio_url, native_audio_url, image_url, sort_order
) VALUES
  ('<card_uuid>', '<set_uuid>', <native_text>, '<english_text>', <category>, ...),
  ...
ON CONFLICT (id) DO NOTHING;
```

`created_by IS NULL` marks these as curated/system sets, consistent with the existing seed.

## Idempotency

Both inserts use `ON CONFLICT (id) DO NOTHING`. Running the migration multiple times (e.g., after `supabase db reset`) is safe.

## Running

```bash
# Generate the SQL (dev only — output is committed)
npx tsx scripts/generate-seed-migration.ts

# Apply to local Supabase
supabase db push
# or
supabase db reset
```
