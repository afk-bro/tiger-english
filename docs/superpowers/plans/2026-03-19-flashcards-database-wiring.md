# Flashcards Database Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all mock flashcard data with real Supabase queries, add a set picker with curated global sets, and save study progress for authenticated users.

**Architecture:** Feature folder at `src/features/flashcards/` with a typed API layer (`api/flashcards.ts`), three data hooks (`useFlashcardSets`, `useFlashcards`, `useCardProgress`), and three components (`FlashcardSetList`, `CreateSetModal`, `FlashcardViewer`). `FlashcardsPage` is the thin orchestrator — it holds `selectedSetId` and modal state, calls hooks, and passes results as props. All shape mapping happens in the API layer; hooks only manage loading/error/mutation state.

**Tech Stack:** React 19, TypeScript, Vitest + React Testing Library, Supabase JS client (anon key), React Hook Form + Zod (for CreateSetModal), Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-03-19-flashcards-database-wiring-design.md`

---

## Task 1: Apply DB migrations (grants + seed)

**Files:**
- Create: `supabase/migrations/20260319000003_grants.sql`
- Create: `supabase/migrations/20260319000004_seed_curated_sets.sql`

These must be applied before any frontend code runs. Apply via the Supabase MCP.

- [ ] **Step 1: Create the grants migration file**

```sql
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
```

- [ ] **Step 2: Create the seed migration file**

```sql
-- supabase/migrations/20260319000004_seed_curated_sets.sql
-- Two curated global sets. created_by IS NULL = system/curated.
-- Fixed UUIDs make this idempotent across dev resets.

insert into flashcard_sets (id, title, description, is_public, created_by)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'English Essentials (Thai)',
    'Core English vocabulary with Thai support for beginner learners',
    true,
    null
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'English Essentials (Chinese)',
    'Core English vocabulary with Chinese support for beginner learners',
    true,
    null
  )
on conflict (id) do nothing;

-- Thai set cards (fixed UUIDs → idempotent ON CONFLICT (id) DO NOTHING)
insert into flashcards (id, set_id, native_word, english_word, part_of_speech, level, example_sentence, sort_order)
values
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'สวัสดี',          'Hello',          'interjection', 'basic',        'สวัสดีครับ - Hello (polite form)',                   1),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'น้ำ',             'Water',          'noun',         'basic',        'ฉันดื่มน้ำ - I drink water',                        2),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'อาหาร',           'Food',           'noun',         'basic',        'อาหารอร่อย - The food is delicious',                3),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'การศึกษา',        'Education',      'noun',         'intermediate', 'การศึกษาสำคัญมาก - Education is very important',    4),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', 'ประสบการณ์',      'Experience',     'noun',         'intermediate', 'เขามีประสบการณ์มาก - He has a lot of experience',   5),
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0000-000000000001', 'โอกาส',           'Opportunity',    'noun',         'intermediate', 'นี่เป็นโอกาสดี - This is a good opportunity',       6),
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0000-000000000001', 'ความรับผิดชอบ',   'Responsibility', 'noun',         'advanced',     'เขามีความรับผิดชอบสูง - He has high responsibility',7),
  ('00000000-0000-0000-0001-000000000008', '00000000-0000-0000-0000-000000000001', 'การพัฒนา',        'Development',    'noun',         'advanced',     'การพัฒนาเทคโนโลยี - Technology development',        8),
  ('00000000-0000-0000-0001-000000000009', '00000000-0000-0000-0000-000000000001', 'ความเข้าใจ',      'Understanding',  'noun',         'advanced',     'ความเข้าใจที่ลึกซึ้ง - Deep understanding',         9)
on conflict (id) do nothing;

-- Chinese set cards (fixed UUIDs → idempotent ON CONFLICT (id) DO NOTHING)
insert into flashcards (id, set_id, native_word, english_word, part_of_speech, level, example_sentence, sort_order)
values
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000002', '你好', 'Hello',          'interjection', 'basic',        '你好！How are you?',                      1),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000002', '水',   'Water',          'noun',         'basic',        '我喝水 - I drink water',                   2),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000002', '食物', 'Food',           'noun',         'basic',        '食物很美味 - The food is delicious',        3),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000000002', '教育', 'Education',      'noun',         'intermediate', '教育很重要 - Education is very important',  4),
  ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0000-000000000002', '经验', 'Experience',     'noun',         'intermediate', '他有很多经验 - He has a lot of experience', 5),
  ('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0000-000000000002', '机会', 'Opportunity',    'noun',         'intermediate', '这是个好机会 - This is a good opportunity', 6),
  ('00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0000-000000000002', '责任', 'Responsibility', 'noun',         'advanced',     '他很有责任感 - He is very responsible',     7),
  ('00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0000-000000000002', '发展', 'Development',    'noun',         'advanced',     '技术发展 - Technology development',         8),
  ('00000000-0000-0000-0002-000000000009', '00000000-0000-0000-0000-000000000002', '理解', 'Understanding',  'noun',         'advanced',     '深刻理解 - Deep understanding',             9)
on conflict (id) do nothing;
```

- [ ] **Step 3: Apply both migrations via Supabase MCP**

Use `mcp__supabase__apply_migration` twice — first grants, then seed. Verify with `mcp__supabase__list_tables` that rows are present.

- [ ] **Step 4: Commit the migration files**

```bash
git add supabase/migrations/20260319000003_grants.sql supabase/migrations/20260319000004_seed_curated_sets.sql
git commit -m "feat: add role grants and seed curated flashcard sets"
```

---

## Task 2: Domain types and mappers

**Files:**
- Create: `src/features/flashcards/types.ts`
- Create: `src/features/flashcards/__tests__/mappers.test.ts`

Pure functions — no Supabase dependency. Test first.

- [ ] **Step 1: Create the test file**

```ts
// src/features/flashcards/__tests__/mappers.test.ts
import { describe, it, expect } from 'vitest';
import { mapSet, mapCard, mapProgress } from '../types';

describe('mapSet', () => {
  it('maps a DB row to a FlashcardSet domain object', () => {
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
  });

  it('defaults cardCount to 0 when flashcards array is empty', () => {
    const row = {
      id: 'abc', title: 'T', description: null, is_public: false,
      created_by: 'user-1', created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z', flashcards: [],
    };
    expect(mapSet(row).cardCount).toBe(0);
  });

  it('defaults cardCount to 0 when flashcards is undefined (defensive)', () => {
    const row = {
      id: 'abc', title: 'T', description: null, is_public: false,
      created_by: null, created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z', flashcards: undefined as any,
    };
    expect(mapSet(row).cardCount).toBe(0);
  });
});

describe('mapCard', () => {
  it('maps a DB row to a FlashcardCard domain object', () => {
    const row = {
      id: 'card-1',
      set_id: 'set-1',
      native_word: 'สวัสดี',
      english_word: 'Hello',
      part_of_speech: 'interjection',
      level: 'basic',
      example_sentence: 'Hello!',
      image_url: null,
      sort_order: 1,
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(mapCard(row)).toEqual({
      id: 'card-1',
      setId: 'set-1',
      nativeWord: 'สวัสดี',
      englishWord: 'Hello',
      partOfSpeech: 'interjection',
      level: 'basic',
      exampleSentence: 'Hello!',
      imageUrl: null,
      sortOrder: 1,
    });
  });
});

describe('mapProgress', () => {
  it('maps a DB row to a CardProgress domain object', () => {
    const row = {
      flashcard_id: 'card-1',
      status: 'known' as const,
      last_studied_at: '2026-01-01T00:00:00Z',
      user_id: 'user-1',
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(mapProgress(row)).toEqual({
      flashcardId: 'card-1',
      status: 'known',
      lastStudiedAt: '2026-01-01T00:00:00Z',
    });
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test -- src/features/flashcards/__tests__/mappers.test.ts
```
Expected: FAIL — `mapSet`, `mapCard`, `mapProgress` not found.

- [ ] **Step 3: Create `types.ts` with domain types and mappers**

```ts
// src/features/flashcards/types.ts

export type FlashcardSet = {
  id: string
  title: string
  description: string | null
  isPublic: boolean
  createdBy: string | null
  createdAt: string
  cardCount: number
}

export type FlashcardCard = {
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
// Note: DB `level` column is text | null (check constraint). Cast required in mapper.

export type CardProgress = {
  flashcardId: string
  status: 'unseen' | 'known' | 'unknown'
  lastStudiedAt: string | null
}

// ── Mappers ─────────────────────────────────────────────────────────────────
// Called only from api/flashcards.ts. Never called from hooks or components.

type SetRow = {
  id: string
  title: string
  description: string | null
  is_public: boolean
  created_by: string | null
  created_at: string
  flashcards?: { count: number }[]   // optional: PostgREST may omit if no rows
}

type CardRow = {
  id: string
  set_id: string
  native_word: string
  english_word: string
  part_of_speech: string | null
  level: string | null
  example_sentence: string | null
  image_url: string | null
  sort_order: number
  created_at: string
}

type ProgressRow = {
  flashcard_id: string
  status: 'unseen' | 'known' | 'unknown'
  last_studied_at: string | null
  user_id: string
  created_at: string
}

export function mapSet(row: SetRow): FlashcardSet {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    isPublic: row.is_public,
    createdBy: row.created_by,
    createdAt: row.created_at,
    cardCount: (row.flashcards ?? [])[0]?.count ?? 0,
  };
}

export function mapCard(row: CardRow): FlashcardCard {
  return {
    id: row.id,
    setId: row.set_id,
    nativeWord: row.native_word,
    englishWord: row.english_word,
    partOfSpeech: row.part_of_speech,
    level: row.level as FlashcardCard['level'],
    exampleSentence: row.example_sentence,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
  };
}

export function mapProgress(row: ProgressRow): CardProgress {
  return {
    flashcardId: row.flashcard_id,
    status: row.status,
    lastStudiedAt: row.last_studied_at,
  };
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- src/features/flashcards/__tests__/mappers.test.ts
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/flashcards/types.ts src/features/flashcards/__tests__/mappers.test.ts
git commit -m "feat: add flashcard domain types and mappers"
```

---

## Task 3: API layer

**Files:**
- Create: `src/features/flashcards/api/flashcards.ts`
- Create: `src/features/flashcards/__tests__/api.test.ts`

All Supabase queries live here. Mock `@/lib/supabase` in tests.

- [ ] **Step 1: Create the test file**

```ts
// src/features/flashcards/__tests__/api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock must be hoisted above imports that use it
vi.mock('@/lib/supabase', () => {
  const mockFrom = vi.fn();
  return { supabase: { from: mockFrom } };
});

import { supabase } from '@/lib/supabase';
import { getVisibleSets, getCardsBySet, getProgressByCards, upsertCardProgress, createSet } from '../api/flashcards';

const mockFrom = vi.mocked(supabase.from);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getVisibleSets', () => {
  it('returns mapped FlashcardSet array on success', async () => {
    const fakeRow = {
      id: 'set-1', title: 'Thai Set', description: null, is_public: true,
      created_by: null, created_at: '2026-01-01T00:00:00Z',
      flashcards: [{ count: 3 }],
    };
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [fakeRow], error: null }),
    } as any);

    const result = await getVisibleSets();
    expect(result).toHaveLength(1);
    expect(result[0].cardCount).toBe(3);
    expect(result[0].title).toBe('Thai Set');
  });

  it('throws when Supabase returns an error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    } as any);

    await expect(getVisibleSets()).rejects.toThrow('DB error');
  });
});

describe('getCardsBySet', () => {
  it('returns mapped FlashcardCard array ordered by sort_order', async () => {
    const fakeRow = {
      id: 'card-1', set_id: 'set-1', native_word: 'สวัสดี', english_word: 'Hello',
      part_of_speech: 'interjection', level: 'basic', example_sentence: null,
      image_url: null, sort_order: 1, created_at: '2026-01-01T00:00:00Z',
    };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [fakeRow], error: null }),
        }),
      }),
    } as any);

    const result = await getCardsBySet('set-1');
    expect(result).toHaveLength(1);
    expect(result[0].englishWord).toBe('Hello');
  });
});

describe('getProgressByCards', () => {
  it('returns empty array when cardIds is empty', async () => {
    const result = await getProgressByCards([], 'user-1');
    expect(result).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns mapped CardProgress array', async () => {
    const fakeRow = {
      flashcard_id: 'card-1', status: 'known' as const,
      last_studied_at: null, user_id: 'user-1', created_at: '2026-01-01T00:00:00Z',
    };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: [fakeRow], error: null }),
        }),
      }),
    } as any);

    const result = await getProgressByCards(['card-1'], 'user-1');
    expect(result[0].status).toBe('known');
  });
});

describe('upsertCardProgress', () => {
  it('calls upsert with the correct payload', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert } as any);

    await upsertCardProgress('user-1', 'card-1', 'known');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', flashcard_id: 'card-1', status: 'known' }),
      { onConflict: 'user_id,flashcard_id' },
    );
  });

  it('throws when Supabase returns an error', async () => {
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: { message: 'Upsert failed' } }),
    } as any);
    await expect(upsertCardProgress('user-1', 'card-1', 'known')).rejects.toThrow('Upsert failed');
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test -- src/features/flashcards/__tests__/api.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create `api/flashcards.ts`**

```ts
// src/features/flashcards/api/flashcards.ts
import { supabase } from '@/lib/supabase';
import { mapSet, mapCard, mapProgress, type FlashcardSet, type FlashcardCard, type CardProgress } from '../types';

export async function getVisibleSets(): Promise<FlashcardSet[]> {
  const { data, error } = await supabase
    .from('flashcard_sets')
    .select('*, flashcards(count)');

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapSet);
}

// userId must be provided by the caller (from useUserStore.profile.id).
// Do NOT call supabase.auth.getUser() here — it makes an extra network request
// and its result is not guaranteed to be non-null even when the user is authenticated.
export async function createSet(
  title: string,
  description: string | null,
  userId: string,
): Promise<FlashcardSet> {
  const { data, error } = await supabase
    .from('flashcard_sets')
    .insert({ title, description, created_by: userId })
    .select('*, flashcards(count)')
    .single();

  if (error) throw new Error(error.message);
  return mapSet(data);
}

export async function getCardsBySet(setId: string): Promise<FlashcardCard[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('set_id', setId)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCard);
}

export async function getProgressByCards(
  cardIds: string[],
  userId: string,
): Promise<CardProgress[]> {
  if (cardIds.length === 0) return [];

  const { data, error } = await supabase
    .from('user_card_progress')
    .select('*')
    .eq('user_id', userId)
    .in('flashcard_id', cardIds);

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProgress);
}

export async function upsertCardProgress(
  userId: string,
  flashcardId: string,
  status: 'known' | 'unknown',
): Promise<void> {
  const { error } = await supabase
    .from('user_card_progress')
    .upsert(
      { user_id: userId, flashcard_id: flashcardId, status, last_studied_at: new Date().toISOString() },
      { onConflict: 'user_id,flashcard_id' },
    );

  if (error) throw new Error(error.message);
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- src/features/flashcards/__tests__/api.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/flashcards/api/flashcards.ts src/features/flashcards/__tests__/api.test.ts
git commit -m "feat: add flashcard API layer"
```

---

## Task 4: Update `useFlashcardNavigation` — add `resetKey`

**Files:**
- Modify: `src/features/flashcards/useFlashcardNavigation.ts`
- Create: `src/features/flashcards/__tests__/useFlashcardNavigation.test.ts`

The hook must reset the card index when `resetKey` changes, even if `cardCount` stays the same (e.g. two sets both have 9 cards).

- [ ] **Step 1: Write failing test**

```ts
// src/features/flashcards/__tests__/useFlashcardNavigation.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFlashcardNavigation } from '../useFlashcardNavigation';

describe('useFlashcardNavigation', () => {
  it('starts at index 0', () => {
    const { result } = renderHook(() => useFlashcardNavigation(5, 'set-a'));
    expect(result.current.currentCardIndex).toBe(0);
  });

  it('advances and wraps on goToNext', () => {
    const { result } = renderHook(() => useFlashcardNavigation(3, 'set-a'));
    act(() => result.current.goToNext());
    expect(result.current.currentCardIndex).toBe(1);
    act(() => result.current.goToNext());
    act(() => result.current.goToNext());
    // wrapped back to 0
    expect(result.current.currentCardIndex).toBe(0);
  });

  it('resets to 0 when resetKey changes even if cardCount stays the same', () => {
    let setId = 'set-a';
    const { result, rerender } = renderHook(() => useFlashcardNavigation(9, setId));
    act(() => result.current.goToNext());
    act(() => result.current.goToNext());
    expect(result.current.currentCardIndex).toBe(2);

    setId = 'set-b';
    rerender();
    expect(result.current.currentCardIndex).toBe(0);
  });
});
```

- [ ] **Step 2: Run test — verify the resetKey test fails**

```bash
npm test -- src/features/flashcards/__tests__/useFlashcardNavigation.test.ts
```
Expected: the `resetKey` test FAILS (other two may pass).

- [ ] **Step 3: Update the hook to accept `resetKey`**

```ts
// src/features/flashcards/useFlashcardNavigation.ts
import { useState, useEffect, useCallback } from "react";

// resetKey defaults to '' for backward compatibility with any existing callers.
// Pass setId to guarantee index reset when switching between same-size sets.
export function useFlashcardNavigation(cardCount: number, resetKey: string = '') {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Reset when either cardCount or resetKey changes
  useEffect(() => {
    setCurrentCardIndex(0);
  }, [cardCount, resetKey]);

  const goToPrevious = useCallback(() => {
    if (cardCount === 0) return;
    setCurrentCardIndex((prev) => (prev === 0 ? cardCount - 1 : prev - 1));
  }, [cardCount]);

  const goToNext = useCallback(() => {
    if (cardCount === 0) return;
    setCurrentCardIndex((prev) => (prev === cardCount - 1 ? 0 : prev + 1));
  }, [cardCount]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      else if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext]);

  const safeIndex = cardCount === 0 ? 0 : Math.min(currentCardIndex, cardCount - 1);

  return { currentCardIndex: safeIndex, setCurrentCardIndex, goToPrevious, goToNext };
}
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npm test -- src/features/flashcards/__tests__/useFlashcardNavigation.test.ts
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/flashcards/useFlashcardNavigation.ts src/features/flashcards/__tests__/useFlashcardNavigation.test.ts
git commit -m "feat: add resetKey to useFlashcardNavigation to fix same-size set switch"
```

---

## Task 5: `useFlashcardSets` hook

**Files:**
- Create: `src/features/flashcards/hooks/useFlashcardSets.ts`
- Create: `src/features/flashcards/__tests__/useFlashcardSets.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/features/flashcards/__tests__/useFlashcardSets.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../api/flashcards', () => ({
  getVisibleSets: vi.fn(),
  createSet: vi.fn(),
}));

import { getVisibleSets, createSet } from '../api/flashcards';
import { useFlashcardSets } from '../hooks/useFlashcardSets';

const mockGetVisibleSets = vi.mocked(getVisibleSets);
const mockCreateSet = vi.mocked(createSet);

beforeEach(() => vi.clearAllMocks());

const fakeSet = {
  id: 'set-1', title: 'Thai Set', description: null,
  isPublic: true, createdBy: null, createdAt: '2026-01-01T00:00:00Z', cardCount: 3,
};

describe('useFlashcardSets', () => {
  it('returns sets after loading', async () => {
    mockGetVisibleSets.mockResolvedValue([fakeSet]);
    const { result } = renderHook(() => useFlashcardSets());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.sets).toHaveLength(1);
    expect(result.current.sets[0].title).toBe('Thai Set');
    expect(result.current.error).toBeNull();
  });

  it('sets error when API throws', async () => {
    mockGetVisibleSets.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useFlashcardSets());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Network error');
    expect(result.current.sets).toEqual([]);
  });

  it('createSet passes userId and refetches after success', async () => {
    mockGetVisibleSets.mockResolvedValue([fakeSet]);
    mockCreateSet.mockResolvedValue({ ...fakeSet, id: 'set-2', title: 'My Set' });
    const { result } = renderHook(() => useFlashcardSets('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockGetVisibleSets.mockResolvedValue([fakeSet, { ...fakeSet, id: 'set-2', title: 'My Set' }]);
    await result.current.createSet('My Set', null);
    expect(mockCreateSet).toHaveBeenCalledWith('My Set', null, 'user-1');
    await waitFor(() => expect(result.current.sets).toHaveLength(2));
  });

  it('createSet throws when userId is not provided', async () => {
    mockGetVisibleSets.mockResolvedValue([]);
    const { result } = renderHook(() => useFlashcardSets(undefined));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await expect(result.current.createSet('My Set', null)).rejects.toThrow('Must be authenticated');
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test -- src/features/flashcards/__tests__/useFlashcardSets.test.ts
```

- [ ] **Step 3: Implement the hook**

```ts
// src/features/flashcards/hooks/useFlashcardSets.ts
import { useState, useEffect, useCallback } from 'react';
import { getVisibleSets, createSet as apiCreateSet } from '../api/flashcards';
import type { FlashcardSet } from '../types';

export function useFlashcardSets(userId?: string) {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVisibleSets();
      setSets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sets');
      setSets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSets(); }, [fetchSets]);

  const createSet = useCallback(async (title: string, description: string | null) => {
    if (!userId) throw new Error('Must be authenticated to create a set');
    await apiCreateSet(title, description, userId);
    await fetchSets();
  }, [fetchSets, userId]);

  return { sets, loading, error, createSet };
}
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npm test -- src/features/flashcards/__tests__/useFlashcardSets.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/features/flashcards/hooks/useFlashcardSets.ts src/features/flashcards/__tests__/useFlashcardSets.test.ts
git commit -m "feat: add useFlashcardSets hook"
```

---

## Task 6: `useFlashcards` hook

**Files:**
- Create: `src/features/flashcards/hooks/useFlashcards.ts`
- Create: `src/features/flashcards/__tests__/useFlashcards.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/features/flashcards/__tests__/useFlashcards.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../api/flashcards', () => ({ getCardsBySet: vi.fn() }));
import { getCardsBySet } from '../api/flashcards';
import { useFlashcards } from '../hooks/useFlashcards';

const mockGet = vi.mocked(getCardsBySet);
beforeEach(() => vi.clearAllMocks());

const fakeCard = {
  id: 'c1', setId: 's1', nativeWord: 'สวัสดี', englishWord: 'Hello',
  partOfSpeech: null, level: 'basic' as const, exampleSentence: null,
  imageUrl: null, sortOrder: 1,
};

describe('useFlashcards', () => {
  it('returns empty cards when setId is null', () => {
    const { result } = renderHook(() => useFlashcards(null));
    expect(result.current.cards).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('fetches cards when setId is provided', async () => {
    mockGet.mockResolvedValue([fakeCard]);
    const { result } = renderHook(() => useFlashcards('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cards).toHaveLength(1);
    expect(result.current.cards[0].englishWord).toBe('Hello');
  });

  it('refetches when setId changes', async () => {
    mockGet.mockResolvedValue([fakeCard]);
    let setId: string | null = 's1';
    const { result, rerender } = renderHook(() => useFlashcards(setId));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGet).toHaveBeenCalledWith('s1');

    const fakeCard2 = { ...fakeCard, id: 'c2', setId: 's2', englishWord: 'Water' };
    mockGet.mockResolvedValue([fakeCard2]);
    setId = 's2';
    rerender();
    await waitFor(() => expect(result.current.cards[0].englishWord).toBe('Water'));
    expect(mockGet).toHaveBeenCalledWith('s2');
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test -- src/features/flashcards/__tests__/useFlashcards.test.ts
```

- [ ] **Step 3: Implement the hook**

```ts
// src/features/flashcards/hooks/useFlashcards.ts
import { useState, useEffect } from 'react';
import { getCardsBySet } from '../api/flashcards';
import type { FlashcardCard } from '../types';

export function useFlashcards(setId: string | null) {
  const [cards, setCards] = useState<FlashcardCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!setId) {
      setCards([]);
      return;
    }
    setLoading(true);
    setError(null);
    getCardsBySet(setId)
      .then(setCards)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load cards'))
      .finally(() => setLoading(false));
  }, [setId]);

  return { cards, loading, error };
}
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npm test -- src/features/flashcards/__tests__/useFlashcards.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/features/flashcards/hooks/useFlashcards.ts src/features/flashcards/__tests__/useFlashcards.test.ts
git commit -m "feat: add useFlashcards hook"
```

---

## Task 7: `useCardProgress` hook

**Files:**
- Create: `src/features/flashcards/hooks/useCardProgress.ts`
- Create: `src/features/flashcards/__tests__/useCardProgress.test.ts`

Memoises `cardIds` internally by JSON-stringifying. No-ops for guests.

- [ ] **Step 1: Write failing test**

```ts
// src/features/flashcards/__tests__/useCardProgress.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

vi.mock('../api/flashcards', () => ({
  getProgressByCards: vi.fn(),
  upsertCardProgress: vi.fn(),
}));

import { getProgressByCards, upsertCardProgress } from '../api/flashcards';
import { useCardProgress } from '../hooks/useCardProgress';

const mockGet = vi.mocked(getProgressByCards);
const mockUpsert = vi.mocked(upsertCardProgress);

beforeEach(() => vi.clearAllMocks());

describe('useCardProgress', () => {
  it('returns empty progressMap for guest (no userId)', async () => {
    const { result } = renderHook(() => useCardProgress(['c1', 'c2'], undefined));
    expect(result.current.progressMap).toEqual({});
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('returns empty progressMap when cardIds is empty', async () => {
    const { result } = renderHook(() => useCardProgress([], 'user-1'));
    expect(result.current.progressMap).toEqual({});
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('fetches and indexes progress by flashcardId', async () => {
    mockGet.mockResolvedValue([
      { flashcardId: 'c1', status: 'known', lastStudiedAt: null },
    ]);
    const { result } = renderHook(() => useCardProgress(['c1', 'c2'], 'user-1'));
    await waitFor(() => expect(result.current.progressMap['c1']).toBeDefined());
    expect(result.current.progressMap['c1'].status).toBe('known');
    expect(result.current.progressMap['c2']).toBeUndefined();
  });

  it('markKnown calls upsert and updates progressMap optimistically', async () => {
    mockGet.mockResolvedValue([]);
    mockUpsert.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCardProgress(['c1'], 'user-1'));
    await waitFor(() => expect(mockGet).toHaveBeenCalled());

    await act(async () => { result.current.markKnown('c1'); });
    expect(mockUpsert).toHaveBeenCalledWith('user-1', 'c1', 'known');
    expect(result.current.progressMap['c1'].status).toBe('known');
  });

  it('markKnown is a no-op for guests', async () => {
    const { result } = renderHook(() => useCardProgress(['c1'], undefined));
    await act(async () => { result.current.markKnown('c1'); });
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test -- src/features/flashcards/__tests__/useCardProgress.test.ts
```

- [ ] **Step 3: Implement the hook**

```ts
// src/features/flashcards/hooks/useCardProgress.ts
import { useState, useEffect, useCallback } from 'react';
import { getProgressByCards, upsertCardProgress } from '../api/flashcards';
import type { CardProgress } from '../types';

export function useCardProgress(
  cardIds: string[],
  userId: string | undefined,
) {
  const [progressMap, setProgressMap] = useState<Record<string, CardProgress>>({});
  // Serialise ids so the effect only re-runs when the actual id values change,
  // not on every render due to a new array reference.
  const idsKey = JSON.stringify([...cardIds].sort());

  useEffect(() => {
    if (!userId || cardIds.length === 0) {
      setProgressMap({});
      return;
    }
    getProgressByCards(cardIds, userId).then((rows) => {
      const map: Record<string, CardProgress> = {};
      rows.forEach((p) => { map[p.flashcardId] = p; });
      setProgressMap(map);
    });
    // idsKey captures all card ids; eslint wants cardIds in deps but that
    // would re-run on every render. idsKey is the correct stable dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, userId]);

  const markKnown = useCallback((cardId: string) => {
    if (!userId) return;
    const entry: CardProgress = { flashcardId: cardId, status: 'known', lastStudiedAt: new Date().toISOString() };
    setProgressMap((prev) => ({ ...prev, [cardId]: entry }));
    upsertCardProgress(userId, cardId, 'known').catch(console.error);
  }, [userId]);

  const markUnknown = useCallback((cardId: string) => {
    if (!userId) return;
    const entry: CardProgress = { flashcardId: cardId, status: 'unknown', lastStudiedAt: new Date().toISOString() };
    setProgressMap((prev) => ({ ...prev, [cardId]: entry }));
    upsertCardProgress(userId, cardId, 'unknown').catch(console.error);
  }, [userId]);

  return { progressMap, markKnown, markUnknown };
}
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npm test -- src/features/flashcards/__tests__/useCardProgress.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/features/flashcards/hooks/useCardProgress.ts src/features/flashcards/__tests__/useCardProgress.test.ts
git commit -m "feat: add useCardProgress hook with optimistic updates"
```

---

## Task 8: Rewrite `FlashcardViewer` (move + make dumb)

**Files:**
- Create: `src/features/flashcards/components/FlashcardViewer.tsx` (new location)
- Old file `src/components/flashcards/FlashcardViewer.tsx` is replaced — keep it in place for now and delete in Task 11

- [ ] **Step 1: Create the new `FlashcardViewer`**

```tsx
// src/features/flashcards/components/FlashcardViewer.tsx
import { Flashcard } from '@/components/flashcards/Flashcard';
import Button from '@/components/ui/Button';
import { useFlashcardNavigation } from '../useFlashcardNavigation';
import type { FlashcardCard, CardProgress } from '../types';

interface FlashcardViewerProps {
  setId: string;
  cards: FlashcardCard[];
  progressMap: Record<string, CardProgress>;
  onMarkKnown: (cardId: string) => void;
  onMarkUnknown: (cardId: string) => void;
  onBack: () => void;
  isAuthenticated: boolean;
}

export function FlashcardViewer({
  setId,
  cards,
  progressMap,
  onMarkKnown,
  onMarkUnknown,
  onBack,
  isAuthenticated,
}: FlashcardViewerProps) {
  const { currentCardIndex, setCurrentCardIndex, goToPrevious, goToNext } =
    useFlashcardNavigation(cards.length, setId);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-primary-600">No cards in this set yet.</p>
        <Button variant="secondary" size="sm" onClick={onBack} className="mt-4">
          ← Back to sets
        </Button>
      </div>
    );
  }

  const currentCard = cards[currentCardIndex];
  const progress = progressMap[currentCard.id];

  const handleMarkKnown = () => {
    onMarkKnown(currentCard.id);
    goToNext();
  };

  const handleMarkUnknown = () => {
    onMarkUnknown(currentCard.id);
    goToNext();
  };

  return (
    <div className="flex flex-col items-center space-y-6 py-8">
      <div className="flex items-center justify-between w-full max-w-3xl">
        <Button variant="secondary" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <div className="text-sm text-primary-600 font-medium">
          Card {currentCardIndex + 1} of {cards.length}
          {progress && (
            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
              progress.status === 'known'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {progress.status}
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <Flashcard data={currentCard} />
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="secondary" size="sm" onClick={goToPrevious} className="px-4 py-2">
          ← Previous
        </Button>

        <div className="flex space-x-1">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentCardIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentCardIndex
                  ? 'bg-primary-500'
                  : 'bg-primary-200 hover:bg-primary-300'
              }`}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>

        <Button variant="secondary" size="sm" onClick={goToNext} className="px-4 py-2">
          Next →
        </Button>
      </div>

      {isAuthenticated && (
        <div className="flex space-x-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkUnknown}
            className="px-6 py-2 border-red-300 text-red-700 hover:bg-red-50"
          >
            Still learning
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleMarkKnown}
            className="px-6 py-2"
          >
            I know this
          </Button>
        </div>
      )}

      <p className="text-xs text-primary-500 text-center">
        Use ← → arrow keys to navigate
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

```bash
npm run type-check 2>&1
```
Expected: only the pre-existing errors (ErrorBoundary, WelcomePanel, features/auth/utils.ts, ActionBarProps). No new errors from `FlashcardViewer.tsx` or `useFlashcardNavigation.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/features/flashcards/components/FlashcardViewer.tsx
git commit -m "feat: add new dumb FlashcardViewer component"
```

---

## Task 9: `FlashcardSetList` and `CreateSetModal`

**Files:**
- Create: `src/features/flashcards/components/FlashcardSetList.tsx`
- Create: `src/features/flashcards/components/CreateSetModal.tsx`

- [ ] **Step 1: Create `FlashcardSetList`**

```tsx
// src/features/flashcards/components/FlashcardSetList.tsx
import type { FlashcardSet } from '../types';
import Button from '@/components/ui/Button';

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
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-primary-600">Loading sets…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-red-600">Failed to load sets: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-primary-800 dark:text-primary-200">
          Flashcard Sets
        </h2>
        {isAuthenticated && (
          <Button variant="primary" size="sm" onClick={onCreateSet}>
            + Create set
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sets.map((set) => (
          <button
            key={set.id}
            onClick={() => onSelectSet(set.id)}
            className="text-left p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {set.title}
            </h3>
            {set.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {set.description}
              </p>
            )}
            <p className="text-xs text-primary-600 font-medium">
              {set.cardCount} {set.cardCount === 1 ? 'card' : 'cards'}
            </p>
          </button>
        ))}
      </div>

      {sets.length === 0 && (
        <p className="text-center text-primary-600 py-12">
          No sets available yet.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `CreateSetModal`**

```tsx
// src/features/flashcards/components/CreateSetModal.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or fewer'),
  description: z.string().max(300, 'Description must be 300 characters or fewer').optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateSetModalProps {
  onClose: () => void;
  onSubmit: (title: string, description: string | null) => Promise<void>;
}

export function CreateSetModal({ onClose, onSubmit }: CreateSetModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const submit = async (data: FormData) => {
    try {
      await onSubmit(data.title, data.description ?? null);
      onClose();
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Failed to create set',
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Create flashcard set
        </h2>

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-gray-100"
              placeholder="e.g. Business English"
            />
            {errors.title && (
              <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-gray-100 resize-none"
              placeholder="Optional description"
            />
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          {errors.root && (
            <p className="text-xs text-red-600">{errors.root.message}</p>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create set'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify type-check**

```bash
npm run type-check 2>&1 | grep -E "FlashcardSetList|CreateSetModal"
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/flashcards/components/FlashcardSetList.tsx src/features/flashcards/components/CreateSetModal.tsx
git commit -m "feat: add FlashcardSetList and CreateSetModal components"
```

---

## Task 10: Rewrite `FlashcardsPage` as thin orchestrator

**Files:**
- Modify: `src/pages/FlashcardsPage.tsx`
- Modify: `src/components/flashcards/Flashcard.tsx` (update prop type to `FlashcardCard`)

The user's auth state comes from `useUserStore` — `profile?.id` is the userId.

- [ ] **Step 1: Update `Flashcard.tsx` prop type to accept `FlashcardCard`**

`FlashcardCard` has `nativeWord`, `englishWord`, `partOfSpeech`, `level`, `exampleSentence` — a superset of what `Flashcard` already destructures. Replace the import and interface at the top of the file:

In `src/components/flashcards/Flashcard.tsx`, change:
```ts
// Before
import { Flashcard as FlashcardData } from "@/types/flashcard";
export interface FlashcardProps {
  data: FlashcardData;
}
```
To:
```ts
// After
import type { FlashcardCard } from "@/features/flashcards/types";
export interface FlashcardProps {
  data: FlashcardCard;
}
```
The body of the component is unchanged — all the destructured fields exist on `FlashcardCard`.

- [ ] **Step 2: Rewrite `FlashcardsPage.tsx`**

```tsx
// src/pages/FlashcardsPage.tsx
import { useState } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { useFlashcardSets } from '@/features/flashcards/hooks/useFlashcardSets';
import { useFlashcards } from '@/features/flashcards/hooks/useFlashcards';
import { useCardProgress } from '@/features/flashcards/hooks/useCardProgress';
import { FlashcardSetList } from '@/features/flashcards/components/FlashcardSetList';
import { FlashcardViewer } from '@/features/flashcards/components/FlashcardViewer';
import { CreateSetModal } from '@/features/flashcards/components/CreateSetModal';

export default function FlashcardsPage() {
  const { profile } = useUserStore();
  const isAuthenticated = profile !== null;

  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { sets, loading: setsLoading, error: setsError, createSet } = useFlashcardSets(profile?.id);
  const { cards, loading: cardsLoading } = useFlashcards(selectedSetId);
  const { progressMap, markKnown, markUnknown } = useCardProgress(
    cards.map((c) => c.id),
    profile?.id,
  );

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {selectedSetId === null ? (
          <FlashcardSetList
            sets={sets}
            loading={setsLoading}
            error={setsError}
            isAuthenticated={isAuthenticated}
            onSelectSet={setSelectedSetId}
            onCreateSet={() => setIsCreateModalOpen(true)}
          />
        ) : cardsLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-primary-600">Loading cards…</p>
          </div>
        ) : (
          <FlashcardViewer
            setId={selectedSetId}
            cards={cards}
            progressMap={progressMap}
            onMarkKnown={markKnown}
            onMarkUnknown={markUnknown}
            onBack={() => setSelectedSetId(null)}
            isAuthenticated={isAuthenticated}
          />
        )}

        {isCreateModalOpen && (
          <CreateSetModal
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={createSet}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run type-check — verify no new errors**

```bash
npm run type-check 2>&1
```
Expected: only the pre-existing errors (unused imports in ErrorBoundary, WelcomePanel, features/auth/utils.ts, ActionBarProps mismatch). No new errors from our files.

- [ ] **Step 4: Commit**

```bash
git add src/pages/FlashcardsPage.tsx src/components/flashcards/Flashcard.tsx
git commit -m "feat: wire FlashcardsPage to real DB via hooks"
```

---

## Task 11: Cleanup — delete dead files, remove dead routes

**Files:**
- Delete: `src/pages/FlashcardTest.tsx`
- Delete: `src/lib/api/flashcards.ts`
- Delete: `src/mocks/mockFlashcardData.ts`
- Delete: `src/components/flashcards/FlashcardViewer.tsx` (old location, replaced in Task 8)
- Delete: `src/components/flashcards/DifficultySelector.tsx`
- Modify: `src/App.tsx` — remove FlashcardTest import and route

- [ ] **Step 1: Confirm no live imports of files being deleted**

```bash
git grep -n "FlashcardTest\|mockFlashcardData\|lib/api/flashcards\|components/flashcards/FlashcardViewer\|DifficultySelector\|types/flashcard" -- "*.ts" "*.tsx"
```

Files still importing old `FlashcardViewer`:
- `src/pages/FlashcardsPage.tsx` — already rewritten in Task 10 (should not import it)
- `src/App.tsx` — check if it imports FlashcardViewer (unlikely)

If any unexpected import shows up, fix it before deleting.

- [ ] **Step 2: Remove FlashcardTest from `App.tsx`**

In `src/App.tsx`, remove the line:
```ts
const FlashcardTest = lazy(() => import("./pages/FlashcardTest"));
```
And remove the route:
```tsx
<Route path="/flashcard-test" element={<FlashcardTest />} />
```

- [ ] **Step 3: Delete the dead files**

```bash
git rm src/pages/FlashcardTest.tsx \
       src/lib/api/flashcards.ts \
       src/mocks/mockFlashcardData.ts \
       src/types/flashcard.ts \
       src/components/flashcards/FlashcardViewer.tsx \
       src/components/flashcards/DifficultySelector.tsx
```

- [ ] **Step 4: Final type-check — verify clean**

```bash
npm run type-check 2>&1
```
Expected: only the pre-existing unrelated errors remain. No errors from any file touched in this feature.

- [ ] **Step 5: Run all tests**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "chore: remove dead flashcard files and FlashcardTest route"
```

---

## Task 12: Final smoke test and branch completion

- [ ] **Step 1: Start the dev server and verify manually**

```bash
npm run dev
```

Check:
1. `/flashcards` shows the set picker with "English Essentials (Thai)" and "English Essentials (Chinese)"
2. Clicking a set shows cards (Hello, Water, Food…) — English word on back, Thai/Chinese on front
3. Guest user: no "Create set" button, no known/unknown buttons
4. Logged-in user: "Create set" button visible, known/unknown buttons shown while studying
5. Creating a set: modal opens, submitting creates the set and it appears in the list
6. Keyboard navigation (← →) works within a set
7. Switching between two 9-card sets resets to card 1 (tests the resetKey fix)

- [ ] **Step 2: Use the finishing-a-development-branch skill**

```
superpowers:finishing-a-development-branch
```
