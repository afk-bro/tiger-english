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
  id: 'set-1',
  title: 'Thai Set',
  description: null,
  isPublic: true,
  createdBy: null,
  createdAt: '2026-01-01T00:00:00Z',
  cardCount: 3,
  slug: 'thai-set',
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
