import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../api/flashcards', () => ({ getCardsBySet: vi.fn() }));
import { getCardsBySet } from '../api/flashcards';
import { useFlashcards } from '../hooks/useFlashcards';

const mockGet = vi.mocked(getCardsBySet);
beforeEach(() => vi.clearAllMocks());

const fakeCard = {
  id: 'c1',
  setId: 's1',
  nativeWord: 'สวัสดี',
  englishWord: 'Hello',
  partOfSpeech: null,
  level: 'basic' as const,
  exampleSentence: null,
  imageUrl: null,
  sortOrder: 1,
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
