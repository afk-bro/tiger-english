import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useActiveTutorSession } from '../useActiveTutorSession';
import { tutorAPI } from '@/features/ai-tutor/api/tutor';

vi.mock('@/features/ai-tutor/api/tutor', () => ({
  tutorAPI: { getActiveSession: vi.fn() },
}));

const mockedGet = tutorAPI.getActiveSession as ReturnType<typeof vi.fn>;

describe('useActiveTutorSession', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('starts in loading state, then resolves to data', async () => {
    const session = {
      session_id: 's1',
      scenario_slug: 'meeting-someone-new',
      scenario_title_en: 'Meeting someone new',
      scenario_title_vi: 'Gặp người mới',
      last_activity_at: '2026-05-12T12:00:00Z',
      tasks_done: 2,
      tasks_total: 4,
    };
    mockedGet.mockResolvedValueOnce(session);

    const { result } = renderHook(() => useActiveTutorSession());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(session);
    expect(result.current.error).toBeNull();
  });

  it('resolves to null when no active session exists', async () => {
    mockedGet.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useActiveTutorSession());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('captures error and clears loading', async () => {
    const err = new Error('boom');
    mockedGet.mockRejectedValueOnce(err);

    const { result } = renderHook(() => useActiveTutorSession());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(err);
  });
});
