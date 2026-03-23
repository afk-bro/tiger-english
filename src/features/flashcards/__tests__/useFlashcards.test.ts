import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../api/flashcards', () => ({ getCardsBySet: vi.fn() }));
import { getCardsBySet } from '../api/flashcards';
import { useFlashcards } from '../hooks/useFlashcards';

const mockGet = vi.mocked(getCardsBySet);
beforeEach(() => vi.clearAllMocks());

const fakeCard = {
  id: 'c1', setId: 's1', nativeText: 'สวัสดี', nativeAudioUrl: null,
  englishText: 'Hello', partOfSpeech: null, level: 'basic' as const,
  category: null, exampleSentence: null, imageUrl: null, englishAudioUrl: null,
  notes: null, isPhrase: false, sortOrder: 1,
};

describe('useFlashcards', () => {
  it('returns empty cards when setId is null', () => {
    const { result } = renderHook(() => useFlashcards(null, 'th'));
    expect(result.current.cards).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('returns empty cards when languageCode is null', () => {
    const { result } = renderHook(() => useFlashcards('s1', null));
    expect(result.current.cards).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('fetches cards when both setId and languageCode are provided', async () => {
    mockGet.mockResolvedValue([fakeCard]);
    const { result } = renderHook(() => useFlashcards('s1', 'th'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cards).toHaveLength(1);
    expect(mockGet).toHaveBeenCalledWith('s1', 'th');
  });

  it('refetches when setId changes', async () => {
    mockGet.mockResolvedValue([fakeCard]);
    let setId: string | null = 's1';
    const { result, rerender } = renderHook(() => useFlashcards(setId, 'th'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const fakeCard2 = { ...fakeCard, id: 'c2', setId: 's2', englishText: 'Water' };
    mockGet.mockResolvedValue([fakeCard2]);
    setId = 's2';
    rerender();
    await waitFor(() => expect(result.current.cards[0].englishText).toBe('Water'));
  });

  it('resets state when setId changes to null', async () => {
    mockGet.mockRejectedValue(new Error('oops'));
    let setId: string | null = 's1';
    const { result, rerender } = renderHook(() => useFlashcards(setId, 'th'));
    await waitFor(() => expect(result.current.error).toBe('oops'));

    setId = null;
    rerender();
    expect(result.current.cards).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('resets state when languageCode changes to null', async () => {
    mockGet.mockResolvedValue([fakeCard]);
    let lang: string | null = 'th';
    const { result, rerender } = renderHook(() => useFlashcards('s1', lang));
    await waitFor(() => expect(result.current.loading).toBe(false));

    lang = null;
    rerender();
    expect(result.current.cards).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('ignores stale response when setId changes rapidly', async () => {
    let resolveStale!: (cards: typeof fakeCard[]) => void;
    const firstPromise = new Promise<typeof fakeCard[]>((res) => { resolveStale = res; });
    const freshCard = { ...fakeCard, id: 'c2', setId: 's2', englishText: 'Fresh' };

    mockGet
      .mockImplementationOnce(() => firstPromise)
      .mockResolvedValueOnce([freshCard]);

    let setId: string | null = 's1';
    const { result, rerender } = renderHook(() => useFlashcards(setId, 'th'));

    setId = 's2';
    rerender();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cards[0].englishText).toBe('Fresh');

    resolveStale([{ ...fakeCard, englishText: 'STALE' }]);
    expect(result.current.cards[0].englishText).toBe('Fresh');
  });
});
