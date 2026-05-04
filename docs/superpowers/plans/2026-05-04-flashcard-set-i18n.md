# Flashcard set i18n implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Translate curated flashcard set titles and descriptions on `/flashcards` for vi, th, and zh-CN learners.

**Architecture:** Add a nullable `slug` column to `flashcard_sets`, populate it for the 17 curated sets, and wire `FlashcardSetList` to read translations from `src/locales/<lang>/<lang>.json` keyed by slug, falling back to the DB raw column when a key is missing.

**Tech Stack:** Supabase Postgres (migration), TypeScript + React + Vite, react-i18next, Vitest.

**Spec:** `docs/superpowers/specs/2026-05-04-flashcard-set-i18n-design.md`.

---

## Reference: the 17 curated sets

Used by Tasks 1, 5, 6, 7, 8. UUIDs come from `supabase/migrations/20260322000001_seed_csv_sets.sql`. Slugs come from the CSV filenames recorded in that migration's `=== title (slug.csv) ===` section headers.

| UUID | English title | English description | Slug |
|---|---|---|---|
| `c5543caa-e6bc-b529-1c87-f8fb105ca57d` | Greetings & Small Talk | Everyday greetings, introductions, and casual conversation phrases | `greetings_small_talk` |
| `4dd49c50-0c22-95f8-778c-604aecab4a5a` | Numbers 1–100 | Learn to read and write numbers from one to one hundred | `numbers_1_100` |
| `87cc9ab4-0e1c-be14-3286-9a05e906effe` | Numbers 1–100 (Words) | Numbers one to one hundred written out as English words | `numbers_1_100_words` |
| `0d716dca-681a-1ee0-a7b7-1f093d5429cc` | Numbers 1–100 (Phonetic) | Phonetic pronunciation guide for numbers one to one hundred | `numbers_1_100_phonetic` |
| `39b3a616-f9f2-e290-a7d4-bc03c30851cd` | Fruit | Common fruits for everyday vocabulary | `fruit_20_basic` |
| `86bb7f26-33ff-e4fa-4268-51b1d2a965b8` | Vegetables | Common vegetables for everyday vocabulary | `vegetables_20_basic` |
| `cecc9bfc-8086-b8e5-c793-839f50eb7b8b` | Food | Essential food vocabulary — single words for beginners | `food_single_words_basic` |
| `28c8f4ca-d072-8c4a-fbd2-6f4438cf574b` | Cutlery & Tableware | Knives, forks, plates, and other table items | `cutlery_china_10_basic` |
| `6c14435e-ac23-c1db-78d7-5c5f9e30f9b0` | Daily Life | Vocabulary for common everyday activities and routines | `daily_life_20` |
| `3e698b90-bfda-c9cb-8042-a0616ef85910` | Time | Telling the time, days, months, and time expressions | `time_20` |
| `f6af32e3-ed88-ec1e-3004-8736d589cf2e` | Shopping & Money | Vocabulary for shopping, prices, and handling money | `shopping_money_20` |
| `4375bc23-c8e6-ae1f-0925-70a8eeefed39` | Directions & Transportation | Asking for and giving directions, and transport vocabulary | `directions_transportation_20` |
| `10dcdbb5-517c-257e-56e6-258458edcf25` | Accommodation & Hotels | Vocabulary for checking in, hotel facilities, and lodging | `accommodation_hotels_20` |
| `75edd4a4-8f3f-b458-de8a-7398a9e0faf5` | Travel Essentials | Essential phrases and vocabulary for travelling | `travel_essentials` |
| `bdb49c90-9690-3598-2a43-4bc811df2ddd` | Work & Business | Professional vocabulary for the workplace and business settings | `work_business_20` |
| `dcf29f3d-3d44-ce90-0f15-9461e79af43e` | Dating & Social | Vocabulary for socialising, dating, and meeting new people | `dating_social_20` |
| `bf91ca3a-1356-273e-fe1f-f837199eb9c9` | Emergencies & Health | Essential vocabulary for medical situations and emergencies | `emergencies_health_20` |

---

## Task 1: Migration — add `slug` column, partial unique index, backfill

**Files:**
- Create: `supabase/migrations/20260504000003_flashcard_set_slugs.sql`

- [ ] **Step 1.1: Write the migration**

```sql
-- supabase/migrations/20260504000003_flashcard_set_slugs.sql
-- Adds a nullable slug column to flashcard_sets for the 17 curated sets,
-- so the frontend can key i18n locale lookups by stable slug rather than
-- mutable title text. User-created sets (created_by IS NOT NULL) keep
-- slug = NULL and render the user's typed title untouched.

ALTER TABLE flashcard_sets ADD COLUMN slug TEXT;

-- Partial unique index: enforces no two curated sets share a slug,
-- without forcing user-created sets to invent one.
CREATE UNIQUE INDEX flashcard_sets_slug_unique
  ON flashcard_sets (slug) WHERE slug IS NOT NULL;

-- Backfill the 17 curated sets seeded by 20260322000001_seed_csv_sets.sql.
-- Slugs come from the CSV filenames in that seed's section headers.
UPDATE flashcard_sets SET slug = 'greetings_small_talk'        WHERE id = 'c5543caa-e6bc-b529-1c87-f8fb105ca57d';
UPDATE flashcard_sets SET slug = 'numbers_1_100'                WHERE id = '4dd49c50-0c22-95f8-778c-604aecab4a5a';
UPDATE flashcard_sets SET slug = 'numbers_1_100_words'          WHERE id = '87cc9ab4-0e1c-be14-3286-9a05e906effe';
UPDATE flashcard_sets SET slug = 'numbers_1_100_phonetic'       WHERE id = '0d716dca-681a-1ee0-a7b7-1f093d5429cc';
UPDATE flashcard_sets SET slug = 'fruit_20_basic'               WHERE id = '39b3a616-f9f2-e290-a7d4-bc03c30851cd';
UPDATE flashcard_sets SET slug = 'vegetables_20_basic'          WHERE id = '86bb7f26-33ff-e4fa-4268-51b1d2a965b8';
UPDATE flashcard_sets SET slug = 'food_single_words_basic'      WHERE id = 'cecc9bfc-8086-b8e5-c793-839f50eb7b8b';
UPDATE flashcard_sets SET slug = 'cutlery_china_10_basic'       WHERE id = '28c8f4ca-d072-8c4a-fbd2-6f4438cf574b';
UPDATE flashcard_sets SET slug = 'daily_life_20'                WHERE id = '6c14435e-ac23-c1db-78d7-5c5f9e30f9b0';
UPDATE flashcard_sets SET slug = 'time_20'                      WHERE id = '3e698b90-bfda-c9cb-8042-a0616ef85910';
UPDATE flashcard_sets SET slug = 'shopping_money_20'            WHERE id = 'f6af32e3-ed88-ec1e-3004-8736d589cf2e';
UPDATE flashcard_sets SET slug = 'directions_transportation_20' WHERE id = '4375bc23-c8e6-ae1f-0925-70a8eeefed39';
UPDATE flashcard_sets SET slug = 'accommodation_hotels_20'      WHERE id = '10dcdbb5-517c-257e-56e6-258458edcf25';
UPDATE flashcard_sets SET slug = 'travel_essentials'            WHERE id = '75edd4a4-8f3f-b458-de8a-7398a9e0faf5';
UPDATE flashcard_sets SET slug = 'work_business_20'             WHERE id = 'bdb49c90-9690-3598-2a43-4bc811df2ddd';
UPDATE flashcard_sets SET slug = 'dating_social_20'             WHERE id = 'dcf29f3d-3d44-ce90-0f15-9461e79af43e';
UPDATE flashcard_sets SET slug = 'emergencies_health_20'        WHERE id = 'bf91ca3a-1356-273e-fe1f-f837199eb9c9';

-- Sanity check: catch curated UUIDs that drifted between this migration's
-- UPDATE list and reality. Fails the migration if any curated set is left
-- with a NULL slug.
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM flashcard_sets WHERE created_by IS NULL AND slug IS NULL) > 0 THEN
    RAISE EXCEPTION 'curated set without slug after backfill — update migration UPDATE list';
  END IF;
END $$;
```

- [ ] **Step 1.2: Commit**

```bash
git add supabase/migrations/20260504000003_flashcard_set_slugs.sql
git commit -m "feat(db): add slug column to flashcard_sets + backfill 17 curated sets"
```

(Migration is NOT applied to remote yet — that's deferred to Task 9 so the live DB and the locale files land in lockstep.)

---

## Task 2: Update TypeScript types — `FlashcardSet`, `database.types.ts`, `mapSet`

**Files:**
- Modify: `src/lib/database.types.ts` — add `slug: string | null` to `flashcard_sets` Row/Insert/Update
- Modify: `src/features/flashcards/types.ts` — add `slug: string | null` to `FlashcardSet`, update `mapSet` to read it
- Modify: `src/features/flashcards/__tests__/mappers.test.ts` — assert `slug` in mapped output

- [ ] **Step 2.1: Update `database.types.ts`**

Open `src/lib/database.types.ts` and find the `flashcard_sets` block. It has three sub-types (`Row`, `Insert`, `Update`). Add `slug: string | null` to `Row` and `Update`, and `slug?: string | null` to `Insert` (optional because new inserts don't need to specify it).

Per the Phase 1 deferred-Minor note, this file is hand-edited; that's expected here too.

- [ ] **Step 2.2: Update `FlashcardSet` and `mapSet`**

Open `src/features/flashcards/types.ts`. Add `slug: string | null` to the `FlashcardSet` interface, and update `mapSet` to copy it from the row. The existing `mapSet` looks roughly like:

```ts
export function mapSet(row: any): FlashcardSet {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    isPublic: row.is_public,
    createdBy: row.created_by,
    createdAt: row.created_at,
    cardCount: row.flashcards?.[0]?.count ?? 0,
  };
}
```

Add a `slug` field:

```ts
export function mapSet(row: any): FlashcardSet {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    isPublic: row.is_public,
    createdBy: row.created_by,
    createdAt: row.created_at,
    cardCount: row.flashcards?.[0]?.count ?? 0,
    slug: row.slug ?? null,  // null on user-created sets and pre-migration rows
  };
}
```

- [ ] **Step 2.3: Update `mappers.test.ts`**

Open `src/features/flashcards/__tests__/mappers.test.ts`. The first test fixture currently looks like:

```ts
const row = {
  id: 'abc',
  title: 'Test Set',
  description: 'A description',
  is_public: true,
  created_by: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  flashcards: [{ count: 5 }],
};
expect(mapSet(row)).toEqual({
  id: 'abc',
  title: 'Test Set',
  description: 'A description',
  isPublic: true,
  createdBy: null,
  createdAt: '2026-01-01T00:00:00Z',
  cardCount: 5,
});
```

Add `slug: 'test_slug'` to the row and `slug: 'test_slug'` to the expected object. For the next two `mapSet` tests (which omit slug from the row), expect `slug: null`.

Add a fourth test verifying the explicit-null case:

```ts
it('preserves explicit null slug', () => {
  const row = {
    id: 'abc', title: 'T', description: null, is_public: false, slug: null,
    created_by: null, created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z', flashcards: [{ count: 0 }],
  };
  expect(mapSet(row).slug).toBe(null);
});
```

- [ ] **Step 2.4: Run tests, expect green**

```bash
npm test -- --run src/features/flashcards/__tests__/mappers.test.ts
```

Expected: all `mapSet` and `mapCard` and `mapProgress` tests pass.

- [ ] **Step 2.5: Run full type-check**

```bash
npm run type-check
```

Expected: clean.

- [ ] **Step 2.6: Commit**

```bash
git add src/lib/database.types.ts src/features/flashcards/types.ts src/features/flashcards/__tests__/mappers.test.ts
git commit -m "feat(flashcards): add slug field to FlashcardSet"
```

---

## Task 3: `useSetCopy` helper (TDD)

**Files:**
- Create: `src/features/flashcards/hooks/useSetCopy.ts`
- Create: `src/features/flashcards/__tests__/useSetCopy.test.tsx`

- [ ] **Step 3.1: Write the failing tests**

Create `src/features/flashcards/__tests__/useSetCopy.test.tsx`:

```tsx
import { describe, it, expect, beforeAll } from 'vitest';
import { renderHook } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useSetCopy } from '../hooks/useSetCopy';
import type { FlashcardSet } from '../types';

beforeAll(() => {
  i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: {
        translation: {
          flashcards: {
            sets: {
              greetings_small_talk: {
                title: 'Greetings & Small Talk',
                description: 'Everyday greetings and intros',
              },
            },
          },
        },
      },
    },
    interpolation: { escapeValue: false },
  });
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const baseSet: FlashcardSet = {
  id: 'abc',
  title: 'DB Title',
  description: 'DB Description',
  isPublic: true,
  createdBy: null,
  createdAt: '2026-01-01T00:00:00Z',
  cardCount: 0,
  slug: null,
};

describe('useSetCopy', () => {
  it('returns DB raw values when slug is null (user-created set)', () => {
    const { result } = renderHook(() => useSetCopy(baseSet), { wrapper });
    expect(result.current).toEqual({
      title: 'DB Title',
      description: 'DB Description',
    });
  });

  it('returns translated values when slug + locale key exist', () => {
    const set = { ...baseSet, slug: 'greetings_small_talk', title: 'Old Title', description: 'Old Desc' };
    const { result } = renderHook(() => useSetCopy(set), { wrapper });
    expect(result.current).toEqual({
      title: 'Greetings & Small Talk',
      description: 'Everyday greetings and intros',
    });
  });

  it('falls back to DB raw values when slug is set but locale key is missing', () => {
    const set = { ...baseSet, slug: 'no_such_slug' };
    const { result } = renderHook(() => useSetCopy(set), { wrapper });
    expect(result.current).toEqual({
      title: 'DB Title',
      description: 'DB Description',
    });
  });

  it('returns empty string description when slug is null and DB description is null', () => {
    const set = { ...baseSet, description: null };
    const { result } = renderHook(() => useSetCopy(set), { wrapper });
    expect(result.current).toEqual({
      title: 'DB Title',
      description: '',
    });
  });
});
```

- [ ] **Step 3.2: Run tests, expect failure**

```bash
npm test -- --run src/features/flashcards/__tests__/useSetCopy.test.tsx
```

Expected: FAIL with "Cannot find module '../hooks/useSetCopy'" or similar.

- [ ] **Step 3.3: Write the helper**

Create `src/features/flashcards/hooks/useSetCopy.ts`:

```ts
import { useTranslation } from 'react-i18next';
import type { FlashcardSet } from '../types';

/**
 * Resolve display title and description for a flashcard set, using the
 * i18n key `flashcards.sets.<slug>.{title,description}` when the set has
 * a slug (curated sets), and falling back to the DB raw columns otherwise.
 *
 * `t(..., { defaultValue })` makes a missing locale key return the DB raw
 * column instead of the literal key path — so a slug without a matching
 * locale entry never leaks `flashcards.sets.foo.title` into the UI.
 */
export function useSetCopy(set: FlashcardSet): { title: string; description: string } {
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

- [ ] **Step 3.4: Run tests, expect green**

```bash
npm test -- --run src/features/flashcards/__tests__/useSetCopy.test.tsx
```

Expected: all 4 tests pass.

- [ ] **Step 3.5: Commit**

```bash
git add src/features/flashcards/hooks/useSetCopy.ts src/features/flashcards/__tests__/useSetCopy.test.tsx
git commit -m "feat(flashcards): add useSetCopy hook for slug-based i18n with DB fallback"
```

---

## Task 4: Wire `FlashcardSetList` to use `useSetCopy`

**Files:**
- Modify: `src/features/flashcards/components/FlashcardSetList.tsx` — extract the per-set rendering into a child component that calls `useSetCopy`

The hook must be called per-set, not in a `.map()` body of the parent (rules of hooks). Easiest path: extract a small `FlashcardSetCard` child component.

- [ ] **Step 4.1: Update the component**

Replace the `<button>` inside the `.map()` with a child component invocation, and define that child below:

```tsx
import { useTranslation } from 'react-i18next';
import type { FlashcardSet } from '../types';
import Button from '@/components/ui/Button';
import { useSetCopy } from '../hooks/useSetCopy';

interface FlashcardSetListProps {
  sets: FlashcardSet[];
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  onSelectSet: (setId: string) => void;
  onCreateSet: () => void;
}

export function FlashcardSetList({
  sets,
  loading,
  error,
  isAuthenticated,
  onSelectSet,
  onCreateSet,
}: FlashcardSetListProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-semantic-muted">{t('flashcards.sets.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-semantic-error">{t('flashcards.sets.load_error', { error })}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-display heading-accent">{t('flashcards.sets.heading')}</h2>
        {isAuthenticated && (
          <Button variant="primary" size="sm" onClick={onCreateSet}>
            {t('flashcards.sets.create')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {sets.map((set) => (
          <FlashcardSetCard key={set.id} set={set} onSelect={onSelectSet} />
        ))}
      </div>

      {sets.length === 0 && (
        <p className="text-center text-semantic-muted py-12">
          {t('flashcards.sets.empty')}
        </p>
      )}
    </div>
  );
}

function FlashcardSetCard({
  set,
  onSelect,
}: {
  set: FlashcardSet;
  onSelect: (setId: string) => void;
}) {
  const { t } = useTranslation();
  const { title, description } = useSetCopy(set);
  return (
    <button
      onClick={() => onSelect(set.id)}
      className="card card-interactive text-left space-y-3"
    >
      <h3 className="text-base md:text-lg font-semibold text-semantic-text dark:text-semantic-text">
        {title}
      </h3>
      {description && (
        <p className="text-sm leading-relaxed text-semantic-muted dark:text-semantic-muted">
          {description}
        </p>
      )}
      <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
        {set.cardCount}{' '}
        {set.cardCount === 1
          ? t('flashcards.sets.card_singular')
          : t('flashcards.sets.card_plural')}
      </p>
    </button>
  );
}
```

- [ ] **Step 4.2: Run type-check + lint**

```bash
npm run type-check && npm run lint
```

Expected: both clean.

- [ ] **Step 4.3: Run any FlashcardSetList-touching tests**

```bash
npm test -- --run src/features/flashcards
```

Expected: all flashcards tests pass. (Note: `useFlashcardSets.test.ts` uses synthetic set fixtures — confirmed during planning that it doesn't hardcode the 17 real titles. If a test breaks because it doesn't supply `slug` in its fixtures, that's a real fix: add `slug: null` to its mock objects to match the new type.)

- [ ] **Step 4.4: Commit**

```bash
git add src/features/flashcards/components/FlashcardSetList.tsx
git commit -m "feat(flashcards): render set titles/descriptions through useSetCopy"
```

---

## Task 5: Add canonical English locale entries

**Files:**
- Modify: `src/locales/en/en.json` — add per-slug `title` + `description` blocks under `flashcards.sets`

- [ ] **Step 5.1: Locate the existing `flashcards.sets` block**

Open `src/locales/en/en.json`. The block currently looks like:

```json
"sets": {
  "heading": "Flashcard Sets",
  "loading": "Loading sets…",
  "load_error": "Failed to load sets: {{error}}",
  "create": "Create Set",
  "empty": "No sets available.",
  "card_singular": "card",
  "card_plural": "cards"
}
```

(Exact key list may differ — match what's there and don't drop existing keys.)

- [ ] **Step 5.2: Add the 17 per-slug blocks**

Append the following object members inside the same `sets` block (alongside `heading`, `create`, etc., NOT replacing them). Order them after the existing UI keys for diff readability:

```json
"greetings_small_talk": {
  "title": "Greetings & Small Talk",
  "description": "Everyday greetings, introductions, and casual conversation phrases"
},
"numbers_1_100": {
  "title": "Numbers 1–100",
  "description": "Learn to read and write numbers from one to one hundred"
},
"numbers_1_100_words": {
  "title": "Numbers 1–100 (Words)",
  "description": "Numbers one to one hundred written out as English words"
},
"numbers_1_100_phonetic": {
  "title": "Numbers 1–100 (Phonetic)",
  "description": "Phonetic pronunciation guide for numbers one to one hundred"
},
"fruit_20_basic": {
  "title": "Fruit",
  "description": "Common fruits for everyday vocabulary"
},
"vegetables_20_basic": {
  "title": "Vegetables",
  "description": "Common vegetables for everyday vocabulary"
},
"food_single_words_basic": {
  "title": "Food",
  "description": "Essential food vocabulary — single words for beginners"
},
"cutlery_china_10_basic": {
  "title": "Cutlery & Tableware",
  "description": "Knives, forks, plates, and other table items"
},
"daily_life_20": {
  "title": "Daily Life",
  "description": "Vocabulary for common everyday activities and routines"
},
"time_20": {
  "title": "Time",
  "description": "Telling the time, days, months, and time expressions"
},
"shopping_money_20": {
  "title": "Shopping & Money",
  "description": "Vocabulary for shopping, prices, and handling money"
},
"directions_transportation_20": {
  "title": "Directions & Transportation",
  "description": "Asking for and giving directions, and transport vocabulary"
},
"accommodation_hotels_20": {
  "title": "Accommodation & Hotels",
  "description": "Vocabulary for checking in, hotel facilities, and lodging"
},
"travel_essentials": {
  "title": "Travel Essentials",
  "description": "Essential phrases and vocabulary for travelling"
},
"work_business_20": {
  "title": "Work & Business",
  "description": "Professional vocabulary for the workplace and business settings"
},
"dating_social_20": {
  "title": "Dating & Social",
  "description": "Vocabulary for socialising, dating, and meeting new people"
},
"emergencies_health_20": {
  "title": "Emergencies & Health",
  "description": "Essential vocabulary for medical situations and emergencies"
}
```

- [ ] **Step 5.3: Verify JSON is valid**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/locales/en/en.json', 'utf8'))" && echo "OK"
```

Expected: `OK`. (If JSON parse fails, the most common cause is a trailing/missing comma — open the file and fix.)

- [ ] **Step 5.4: Commit**

```bash
git add src/locales/en/en.json
git commit -m "feat(i18n): add en locale entries for 17 curated flashcard sets"
```

---

## Task 6: Add Vietnamese (vi) locale entries

**Files:**
- Modify: `src/locales/vi/vi.json` — same structure as Task 5, Vietnamese strings

These are draft translations. Reviewer should verify register and tone are appropriate for L2 English learners.

- [ ] **Step 6.1: Add the 17 per-slug blocks under `flashcards.sets`**

```json
"greetings_small_talk": {
  "title": "Lời chào & Trò chuyện ngắn",
  "description": "Lời chào hàng ngày, giới thiệu bản thân và các câu giao tiếp thường ngày"
},
"numbers_1_100": {
  "title": "Số đếm 1–100",
  "description": "Học cách đọc và viết các số từ một đến một trăm"
},
"numbers_1_100_words": {
  "title": "Số đếm 1–100 (Chữ viết)",
  "description": "Các số từ một đến một trăm viết bằng chữ tiếng Anh"
},
"numbers_1_100_phonetic": {
  "title": "Số đếm 1–100 (Phiên âm)",
  "description": "Hướng dẫn phát âm các số từ một đến một trăm"
},
"fruit_20_basic": {
  "title": "Trái cây",
  "description": "Các loại trái cây thường gặp trong từ vựng hàng ngày"
},
"vegetables_20_basic": {
  "title": "Rau củ",
  "description": "Các loại rau củ thường gặp trong từ vựng hàng ngày"
},
"food_single_words_basic": {
  "title": "Đồ ăn",
  "description": "Từ vựng đồ ăn cơ bản — từ đơn cho người mới bắt đầu"
},
"cutlery_china_10_basic": {
  "title": "Dao kéo & Đồ dùng bàn ăn",
  "description": "Dao, nĩa, đĩa và các vật dụng khác trên bàn ăn"
},
"daily_life_20": {
  "title": "Cuộc sống hàng ngày",
  "description": "Từ vựng cho các hoạt động và thói quen hàng ngày"
},
"time_20": {
  "title": "Thời gian",
  "description": "Cách xem giờ, các ngày, tháng, và cụm từ chỉ thời gian"
},
"shopping_money_20": {
  "title": "Mua sắm & Tiền bạc",
  "description": "Từ vựng về mua sắm, giá cả và xử lý tiền bạc"
},
"directions_transportation_20": {
  "title": "Phương hướng & Phương tiện di chuyển",
  "description": "Cách hỏi và chỉ đường, cùng từ vựng về phương tiện di chuyển"
},
"accommodation_hotels_20": {
  "title": "Chỗ ở & Khách sạn",
  "description": "Từ vựng về nhận phòng, tiện nghi khách sạn và chỗ ở"
},
"travel_essentials": {
  "title": "Cẩm nang du lịch",
  "description": "Các câu và từ vựng cần thiết khi đi du lịch"
},
"work_business_20": {
  "title": "Công việc & Kinh doanh",
  "description": "Từ vựng chuyên nghiệp dùng tại nơi làm việc và trong môi trường kinh doanh"
},
"dating_social_20": {
  "title": "Hẹn hò & Xã giao",
  "description": "Từ vựng về giao tiếp xã hội, hẹn hò và làm quen với người mới"
},
"emergencies_health_20": {
  "title": "Trường hợp khẩn cấp & Sức khỏe",
  "description": "Từ vựng thiết yếu cho các tình huống y tế và khẩn cấp"
}
```

- [ ] **Step 6.2: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/locales/vi/vi.json', 'utf8'))" && echo "OK"
```

- [ ] **Step 6.3: Commit**

```bash
git add src/locales/vi/vi.json
git commit -m "feat(i18n): add vi locale entries for 17 curated flashcard sets"
```

---

## Task 7: Add Thai (th) locale entries

**Files:**
- Modify: `src/locales/th/th.json`

- [ ] **Step 7.1: Add the 17 per-slug blocks under `flashcards.sets`**

```json
"greetings_small_talk": {
  "title": "คำทักทาย & การสนทนาทั่วไป",
  "description": "คำทักทายในชีวิตประจำวัน การแนะนำตัว และวลีสนทนาทั่วไป"
},
"numbers_1_100": {
  "title": "ตัวเลข 1–100",
  "description": "เรียนรู้การอ่านและเขียนตัวเลขตั้งแต่หนึ่งถึงหนึ่งร้อย"
},
"numbers_1_100_words": {
  "title": "ตัวเลข 1–100 (เป็นคำ)",
  "description": "ตัวเลขหนึ่งถึงหนึ่งร้อยเขียนเป็นคำภาษาอังกฤษ"
},
"numbers_1_100_phonetic": {
  "title": "ตัวเลข 1–100 (สัทอักษร)",
  "description": "คู่มือการออกเสียงตัวเลขหนึ่งถึงหนึ่งร้อย"
},
"fruit_20_basic": {
  "title": "ผลไม้",
  "description": "ผลไม้ทั่วไปในคำศัพท์ประจำวัน"
},
"vegetables_20_basic": {
  "title": "ผัก",
  "description": "ผักทั่วไปในคำศัพท์ประจำวัน"
},
"food_single_words_basic": {
  "title": "อาหาร",
  "description": "คำศัพท์อาหารพื้นฐาน — คำเดี่ยวสำหรับผู้เริ่มต้น"
},
"cutlery_china_10_basic": {
  "title": "ช้อนส้อม & เครื่องบนโต๊ะอาหาร",
  "description": "มีด ส้อม จาน และของใช้อื่นๆ บนโต๊ะอาหาร"
},
"daily_life_20": {
  "title": "ชีวิตประจำวัน",
  "description": "คำศัพท์สำหรับกิจกรรมและกิจวัตรประจำวัน"
},
"time_20": {
  "title": "เวลา",
  "description": "การบอกเวลา วัน เดือน และคำที่เกี่ยวกับเวลา"
},
"shopping_money_20": {
  "title": "การช้อปปิ้ง & เงิน",
  "description": "คำศัพท์เกี่ยวกับการช้อปปิ้ง ราคา และการจัดการเงิน"
},
"directions_transportation_20": {
  "title": "ทิศทาง & การเดินทาง",
  "description": "การถามและบอกทาง คำศัพท์เกี่ยวกับการเดินทาง"
},
"accommodation_hotels_20": {
  "title": "ที่พัก & โรงแรม",
  "description": "คำศัพท์เกี่ยวกับการเช็คอิน สิ่งอำนวยความสะดวกในโรงแรม และที่พัก"
},
"travel_essentials": {
  "title": "เครื่องมือสำหรับการเดินทาง",
  "description": "วลีและคำศัพท์ที่จำเป็นสำหรับการเดินทาง"
},
"work_business_20": {
  "title": "การทำงาน & ธุรกิจ",
  "description": "คำศัพท์ทางวิชาชีพสำหรับสถานที่ทำงานและสภาพแวดล้อมทางธุรกิจ"
},
"dating_social_20": {
  "title": "การออกเดท & การเข้าสังคม",
  "description": "คำศัพท์เกี่ยวกับการเข้าสังคม การออกเดท และการพบปะผู้คนใหม่ๆ"
},
"emergencies_health_20": {
  "title": "เหตุฉุกเฉิน & สุขภาพ",
  "description": "คำศัพท์ที่จำเป็นสำหรับสถานการณ์ทางการแพทย์และเหตุฉุกเฉิน"
}
```

- [ ] **Step 7.2: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/locales/th/th.json', 'utf8'))" && echo "OK"
```

- [ ] **Step 7.3: Commit**

```bash
git add src/locales/th/th.json
git commit -m "feat(i18n): add th locale entries for 17 curated flashcard sets"
```

---

## Task 8: Add Chinese (zh-CN) locale entries

**Files:**
- Modify: `src/locales/zh-CN/zh-CN.json`

- [ ] **Step 8.1: Add the 17 per-slug blocks under `flashcards.sets`**

```json
"greetings_small_talk": {
  "title": "问候与闲聊",
  "description": "日常问候、自我介绍以及随意交谈的常用表达"
},
"numbers_1_100": {
  "title": "数字 1–100",
  "description": "学习读写从一到一百的数字"
},
"numbers_1_100_words": {
  "title": "数字 1–100（单词形式）",
  "description": "一到一百的数字用英文单词写出"
},
"numbers_1_100_phonetic": {
  "title": "数字 1–100（音标）",
  "description": "从一到一百的数字音标发音指南"
},
"fruit_20_basic": {
  "title": "水果",
  "description": "日常词汇中常见的水果"
},
"vegetables_20_basic": {
  "title": "蔬菜",
  "description": "日常词汇中常见的蔬菜"
},
"food_single_words_basic": {
  "title": "食物",
  "description": "基础食物词汇 — 适合初学者的单词"
},
"cutlery_china_10_basic": {
  "title": "餐具与餐桌用品",
  "description": "刀、叉、盘子等餐桌用品"
},
"daily_life_20": {
  "title": "日常生活",
  "description": "日常活动与例行公事的词汇"
},
"time_20": {
  "title": "时间",
  "description": "看时间、星期、月份以及时间表达"
},
"shopping_money_20": {
  "title": "购物与金钱",
  "description": "购物、价格以及处理金钱的词汇"
},
"directions_transportation_20": {
  "title": "方向与交通",
  "description": "询问和指引方向，以及交通词汇"
},
"accommodation_hotels_20": {
  "title": "住宿与酒店",
  "description": "入住、酒店设施以及住宿相关词汇"
},
"travel_essentials": {
  "title": "旅行必备",
  "description": "旅行时必需的短语和词汇"
},
"work_business_20": {
  "title": "工作与商务",
  "description": "适用于工作场所和商务环境的专业词汇"
},
"dating_social_20": {
  "title": "约会与社交",
  "description": "社交、约会以及结识新朋友的词汇"
},
"emergencies_health_20": {
  "title": "紧急情况与健康",
  "description": "医疗状况和紧急事件的必备词汇"
}
```

- [ ] **Step 8.2: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/locales/zh-CN/zh-CN.json', 'utf8'))" && echo "OK"
```

- [ ] **Step 8.3: Commit**

```bash
git add src/locales/zh-CN/zh-CN.json
git commit -m "feat(i18n): add zh-CN locale entries for 17 curated flashcard sets"
```

---

## Task 9: Brief CLAUDE.md note about the three-place change

**Files:**
- Modify: `CLAUDE.md` — add a "Flashcard sets" section near the existing "Lesson images" section

- [ ] **Step 9.1: Find the "Lesson images" section in CLAUDE.md and add a sibling section after it**

Append after the Lesson images section:

```markdown
## Flashcard sets

The 17 curated sets are seeded by `supabase/migrations/20260322000001_seed_csv_sets.sql` and given stable slugs in `20260504000003_flashcard_set_slugs.sql`. Set titles and descriptions are translated via `src/locales/<lang>/<lang>.json` keyed by slug — see `flashcards.sets.<slug>.{title,description}`.

Adding a new curated set is a three-place change:

1. Add the seed `INSERT INTO flashcard_sets (...)` (and the cards) in a new migration.
2. In the same or next migration, `UPDATE flashcard_sets SET slug = '<new_slug>' WHERE id = '<uuid>'`.
3. Add `flashcards.sets.<new_slug>.{title,description}` to all four locale files (`en`, `vi`, `th`, `zh-CN`).

`useSetCopy` (`src/features/flashcards/hooks/useSetCopy.ts`) falls back to the DB raw column when a locale key is missing, so a new slug without locale entries renders the seed-migration's English text rather than the key path — but step 3 is still required for translation to actually happen.

User-created sets keep `slug = NULL` and render the user-typed title; the helper short-circuits without touching i18n.
```

- [ ] **Step 9.2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): document flashcard set i18n three-place change"
```

---

## Task 10: Verify, apply migration to remote, push, open PR

This is the final task. The branch is ready for live testing.

- [ ] **Step 10.1: Run the full local test suite**

```bash
npm test -- --run
```

Expected: all green (~436 + 4 new = ~440).

- [ ] **Step 10.2: Run type-check, lint, build**

```bash
npm run type-check && npm run lint && npm run build
```

Expected: all clean.

- [ ] **Step 10.3: Apply the migration to the hosted DB**

```bash
supabase db push
```

Expected: prompts confirmation, then `Applying migration 20260504000003_flashcard_set_slugs.sql...` then `Finished supabase db push.` If the sanity-check `DO $$` block fires (`curated set without slug after backfill`), revisit Task 1's UPDATE list — a curated UUID has drifted between the seed and this migration.

- [ ] **Step 10.4: Spot-check via SQL editor**

In the Supabase dashboard SQL editor:

```sql
SELECT id, title, slug FROM flashcard_sets WHERE created_by IS NULL ORDER BY slug;
```

Expected: 17 rows, every one with a non-null slug from the migration.

- [ ] **Step 10.5: Manual smoke test**

Start `npm run dev` (with the backend running), log in as a user with `native_language = 'vi'`, navigate to `/flashcards`. Every curated set's title + description should render in Vietnamese. Switch the user's `native_language` (or use a different test user) for `th` and `zh-CN` and confirm both. Confirm an `en` user still sees the English text.

If a string renders as the literal key path (e.g., `flashcards.sets.greetings_small_talk.title`), that means the locale key is missing for the active language — go back to the relevant Task 5/6/7/8 step and fix.

- [ ] **Step 10.6: Push the branch**

```bash
git push -u origin feat/flashcard-set-i18n
```

- [ ] **Step 10.7: Open the PR**

```bash
gh pr create --title "feat(flashcards): translate curated set titles and descriptions" --body "$(cat <<'EOF'
## Summary

Curated flashcard set titles and descriptions on \`/flashcards\` now translate for vi, th, and zh-CN learners. User-created sets keep rendering the user's typed title untouched.

- Adds nullable \`slug\` column to \`flashcard_sets\` with a partial unique index \`WHERE slug IS NOT NULL\`.
- Backfills slugs for the 17 curated sets from \`20260322000001_seed_csv_sets.sql\` (slugs derived from the CSV filenames).
- New \`useSetCopy\` hook reads \`flashcards.sets.<slug>.{title,description}\` with \`defaultValue\` fallback to the DB raw column — missing locale keys never leak as raw key strings.
- Locale entries added to \`en\`, \`vi\`, \`th\`, \`zh-CN\` (~136 strings total).
- CLAUDE.md documents the three-place change discipline.

Spec: \`docs/superpowers/specs/2026-05-04-flashcard-set-i18n-design.md\`
Plan: \`docs/superpowers/plans/2026-05-04-flashcard-set-i18n.md\`

## Test plan
- [x] \`npm test\` green
- [x] \`npm run type-check\` clean
- [x] \`npm run lint\` clean
- [x] \`npm run build\` succeeds
- [x] Migration applied cleanly to hosted DB; sanity-check passed
- [x] Manual smoke: vi user sees Vietnamese; th user sees Thai; zh-CN user sees Chinese; en user unchanged
- [x] Manual smoke: any new user-created set renders raw user-typed title (slug = NULL path)

## Out of scope
- Translation prose review by native speakers (drafted by AI; reviewer should flag awkward phrasing)
- Regenerating \`src/lib/database.types.ts\` from live schema (deferred Minor item, separate concern)
EOF
)"
```

Expected: PR opened against `main`.

---

## Self-review notes

**Spec coverage check:**
- Schema change (spec § Architecture → Schema change) → Task 1 ✓
- Frontend rendering with useSetCopy (spec § Architecture → Frontend rendering) → Tasks 2, 3, 4 ✓
- Locale-file shape (spec § Architecture → Locale-file shape) → Tasks 5, 6, 7, 8 ✓
- Data flow (spec § Data flow) → Tasks 2, 3, 4 collectively ✓
- TypeScript / type changes (spec § TypeScript / type changes) → Task 2 ✓
- Error handling and edge cases (spec § Error handling and edge cases) → Task 3 tests cover all five branches ✓
- Testing (spec § Testing) → Task 3 tests + Task 4 broader run + Task 10 manual ✓
- Migration safety (spec § Migration safety) → Task 1 (sanity-check `DO $$`) + Task 10.3-10.4 ✓
- Out of scope items (spec § Out of scope) → respected; CLAUDE.md note added in Task 9 ✓

**Type consistency:** `slug: string | null` matches in `database.types.ts`, `FlashcardSet`, `mapSet` return, `useSetCopy` parameter, and the JSON keys (string literals). `useSetCopy` returns `{ title: string; description: string }` consistently.

**Commit cadence:** 10 tasks, ~10 commits (one per task, plus Task 2 has its own intermediate test commit). Each task ends with `npm test`/`npm run type-check` green up to that point. Migration is applied last (Task 10) so the live DB and the locale files land in lockstep.

**Known limitations called out:**
- Translation prose is AI-drafted and noted as such in the PR description; reviewer is asked to verify register/tone.
- `database.types.ts` stays hand-edited — separate deferred-Minor item, not bundled.
