# Flashcard Translations Design

**Date:** 2026-03-23
**Branch:** main (new feature branch at implementation time)
**Status:** Draft

## Overview

Add per-language native translations for flashcard sets so Thai, Chinese, and Vietnamese users all see the same set (e.g. "Fruit") with their own native text. Translations are generated offline via a dev-time script using the Claude API (Haiku), reviewed by a human, then committed as a SQL migration.

## Goals

- Thai, Chinese, Vietnamese users see native text on the front of every card
- User's native language is captured at registration and changeable in settings
- Translation generation is automated, human-reviewed, and idempotent
- `native_audio_url` is stored per-language alongside `native_text`
- Schema is safe to roll out incrementally without a flag day

## Non-Goals

- Real-time / on-demand translation (future option)
- Languages beyond `th`, `zh`, `vi` in this iteration
- Enforcing `profiles.native_language NOT NULL` in this feature (follow-up migration after onboarding coverage is confirmed)

---

## Schema Changes

### New table: `flashcard_translations`

```sql
CREATE TABLE flashcard_translations (
  flashcard_id      uuid NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  language_code     text NOT NULL CHECK (
                      language_code IN ('th', 'zh', 'vi')
                    ),
  native_text       text NOT NULL CHECK (length(trim(native_text)) > 0),
  native_audio_url  text,
  is_reviewed       bool NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (flashcard_id, language_code)
);

CREATE INDEX ON flashcard_translations(language_code);

-- extensions.moddatetime is already enabled in 20260319000001_initial_schema.sql
CREATE TRIGGER handle_flashcard_translations_updated_at
  BEFORE UPDATE ON flashcard_translations
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);

ALTER TABLE flashcard_translations ENABLE ROW LEVEL SECURITY;
```

`language_code` is constrained to the supported set at the DB level. Adding a new language requires a migration (`ALTER TABLE flashcard_translations DROP CONSTRAINT ...; ADD CONSTRAINT ... CHECK (language_code IN ('th', 'zh', 'vi', 'new'))`). This is intentional — it makes unsupported codes impossible to write, even from scripts or direct DB access.

### RLS Policies and Grants

`flashcard_translations` rows are readable under the same conditions as their parent `flashcards` row (set is curated, or is public, or belongs to the authenticated user). Write access is service-role only (same as flashcards).

```sql
-- SELECT: readable if the parent set is curated (created_by IS NULL),
--         public (is_public = true), or owned by the current user
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

-- Grants: anon + authenticated can read; no write grants (service role only)
GRANT SELECT ON flashcard_translations TO anon, authenticated;
```

### `profiles` — add `native_language` (nullable first)

```sql
ALTER TABLE profiles
  ADD COLUMN native_language text
  CHECK (
    native_language IS NULL
    OR native_language IN ('th', 'zh', 'vi')
  );
```

`null` is valid during the transition period. A follow-up migration enforces `NOT NULL` after onboarding guarantees every row has a value. That migration must include a guard:

```sql
DO $$
DECLARE unset_count int;
BEGIN
  SELECT COUNT(*) INTO unset_count FROM profiles WHERE native_language IS NULL;
  IF unset_count > 0 THEN
    RAISE EXCEPTION '% profile(s) still have null native_language — backfill before running this migration', unset_count;
  END IF;
END $$;

-- The nullable CHECK already enforces IN ('th', 'zh', 'vi') for non-null values.
-- SET NOT NULL promotes that to cover all rows.
ALTER TABLE profiles ALTER COLUMN native_language SET NOT NULL;
```

Adding a new supported language requires updating the `CHECK` constraint on `profiles.native_language` in a migration, alongside the constraint on `flashcard_translations.language_code`.

### `flashcards` — column removals

`native_audio_url` is dropped in this migration (no data to migrate — column was added in schema v2 but never populated).

`native_text` is **kept** in this migration. It will be dropped in a follow-up migration after app reads are verified against `flashcard_translations`.

> **Note:** `supabase/migrations/20260319000004_seed_curated_sets.sql` uses the old column name `native_word` in its INSERT statements (predates the v2 rename at `20260321000002`). That file does not need to be changed — it runs before the rename. But if it is ever re-run in isolation it will fail. This is a known pre-existing state documented here for clarity.

```sql
ALTER TABLE flashcards DROP COLUMN native_audio_url;
```

### Migration order (single migration file)

1. Create `flashcard_translations` table + index + trigger + RLS + grants
2. Drop `flashcards.native_audio_url`
3. Add `profiles.native_language` (nullable)
4. Backfill existing curated sets — explicit set→language mapping, fail if unexpected curated set found:

```sql
-- These UUIDs are fixed constants defined in 20260319000004_seed_curated_sets.sql.
-- They are stable by design and this migration depends on them semantically.
-- If new curated sets are added before this migration runs, update both files.
DO $$
DECLARE unexpected_count int;
BEGIN
  SELECT COUNT(*) INTO unexpected_count
  FROM flashcard_sets
  WHERE created_by IS NULL
    AND id NOT IN (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002'
    );
  IF unexpected_count > 0 THEN
    RAISE EXCEPTION 'Unexpected curated sets found — update migration before proceeding';
  END IF;
END $$;

INSERT INTO flashcard_translations (flashcard_id, language_code, native_text, is_reviewed)
SELECT
  f.id,
  CASE s.id
    WHEN '00000000-0000-0000-0000-000000000001' THEN 'th'
    WHEN '00000000-0000-0000-0000-000000000002' THEN 'zh'
  END,
  f.native_text,
  true  -- human-authored, already reviewed
FROM flashcards f
JOIN flashcard_sets s ON s.id = f.set_id
WHERE s.created_by IS NULL
  AND s.id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002'
  )
ON CONFLICT (flashcard_id, language_code) DO NOTHING;
```

---

## Translation Generation Workflow

### Step 1 — Generate translations (`scripts/generate-translations.ts`)

Reads all flashcards that have no `flashcard_translations` row for a target language. Calls the Claude API (Haiku) using `ANTHROPIC_API_KEY`. The developer must have a valid Anthropic API key set in their environment — `ANTHROPIC_CODE_OAUTH_TOKEN` is a Claude Code OAuth credential and is not accepted by the Anthropic SDK's `apiKey` parameter.

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // must be set in dev environment
});
```

Prompt (per language, per batch):
```
Translate the following English words/phrases to Thai.
Return ONLY a JSON array with this exact shape:
[{ "id": "<flashcard_id>", "native_text": "<translation>" }, ...]
If you are not confident about a translation, prefix native_text with "?".
Do not add explanations, romanisation, or alternatives.

Cards:
[{ "id": "...", "english_text": "Apple", "category": "fruit" }, ...]
```

Output: `src/data/translations/<language_code>_review.csv`

```
flashcard_id,english_text,category,native_text,flagged
<uuid>,Apple,fruit,แอปเปิ้ล,false
<uuid>,Dragon fruit,fruit,แก้วมังกร,false
<uuid>,Guava,fruit,ฝรั่ง,true
```

`flagged=true` rows (where Claude prefixed with "?") are sorted to the top. A human edits `native_text` and clears the flag before the next step.

### Step 2 — Generate migration (`scripts/generate-translations-migration.ts`)

Reads reviewed CSVs. Fails if any row still has `flagged=true`. Emits:

`supabase/migrations/<timestamp>_translations_<lang>.sql`

```sql
INSERT INTO flashcard_translations (flashcard_id, language_code, native_text, is_reviewed)
VALUES (...)
ON CONFLICT (flashcard_id, language_code) DO UPDATE
  SET native_text   = EXCLUDED.native_text,
      is_reviewed   = true,
      updated_at    = now();
```

`DO UPDATE` (not `DO NOTHING`) so re-running after editing the review CSV updates the stored translation.

---

## Backend Changes

### Supported languages — centralised constant

```python
# backend/app/core/languages.py
SUPPORTED_LANGUAGES = {'th', 'zh', 'vi'}

def validate_native_language(value: str | None) -> str | None:
    if value is None:
        return None
    if value not in SUPPORTED_LANGUAGES:
        raise ValueError(f"Unsupported language code: {value!r}")
    return value
```

Called from both the registration handler and `PATCH /profile`. Adding a new language requires updating this constant (and the DB CHECK constraints in a migration).

### `POST /auth/register` — include `native_language`

`native_language` is validated then written to the `profiles` row immediately after `admin.create_user` returns via an explicit `UPDATE profiles SET native_language = :value WHERE id = :user_id`. The database trigger creates the `profiles` row; FastAPI updates it in the same request. If the user submits without selecting a language, `native_language` is omitted — stored as `null`. It is never silently defaulted by the backend.

### `PATCH /profile` — update `native_language`

New endpoint. Validates `native_language` against `SUPPORTED_LANGUAGES` before writing. Returns 400 for unknown codes. On success, returns the updated profile.

### `PATCH /profile` — authentication

The endpoint validates the caller's Supabase JWT (passed as `Authorization: Bearer <token>`). The user ID is extracted from the verified token — it is never accepted from the request body. This prevents any caller from modifying another user's profile.

### Card queries — frontend Supabase client (not FastAPI)

Card fetching uses the Supabase JS client directly from the frontend (existing pattern — there is no FastAPI endpoint for cards). The query is updated to embed `flashcard_translations` as a related resource, filtered by `language_code`:

```typescript
const { data, error } = await supabase
  .from('flashcards')
  .select(`
    id, set_id, english_text, part_of_speech, level, category,
    example_sentence, english_audio_url, image_url,
    notes, is_phrase, sort_order,
    flashcard_translations(native_text, native_audio_url)
  `)
  .eq('set_id', setId)
  .eq('flashcard_translations.language_code', languageCode)
  .order('sort_order', { ascending: true });
```

`flashcard_translations` is returned as an array (PostgREST embedded resource). The mapper extracts `[0]` — at most one row per `(flashcard_id, language_code)` pair by PK constraint. `native_text` and `native_audio_url` are `null` when no translation exists.

---

## Frontend Changes

### `FlashcardCard` type

`nativeText: string | null`, `nativeAudioUrl: string | null` — both null when no translation exists for the user's language.

The `mapCard` function and `CardRow` type require a full rewrite: `native_text` is no longer selected directly from `flashcards`; instead `flashcard_translations` is returned as an embedded array. The mapper extracts `row.flashcard_translations?.[0]?.native_text ?? null`.

```typescript
type CardRow = {
  // ... existing fields minus native_text, native_audio_url ...
  flashcard_translations: { native_text: string; native_audio_url: string | null }[];
}

export function mapCard(row: CardRow): FlashcardCard {
  const translation = row.flashcard_translations[0] ?? null;
  return {
    // ... existing fields ...
    nativeText: translation?.native_text ?? null,
    nativeAudioUrl: translation?.native_audio_url ?? null,
  };
}
```

### `useFlashcards(setId, languageCode)` — guarded fetch

Fetches only when **both** `setId` and `languageCode` are non-null. Avoids a race where cards load before language is resolved.

### Language resolution (client, read-only — nothing silently persisted)

1. `profile.native_language` from Zustand — authoritative once set
2. If null (transition period): onboarding-selected value held in local component state
3. If neither: language selector shown, card fetch blocked until user selects

### Registration — language selector

- Browser locale read from `navigator.language` and normalised (e.g. `"th-TH"` → `"th"`)
- If locale matches `SUPPORTED_LANGUAGES`: selector pre-filled with that language
- If locale unmatched: selector shown empty with placeholder "Choose your native language" — no default applied, no language silently assigned
- Submitted alongside other registration fields; FastAPI writes it as described above

### Settings — immediate effect on language change

After successful `PATCH /profile`:
```typescript
useUserStore.getState().setNativeLanguage(newCode);
// next useFlashcards call picks up new languageCode — no reload needed
```

### `Flashcard.tsx` — untranslated card state

When `nativeText` is null, the front of the card shows a placeholder ("Translation coming soon") rather than `englishText`. The `aria-label` must also null-guard `nativeText` to avoid rendering the string `"null"` for screen readers. Showing `englishText` on the native-language side would invert the learning direction — the learner would see what they already know, not what they are being tested on. Sets with incomplete translations are still openable, but untranslated cards are visually distinct and non-interactive.

### i18n locale files

Language selector labels and placeholder text ("Choose your native language", language names) are added to `src/locales/en/en.json` and `src/locales/th/th.json`.

---

## Files Created / Modified

| Path | Change |
|---|---|
| `supabase/migrations/<ts>_flashcard_translations.sql` | New — schema + RLS + grants + backfill |
| `supabase/migrations/<ts>_translations_th.sql` | Generated — Thai translations |
| `supabase/migrations/<ts>_translations_zh.sql` | Generated — Chinese translations |
| `supabase/migrations/<ts>_translations_vi.sql` | Generated — Vietnamese translations |
| `scripts/generate-translations.ts` | New — calls Claude API, writes review CSVs |
| `scripts/generate-translations-migration.ts` | New — reads reviewed CSVs, emits SQL |
| `src/data/translations/th_review.csv` | Generated, human-reviewed, committed |
| `src/data/translations/zh_review.csv` | Generated, human-reviewed, committed |
| `src/data/translations/vi_review.csv` | Generated, human-reviewed, committed |
| `backend/app/core/languages.py` | New — `SUPPORTED_LANGUAGES` + validator |
| `backend/app/models/auth.py` | Add `native_language` to `UserRegister` + new `UpdateProfile` model |
| `backend/app/api/v1/auth.py` | Add `PATCH /profile` endpoint |
| `backend/app/services/auth_service.py` | Update `register_user` to write `native_language` after profile creation |
| `src/features/flashcards/api/flashcards.ts` | Embed `flashcard_translations` in card query, accept `languageCode` param |
| `src/features/flashcards/hooks/useFlashcards.ts` | Accept + guard `languageCode` param |
| `src/features/flashcards/types.ts` | `nativeText: string \| null`, add `nativeAudioUrl: string \| null` |
| `src/stores/useUserStore.ts` | Add `native_language` to profile type, add `setNativeLanguage` action |
| `src/pages/Register.tsx` | Language selector UI |
| `src/pages/Settings.tsx` | Language change UI (new page or section) |
| `src/components/flashcards/Flashcard.tsx` | Handle null `nativeText` with placeholder state |
| `src/locales/en/en.json` | Language selector strings |
| `src/locales/th/th.json` | Language selector strings |
