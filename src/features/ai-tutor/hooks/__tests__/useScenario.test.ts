import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useScenario } from '../useScenario';
import { tutorAPI } from '../../api/tutor';
import type { TutorScenarioDetail } from '../../types';

vi.mock('../../api/tutor', () => ({
  tutorAPI: {
    getScenario: vi.fn(),
    startSession: vi.fn(),
    submitTurn: vi.fn(),
    finishSession: vi.fn(),
    abandonSession: vi.fn(),
    listScenarios: vi.fn(),
    getSession: vi.fn(),
  },
}));

const mockScenario: TutorScenarioDetail = {
  id: 'scn-1',
  slug: 'ordering-coffee',
  mode: 'course',
  level: 'A1',
  title_en: 'Ordering coffee',
  title_vi: 'Gọi cà phê',
  description_en: null,
  description_vi: null,
  goal_en: null,
  goal_vi: null,
  ai_persona: null,
  opening_line_en: 'Hi! What can I get you?',
  opening_audio_url: null,
  is_free: true,
  tasks: [],
  phrases: [],
  existing_active_session_id: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useScenario', () => {
  it('loads and sets the scenario on mount (happy path)', async () => {
    (tutorAPI.getScenario as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockScenario,
    );

    const { result } = renderHook(() => useScenario('ordering-coffee'));

    // Initial state: isLoading=true while slug is non-empty
    expect(result.current.isLoading).toBe(true);
    expect(result.current.scenario).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.scenario).toEqual(mockScenario);
    expect(result.current.error).toBeNull();
    expect(tutorAPI.getScenario).toHaveBeenCalledWith('ordering-coffee');
  });

  it('sets error and clears scenario on fetch failure', async () => {
    const failure = new Error('boom');
    (tutorAPI.getScenario as ReturnType<typeof vi.fn>).mockRejectedValue(
      failure,
    );

    const { result } = renderHook(() => useScenario('ordering-coffee'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe(failure);
    expect(result.current.scenario).toBeNull();
  });

  it('is a no-op for undefined slug', async () => {
    const { result } = renderHook(() => useScenario(undefined));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.scenario).toBeNull();
    expect(result.current.error).toBeNull();
    expect(tutorAPI.getScenario).not.toHaveBeenCalled();
  });

  it('refetch() reissues the request', async () => {
    (tutorAPI.getScenario as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockScenario,
    );

    const { result } = renderHook(() => useScenario('ordering-coffee'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(tutorAPI.getScenario).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refetch();
    });
    expect(tutorAPI.getScenario).toHaveBeenCalledTimes(2);
  });
});
