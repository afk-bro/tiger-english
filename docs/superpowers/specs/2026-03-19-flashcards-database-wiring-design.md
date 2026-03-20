# Flashcards Database Wiring — Design Spec

**Date:** 2026-03-19
**Branch:** feat/database-schema
**Status:** Approved

---

## Product Context

Gain English is for Thai and Chinese students learning English.

**Core rule:**
- `english_word` = the learning target (always English)
- `native_word` = support layer (Thai or Chinese gloss)

The UI must visually reinforce English as primary. Native word is a hint/support, not the focus.

---

## Goals

1. Replace all mock flashcard data with real Supabase queries
2. Add a set picker — users choose a set before studying
3. Seed two curated global sets (Thai + Chinese support)
4. Save known/unknown progress for authenticated users; guests browse without saving
5. Logged-in users can create their own sets (title + description)

---

## Architecture

### Feature folder

```
src/features/flashcards/
├── api/
│   └── flashcards.ts          — typed Supabase queries + row→domain mapping
├── hooks/
│   ├── useFlashcardSets.ts    — fetch visible sets; create set mutation
│   ├── useFlashcards.ts       — fetch cards for a given setId
│   └── useCardProgress.ts     — fetch progress by cardIds; markKnown/markUnknown
├── components/
│   ├── FlashcardSetList.tsx   — set grid + "Create set" button (auth'd only)
│   ├── CreateSetModal.tsx     — create set form (title + description)
│   └── FlashcardViewer.tsx    — pure presentation: delegates index to useFlashcardNavigation, flip to Flashcard
└── types.ts                   — domain types; row→domain mapper functions
```

### Page

```
src/pages/FlashcardsPage.tsx
```

Owns: `selectedSetId`, modal open/close state, composition of hook results.
Does NOT contain: transformation logic, mapping, business logic.

---

## Responsibility Split

### `api/flashcards.ts`

All Supabase queries. All row→domain mapping happens here before data leaves this layer.
All read functions use the anon Supabase client (`src/lib/supabase.ts`) and are safe to call
without an active user session — RLS on the DB handles visibility automatically.

Functions:
- `getVisibleSets()` — returns global sets (`created_by IS NULL`, `is_public = true`) plus any user-owned sets. No `userId` parameter needed — RLS uses `auth.uid()` internally. Includes an embedded count of cards per set via `.select('*, flashcards(count)')`. Note: PostgREST returns this as a nested array (`row.flashcards[{ count: number }]`); the mapper must extract `cardCount` as `row.flashcards[0].count ?? 0`.
- `createSet(title, description)` — inserts into `flashcard_sets` with `created_by = auth.uid()`. Uses `.select()` to return the created row. On error, throws — no optimistic append; caller refetches on success.
- `getCardsBySet(setId)` — ordered by `sort_order`. Callable without a session.
- `getProgressByCards(cardIds, userId)` — returns `user_card_progress` rows for the given cards and user.
- `upsertCardProgress(userId, flashcardId, status)` — insert or update.

### `types.ts`

Domain types (camelCase, app-friendly shapes) derived from DB rows.
The `FlashcardCard` domain type supersedes the existing `src/types/flashcard.ts` `Flashcard` interface.
`FlashcardViewer` will use `FlashcardCard[]` as its `cards` prop type.
`Flashcard.tsx` (the card UI component) will have its prop type updated to accept `FlashcardCard`
(or a compatible subset) — this is the only change to that file.

```ts
type FlashcardSet = {
  id: string
  title: string
  description: string | null
  isPublic: boolean
  createdBy: string | null
  createdAt: string
  cardCount: number
}

type FlashcardCard = {
  id: string
  setId: string
  nativeWord: string
  englishWord: string
  partOfSpeech: string | null
  level: 'basic' | 'intermediate' | 'advanced' | null
  exampleSentence: string | null
  imageUrl: string | null
  sortOrder: number
}
// Note: the DB `level` column is `text | null` (check constraint, not a Postgres enum).
// The mapper in api/flashcards.ts must cast: `row.level as FlashcardCard['level']`.

type CardProgress = {
  flashcardId: string
  status: 'unseen' | 'known' | 'unknown'
  lastStudiedAt: string | null
}
```

Mapper functions (called by `api/flashcards.ts`, not by hooks or components).

### Hooks

Handle: loading/error/success state, auth-awareness, mutation helpers.
Do NOT handle: shape transformations.

**`useFlashcardSets`**
- Fetches visible sets on mount
- Exposes `sets`, `loading`, `error`, `createSet(title, description)`
- `createSet` calls the API, then triggers a full refetch on success (no optimistic append)

**`useFlashcards(setId)`**
- Fetches cards for the given set
- Exposes `cards`, `loading`, `error`
- Re-fetches when `setId` changes

**`useCardProgress(cardIds, userId?)`**
- Skips query if `cardIds` is empty or `userId` is absent (guest)
- Returns a `progressMap: Record<string, CardProgress>`
- Exposes `markKnown(cardId)`, `markUnknown(cardId)` — no-ops for guests
- Handles `cardIds` memoisation internally: stringifies ids to use as a stable dependency, so the caller does not need to `useMemo`
- On set switch: new `cards` array → new stringified ids → progress query re-runs automatically

### `FlashcardViewer`

Props: `cards`, `progressMap`, `onMarkKnown`, `onMarkUnknown`, `onBack`, `isAuthenticated`

**Does not own navigation state.** Delegates to `useFlashcardNavigation(cards.length)` internally.
**Does not own flip state.** `Flashcard.tsx` manages its own `isFlipped` state internally (unchanged).

**Note on navigation reset:** `useFlashcardNavigation` resets the index when `cardCount` changes. If two sets have the same card count, the index will not reset on set switch. Pass `setId` as a `resetKey` prop to the hook (requires a small update to `useFlashcardNavigation`) to ensure correct reset behaviour on every set change.

Behaviour:
- Shows known/unknown buttons only when `isAuthenticated`
- Calls `onMarkKnown`/`onMarkUnknown` and advances to next card
- Keyboard: ← → for navigation (via `useFlashcardNavigation`)

### `FlashcardsPage`

State: `selectedSetId: string | null`, `isCreateModalOpen: boolean`

```tsx
const { sets, loading, createSet } = useFlashcardSets();
const { cards } = useFlashcards(selectedSetId);
const { progressMap, markKnown, markUnknown } = useCardProgress(cards.map(c => c.id), user?.id);
```

Renders:
- `FlashcardSetList` when `selectedSetId === null`
- `FlashcardViewer` when a set is selected

Passes hook results directly as props — no transformation inline.

---

## RLS Grants Migration

**File:** `supabase/migrations/20260319000003_grants.sql`

The tables were created via raw SQL migration, so Supabase's default role grants may not be present.
Without explicit grants the `anon` role cannot execute the RLS subqueries on `flashcard_sets` and
`flashcards`, which causes guest browsing to silently return empty results.

This migration must run before the seed:

```sql
-- Allow anon and authenticated roles to read public flashcard data
-- RLS policies still enforce row-level visibility; these grants only permit role access
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
```

---

## Seed Migration

**File:** `supabase/migrations/20260319000004_seed_curated_sets.sql`

Two curated global sets with stable fixed UUIDs:

| Set | UUID | Title | Description |
|-----|------|-------|-------------|
| Thai | `00000000-0000-0000-0000-000000000001` | English Essentials (Thai) | Core English vocabulary with Thai support for beginner learners |
| Chinese | `00000000-0000-0000-0000-000000000002` | English Essentials (Chinese) | Core English vocabulary with Chinese support for beginner learners |

Both sets: `created_by = NULL`, `is_public = true`.

Each set contains the same 9 English target words at basic/intermediate/advanced levels:

| `english_word` | Thai `native_word` | Chinese `native_word` | `level` |
|---|---|---|---|
| Hello | สวัสดี | 你好 | basic |
| Water | น้ำ | 水 | basic |
| Food | อาหาร | 食物 | basic |
| Education | การศึกษา | 教育 | intermediate |
| Experience | ประสบการณ์ | 经验 | intermediate |
| Opportunity | โอกาส | 机会 | intermediate |
| Responsibility | ความรับผิดชอบ | 责任 | advanced |
| Development | การพัฒนา | 发展 | advanced |
| Understanding | ความเข้าใจ | 理解 | advanced |

Migration uses `ON CONFLICT DO NOTHING` — idempotent and safe to re-run in dev.

---

## `CreateSetModal` Form

- Fields: **Title** (required, max 100 chars), **Description** (optional, max 300 chars)
- Validation: Zod schema + React Hook Form (consistent with auth forms)
- On submit: calls `createSet` from `useFlashcardSets`
- On success: closes modal, full refetch updates the set list
- On error: inline error below form
- Only accessible to authenticated users (button hidden for guests)

---

## `FlashcardSetList` UI

- Grid of set cards: title, description, card count (from embedded Supabase count query)
- "Create set" button — visible only when authenticated
- Guest users see global sets and can browse them, but no create button
- Clicking a set calls `setSelectedSetId(set.id)` on `FlashcardsPage`

---

## Guest vs Authenticated Behaviour

| Action | Guest | Authenticated |
|--------|-------|---------------|
| Browse global sets | ✅ | ✅ |
| Study cards (flip/navigate) | ✅ | ✅ |
| Mark known/unknown | ✗ (buttons hidden) | ✅ |
| See own sets | ✗ | ✅ |
| Create set | ✗ (button hidden) | ✅ |

---

## Files Changed / Created

**New:**
- `supabase/migrations/20260319000003_grants.sql`
- `supabase/migrations/20260319000004_seed_curated_sets.sql`
- `src/features/flashcards/api/flashcards.ts`
- `src/features/flashcards/hooks/useFlashcardSets.ts`
- `src/features/flashcards/hooks/useFlashcards.ts`
- `src/features/flashcards/hooks/useCardProgress.ts`
- `src/features/flashcards/components/FlashcardSetList.tsx`
- `src/features/flashcards/components/CreateSetModal.tsx`
- `src/features/flashcards/types.ts`

**Updated:**
- `src/features/flashcards/components/FlashcardViewer.tsx` (moved from `src/components/flashcards/`, made dumb — delegates navigation to `useFlashcardNavigation`, flip state stays in `Flashcard.tsx`)
- `src/features/flashcards/useFlashcardNavigation.ts` — add `resetKey` parameter (e.g. `setId`) to the hook so the card index resets correctly when switching between sets that have the same card count
- `src/components/flashcards/Flashcard.tsx` — prop type updated to accept `FlashcardCard` (minor change only)
- `src/pages/FlashcardsPage.tsx` — thin orchestrator
- `src/App.tsx` — remove the `lazy` import for `FlashcardTest` and the `/flashcard-test` route entry (required after `FlashcardTest.tsx` is deleted; omitting this will cause a build failure)

**Deleted:**
- `src/lib/api/flashcards.ts` — dead code, broken query (`user_id` column does not exist on `flashcards` table). Confirm no live imports before deleting.
- `src/mocks/mockFlashcardData.ts` — replaced by real DB data
- `src/pages/FlashcardTest.tsx` — dev smoke-test only. Once `Flashcard.tsx` prop type is updated to `FlashcardCard`, the hardcoded stub object (missing `setId`, `sortOrder`) will cause a TypeScript error. Delete rather than maintain a throwaway test page.
- `src/components/flashcards/DifficultySelector.tsx` — currently used by `FlashcardsPage` to filter mock data by level. The new set-picker design supersedes this pattern at the page level. The difficulty filter is a useful study-time feature but is out of scope for this iteration; delete now and reintroduce inside `FlashcardViewer` in a future pass.
