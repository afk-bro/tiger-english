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

    await act(async () => {
      result.current.markKnown('c1');
    });
    expect(mockUpsert).toHaveBeenCalledWith('user-1', 'c1', 'known');
    expect(result.current.progressMap['c1'].status).toBe('known');
  });

  it('markKnown is a no-op for guests', async () => {
    const { result } = renderHook(() => useCardProgress(['c1'], undefined));
    await act(async () => {
      result.current.markKnown('c1');
    });
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
