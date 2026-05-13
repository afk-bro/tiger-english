import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useScenariosList } from '../useScenariosList';
import { tutorAPI } from '@/features/ai-tutor/api/tutor';

vi.mock('@/features/ai-tutor/api/tutor', () => ({
  tutorAPI: { listScenarios: vi.fn() },
}));

const mockedList = tutorAPI.listScenarios as ReturnType<typeof vi.fn>;

describe('useScenariosList', () => {
  beforeEach(() => mockedList.mockReset());

  it('returns data on success', async () => {
    const scenarios = [
      { slug: 'a', title_en: 'A', title_vi: 'A', level: 'a1', mode: 'course', is_free: true },
    ];
    mockedList.mockResolvedValueOnce(scenarios);

    const { result } = renderHook(() => useScenariosList());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(scenarios);
    expect(result.current.error).toBeNull();
  });

  it('captures error and clears loading', async () => {
    const err = new Error('net');
    mockedList.mockRejectedValueOnce(err);

    const { result } = renderHook(() => useScenariosList());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(err);
  });
});
