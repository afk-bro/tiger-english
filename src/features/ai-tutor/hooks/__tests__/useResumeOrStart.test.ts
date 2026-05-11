import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useResumeOrStart } from '../useResumeOrStart';
import { tutorAPI } from '../../api/tutor';
import type { TutorScenarioDetail, StartSessionResponse } from '../../types';

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

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  );
  return { ...actual, useNavigate: () => navigateMock };
});

const scenario: TutorScenarioDetail = {
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
  opening_line_en: 'Hi!',
  opening_audio_url: null,
  is_free: true,
  tasks: [],
  phrases: [],
  existing_active_session_id: 'existing-sess-99',
};

const startResp: StartSessionResponse = {
  session_id: 'new-sess-1',
  status: 'active',
  current_task_id: 'task-1',
  opening_turn: {
    id: 'turn-1',
    speaker: 'ai',
    text_en: 'Hi!',
    audio_url: null,
    correction: null,
    task_completed: false,
    created_at: new Date().toISOString(),
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useResumeOrStart', () => {
  it('surfaces existing_active_session_id from scenarioDetail', () => {
    const { result } = renderHook(() =>
      useResumeOrStart({ slug: 'ordering-coffee', scenarioDetail: scenario }),
    );
    expect(result.current.existingActiveSessionId).toBe('existing-sess-99');
  });

  it('returns null existing id when scenarioDetail is null', () => {
    const { result } = renderHook(() =>
      useResumeOrStart({ slug: 'ordering-coffee', scenarioDetail: null }),
    );
    expect(result.current.existingActiveSessionId).toBeNull();
  });

  it('startFresh calls startSession(slug, "fresh") and navigates with state', async () => {
    (tutorAPI.startSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      startResp,
    );

    const { result } = renderHook(() =>
      useResumeOrStart({ slug: 'ordering-coffee', scenarioDetail: scenario }),
    );

    await act(async () => {
      await result.current.startFresh();
    });

    expect(tutorAPI.startSession).toHaveBeenCalledWith(
      'ordering-coffee',
      'fresh',
    );
    expect(navigateMock).toHaveBeenCalledWith(
      '/ai-tutor/scenarios/ordering-coffee/session/new-sess-1',
      {
        state: {
          openingTurn: startResp.opening_turn,
          currentTaskId: 'task-1',
        },
      },
    );
    expect(result.current.isStarting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('startContinue calls startSession(slug, "continue") and navigates', async () => {
    (tutorAPI.startSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      startResp,
    );

    const { result } = renderHook(() =>
      useResumeOrStart({ slug: 'ordering-coffee', scenarioDetail: scenario }),
    );

    await act(async () => {
      await result.current.startContinue();
    });

    expect(tutorAPI.startSession).toHaveBeenCalledWith(
      'ordering-coffee',
      'continue',
    );
    expect(navigateMock).toHaveBeenCalledWith(
      '/ai-tutor/scenarios/ordering-coffee/session/new-sess-1',
      expect.objectContaining({
        state: expect.objectContaining({ currentTaskId: 'task-1' }),
      }),
    );
  });

  it('captures error and does not navigate on startSession failure', async () => {
    const failure = new Error('500');
    (tutorAPI.startSession as ReturnType<typeof vi.fn>).mockRejectedValue(
      failure,
    );

    const { result } = renderHook(() =>
      useResumeOrStart({ slug: 'ordering-coffee', scenarioDetail: scenario }),
    );

    await act(async () => {
      await result.current.startFresh();
    });

    await waitFor(() => expect(result.current.isStarting).toBe(false));
    expect(result.current.error).toBe(failure);
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
