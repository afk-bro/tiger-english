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
