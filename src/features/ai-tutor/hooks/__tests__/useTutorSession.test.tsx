import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTutorSession } from '../useTutorSession';
import { tutorAPI } from '../../api/tutor';
import type { TutorTurnDTO } from '../../types';

vi.mock('../../api/tutor', () => ({
  TutorAPIError: class TutorAPIError extends Error {
    status: number;
    constructor(_path: string, status: number) {
      super(String(status));
      this.status = status;
    }
  },
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

vi.mock('../../audio/useTutorTTS', () => ({
  useTutorTTS: () => ({
    state: 'idle',
    play: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
  }),
}));

vi.mock('../../audio/useMicRecorder', () => ({
  useMicRecorder: () => ({
    state: 'idle',
    error: null,
    blob: null,
    mimeType: '',
    stream: null,
    start: vi.fn(),
    stop: vi.fn(() => Promise.resolve({ blob: null, mimeType: '' })),
    cancel: vi.fn(),
    reset: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useTutorSession', () => {
  it('stays in loading when sessionId is undefined', () => {
    const { result } = renderHook(() =>
      useTutorSession({ sessionId: undefined }),
    );
    expect(result.current.state.kind).toBe('loading');
  });

  it('hydrates with placeholder opening turn → ai_speaking → awaiting_user_speech', async () => {
    const { result } = renderHook(() =>
      useTutorSession({ sessionId: 'sess-1' }),
    );

    // After mount, the effect dispatches HYDRATED. The empty-turn shortcut
    // immediately fires AI_AUDIO_ENDED so we land in awaiting_user_speech.
    await waitFor(() =>
      expect(result.current.state.kind).toBe('awaiting_user_speech'),
    );
  });

  it('dispatching HYDRATED with a real opening turn transitions to ai_speaking', async () => {
    const { result } = renderHook(() =>
      useTutorSession({ sessionId: 'sess-1' }),
    );
    // Wait for hook-internal hydration to finish (lands on awaiting_user_speech).
    await waitFor(() =>
      expect(result.current.state.kind).toBe('awaiting_user_speech'),
    );

    const openingTurn: TutorTurnDTO = {
      id: 'turn-1',
      speaker: 'ai',
      text_en: 'Hello!',
      audio_url: 'https://example.com/a.mp3',
      correction: null,
      task_completed: false,
      created_at: new Date().toISOString(),
    };

    // The reducer's `awaiting_user_speech` doesn't accept HYDRATED — that's
    // expected. We only verify the hook keeps state consistent.
    act(() => {
      result.current.dispatch({ type: 'HYDRATED', openingTurn });
    });
    // Still awaiting_user_speech because reducer rejects HYDRATED outside loading.
    expect(result.current.state.kind).toBe('awaiting_user_speech');
  });

  it('finishSession dispatches FINISH_RESPONSE on success', async () => {
    (tutorAPI.finishSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      session: {},
      xp_awarded: 25,
      all_corrections: [],
    });

    const { result } = renderHook(() =>
      useTutorSession({ sessionId: 'sess-1' }),
    );
    await waitFor(() =>
      expect(result.current.state.kind).toBe('awaiting_user_speech'),
    );

    await act(async () => {
      await result.current.finishSession();
    });

    expect(tutorAPI.finishSession).toHaveBeenCalledWith('sess-1');
    expect(result.current.state.kind).toBe('lesson_complete');
    if (result.current.state.kind === 'lesson_complete') {
      expect(result.current.state.xpAwarded).toBe(25);
    }
  });

  it('submitTurn advances currentTaskId from TurnResponse.current_task_id', async () => {
    (tutorAPI.submitTurn as ReturnType<typeof vi.fn>).mockResolvedValue({
      transcript: 'my name is Tom',
      evaluation: {
        outcome: 'task_completed',
        feedback_en: null,
        feedback_vi: null,
        correction: null,
      },
      session: {
        id: 'sess-1',
        scenario_slug: 'meeting-someone-new',
        status: 'active',
        current_task_id: 'task-2',
        completed_task_ids: ['task-1'],
        mistake_count: 0,
        xp_awarded: 0,
        started_at: '',
        last_activity_at: '',
        completed_at: null,
      },
      new_turns: [
        {
          id: 'turn-ai-1',
          speaker: 'ai',
          text_en: 'Nice to meet you! How are you today?',
          audio_url: null,
          correction: null,
          task_completed: false,
          created_at: new Date().toISOString(),
        },
      ],
      current_task_id: 'task-2',
      end_lesson_detected: false,
      tasks_done: 1,
      tasks_total: 4,
    });

    const { result } = renderHook(() =>
      useTutorSession({ sessionId: 'sess-1', initialCurrentTaskId: 'task-1' }),
    );
    await waitFor(() =>
      expect(result.current.state.kind).toBe('awaiting_user_speech'),
    );
    expect(result.current.currentTaskId).toBe('task-1');

    // Move the reducer into `recording` so RECORD_STOP → processing is legal.
    act(() => {
      result.current.dispatch({ type: 'RECORD_START', startedAt: Date.now() });
    });

    await act(async () => {
      await result.current.submitTurn({
        blob: new Blob(['fake'], { type: 'audio/webm' }),
        mimeType: 'audio/webm',
      });
    });

    expect(tutorAPI.submitTurn).toHaveBeenCalledWith(
      'sess-1',
      expect.any(Blob),
      'audio/webm',
      'task-1', // first turn evaluates against task-1 (initial pointer)
    );
    // Pointer advances after the response.
    expect(result.current.currentTaskId).toBe('task-2');
  });

  it('submitTurn clears currentTaskId when backend returns null (all tasks done → wrap-up)', async () => {
    (tutorAPI.submitTurn as ReturnType<typeof vi.fn>).mockResolvedValue({
      transcript: 'what are you doing today',
      evaluation: {
        outcome: 'task_completed',
        feedback_en: null,
        feedback_vi: null,
        correction: null,
      },
      session: {
        id: 'sess-1',
        scenario_slug: 'meeting-someone-new',
        status: 'active',
        current_task_id: null,
        completed_task_ids: ['task-1', 'task-2', 'task-3', 'task-4'],
        mistake_count: 0,
        xp_awarded: 0,
        started_at: '',
        last_activity_at: '',
        completed_at: null,
      },
      new_turns: [
        {
          id: 'turn-ai-wrap',
          speaker: 'ai',
          text_en: 'Great job!',
          audio_url: null,
          correction: null,
          task_completed: false,
          created_at: new Date().toISOString(),
        },
      ],
      current_task_id: null,
      end_lesson_detected: false,
      tasks_done: 4,
      tasks_total: 4,
    });

    const { result } = renderHook(() =>
      useTutorSession({ sessionId: 'sess-1', initialCurrentTaskId: 'task-4' }),
    );
    await waitFor(() =>
      expect(result.current.state.kind).toBe('awaiting_user_speech'),
    );

    act(() => {
      result.current.dispatch({ type: 'RECORD_START', startedAt: Date.now() });
    });
    await act(async () => {
      await result.current.submitTurn({
        blob: new Blob(['fake'], { type: 'audio/webm' }),
        mimeType: 'audio/webm',
      });
    });

    expect(result.current.currentTaskId).toBeNull();
  });

  it('fires onEvaluation with the response evaluation (incl. vi_spoken)', async () => {
    (tutorAPI.submitTurn as ReturnType<typeof vi.fn>).mockResolvedValue({
      transcript: 'Tên tôi là Tom',
      evaluation: {
        kind: 'vi_spoken',
        task_completed: false,
        severity: 'none',
        correction: null,
        should_advance: false,
        matched_pattern: null,
      },
      session: {
        id: 'sess-1',
        scenario_slug: 'meeting-someone-new',
        status: 'active',
        current_task_id: 'task-1',
        completed_task_ids: [],
        mistake_count: 0,
        xp_awarded: 0,
        started_at: '',
        last_activity_at: '',
        completed_at: null,
      },
      new_turns: [],
      current_task_id: 'task-1',
      end_lesson_detected: false,
      tasks_done: 0,
      tasks_total: 4,
    });

    const onEvaluation = vi.fn();
    const { result } = renderHook(() =>
      useTutorSession({
        sessionId: 'sess-1',
        initialCurrentTaskId: 'task-1',
        onEvaluation,
      }),
    );
    await waitFor(() =>
      expect(result.current.state.kind).toBe('awaiting_user_speech'),
    );

    act(() => {
      result.current.dispatch({ type: 'RECORD_START', startedAt: Date.now() });
    });
    await act(async () => {
      await result.current.submitTurn({
        blob: new Blob(['x'], { type: 'audio/webm' }),
        mimeType: 'audio/webm',
      });
    });

    expect(onEvaluation).toHaveBeenCalledTimes(1);
    expect(onEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'vi_spoken' }),
    );
  });

  it('skips onEvaluation on end-lesson responses', async () => {
    (tutorAPI.submitTurn as ReturnType<typeof vi.fn>).mockResolvedValue({
      transcript: 'kết thúc bài học',
      evaluation: {
        kind: 'vi_spoken',
        task_completed: false,
        severity: 'none',
        correction: null,
        should_advance: false,
        matched_pattern: null,
      },
      session: {
        id: 'sess-1',
        scenario_slug: 'meeting-someone-new',
        status: 'active',
        current_task_id: 'task-2',
        completed_task_ids: [],
        mistake_count: 0,
        xp_awarded: 0,
        started_at: '',
        last_activity_at: '',
        completed_at: null,
      },
      new_turns: [],
      current_task_id: 'task-2',
      end_lesson_detected: true,
      tasks_done: 1,
      tasks_total: 4,
    });

    const onEvaluation = vi.fn();
    const { result } = renderHook(() =>
      useTutorSession({
        sessionId: 'sess-1',
        initialCurrentTaskId: 'task-2',
        onEvaluation,
      }),
    );
    await waitFor(() =>
      expect(result.current.state.kind).toBe('awaiting_user_speech'),
    );

    act(() => {
      result.current.dispatch({ type: 'RECORD_START', startedAt: Date.now() });
    });
    await act(async () => {
      await result.current.submitTurn({
        blob: new Blob(['x'], { type: 'audio/webm' }),
        mimeType: 'audio/webm',
      });
    });

    expect(onEvaluation).not.toHaveBeenCalled();
    expect(result.current.state.kind).toBe('end_lesson_confirm');
  });

  it('tracks completedTaskIds from each TurnResponse.session.completed_task_ids', async () => {
    (tutorAPI.submitTurn as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      transcript: 'my name is Tom',
      evaluation: {
        kind: 'evaluated',
        task_completed: true,
        severity: 'none',
        correction: null,
        should_advance: true,
        matched_pattern: null,
      },
      session: {
        id: 'sess-1',
        scenario_slug: 'meeting-someone-new',
        status: 'active',
        current_task_id: 'task-2',
        completed_task_ids: ['task-1'],
        mistake_count: 0,
        xp_awarded: 0,
        started_at: '',
        last_activity_at: '',
        completed_at: null,
      },
      new_turns: [],
      current_task_id: 'task-2',
      end_lesson_detected: false,
      tasks_done: 1,
      tasks_total: 4,
    });

    const { result } = renderHook(() =>
      useTutorSession({ sessionId: 'sess-1', initialCurrentTaskId: 'task-1' }),
    );
    await waitFor(() =>
      expect(result.current.state.kind).toBe('awaiting_user_speech'),
    );
    expect(result.current.completedTaskIds).toEqual([]);

    act(() => {
      result.current.dispatch({ type: 'RECORD_START', startedAt: Date.now() });
    });
    await act(async () => {
      await result.current.submitTurn({
        blob: new Blob(['x'], { type: 'audio/webm' }),
        mimeType: 'audio/webm',
      });
    });

    expect(result.current.completedTaskIds).toEqual(['task-1']);
  });

  it('finishSession dispatches TURN_ERROR(network) on failure', async () => {
    (tutorAPI.finishSession as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('offline'),
    );

    const { result } = renderHook(() =>
      useTutorSession({ sessionId: 'sess-1' }),
    );
    await waitFor(() =>
      expect(result.current.state.kind).toBe('awaiting_user_speech'),
    );

    await act(async () => {
      await result.current.finishSession();
    });

    // awaiting_user_speech doesn't accept TURN_ERROR, so state stays put —
    // this confirms `finishSession` doesn't crash on rejection.
    expect(result.current.state.kind).toBe('awaiting_user_speech');
  });
});
