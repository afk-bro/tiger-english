import { describe, it, expect } from 'vitest';
import { transition, initialState, type SessionState } from '../sessionMachine';
import type {
  TutorTurnDTO,
  EvaluationResult,
  TutorSessionDTO,
} from '../../types';

const fakeTurn: TutorTurnDTO = {
  id: 't1',
  speaker: 'ai',
  text_en: 'Hi',
  audio_url: null,
  correction: null,
  task_completed: false,
  created_at: '2026-01-01T00:00:00Z',
};

const fakeSession: TutorSessionDTO = {
  id: 's1',
  scenario_slug: 'demo',
  status: 'active',
  current_task_id: 'task-1',
  completed_task_ids: [],
  mistake_count: 0,
  xp_awarded: 0,
  started_at: '2026-01-01T00:00:00Z',
  last_activity_at: '2026-01-01T00:00:00Z',
  completed_at: null,
};

const fakeEval: EvaluationResult = {
  kind: 'evaluated',
  task_completed: true,
  severity: 'none',
  correction: null,
  should_advance: true,
  matched_pattern: null,
};

describe('sessionMachine', () => {
  describe('loading', () => {
    it('HYDRATED → ai_speaking', () => {
      const next = transition({ kind: 'loading' }, { type: 'HYDRATED', openingTurn: fakeTurn });
      expect(next).toEqual({ kind: 'ai_speaking', turn: fakeTurn });
    });

    it('UNSUPPORTED_BROWSER → error', () => {
      const next = transition({ kind: 'loading' }, { type: 'UNSUPPORTED_BROWSER' });
      expect(next.kind).toBe('error');
      if (next.kind === 'error') {
        expect(next.cause).toBe('unsupported_browser');
        expect(next.retryable).toBe(false);
      }
    });

    it('unrelated event in loading → unchanged (identity)', () => {
      const s: SessionState = { kind: 'loading' };
      const next = transition(s, { type: 'AI_AUDIO_ENDED' });
      expect(next).toBe(s);
    });
  });

  describe('ai_speaking', () => {
    it('AI_AUDIO_ENDED → awaiting_user_speech', () => {
      const next = transition(
        { kind: 'ai_speaking', turn: fakeTurn },
        { type: 'AI_AUDIO_ENDED' },
      );
      expect(next).toEqual({ kind: 'awaiting_user_speech' });
    });

    it('RECORD_START in ai_speaking → unchanged (UI gates it)', () => {
      const s: SessionState = { kind: 'ai_speaking', turn: fakeTurn };
      const next = transition(s, { type: 'RECORD_START', startedAt: 1 });
      expect(next).toBe(s);
    });
  });

  describe('awaiting_user_speech', () => {
    it('RECORD_START → recording', () => {
      const next = transition(
        { kind: 'awaiting_user_speech' },
        { type: 'RECORD_START', startedAt: 12345 },
      );
      expect(next).toEqual({ kind: 'recording', startedAt: 12345 });
    });
  });

  describe('recording', () => {
    const s: SessionState = { kind: 'recording', startedAt: 100 };

    it('RECORD_STOP → processing', () => {
      const next = transition(s, { type: 'RECORD_STOP' });
      expect(next.kind).toBe('processing');
    });

    it('RECORD_CANCEL → awaiting_user_speech', () => {
      const next = transition(s, { type: 'RECORD_CANCEL' });
      expect(next).toEqual({ kind: 'awaiting_user_speech' });
    });
  });

  describe('processing', () => {
    const s: SessionState = { kind: 'processing' };

    it('TURN_RESPONSE with end_lesson_detected → end_lesson_confirm', () => {
      const next = transition(s, {
        type: 'TURN_RESPONSE',
        payload: {
          evaluation: fakeEval,
          newAiTurn: null,
          session: fakeSession,
          endLessonDetected: true,
          tasksDone: 2,
          tasksTotal: 4,
        },
      });
      expect(next).toEqual({ kind: 'end_lesson_confirm', tasksDone: 2, tasksTotal: 4 });
    });

    it('TURN_RESPONSE with vi_spoken evaluation → awaiting_user_speech', () => {
      const viEval: EvaluationResult = { ...fakeEval, kind: 'vi_spoken' };
      const next = transition(s, {
        type: 'TURN_RESPONSE',
        payload: {
          evaluation: viEval,
          newAiTurn: null,
          session: fakeSession,
          endLessonDetected: false,
          tasksDone: null,
          tasksTotal: null,
        },
      });
      expect(next).toEqual({ kind: 'awaiting_user_speech' });
    });

    it('TURN_RESPONSE with newAiTurn → ai_speaking', () => {
      const next = transition(s, {
        type: 'TURN_RESPONSE',
        payload: {
          evaluation: fakeEval,
          newAiTurn: fakeTurn,
          session: fakeSession,
          endLessonDetected: false,
          tasksDone: null,
          tasksTotal: null,
        },
      });
      expect(next).toEqual({ kind: 'ai_speaking', turn: fakeTurn });
    });

    it('TURN_RESPONSE with no newAiTurn → awaiting_user_speech', () => {
      const next = transition(s, {
        type: 'TURN_RESPONSE',
        payload: {
          evaluation: fakeEval,
          newAiTurn: null,
          session: fakeSession,
          endLessonDetected: false,
          tasksDone: null,
          tasksTotal: null,
        },
      });
      expect(next).toEqual({ kind: 'awaiting_user_speech' });
    });

    it('TURN_ERROR → error (retryable=true by default)', () => {
      const next = transition(s, { type: 'TURN_ERROR', cause: 'stt_failed' });
      expect(next.kind).toBe('error');
      if (next.kind === 'error') {
        expect(next.cause).toBe('stt_failed');
        expect(next.retryable).toBe(true);
      }
    });

    it('TURN_ERROR with explicit retryable=false honored', () => {
      const next = transition(s, {
        type: 'TURN_ERROR',
        cause: 'mic_denied',
        retryable: false,
      });
      expect(next.kind).toBe('error');
      if (next.kind === 'error') {
        expect(next.cause).toBe('mic_denied');
        expect(next.retryable).toBe(false);
      }
    });

    it('END_LESSON_DETECTED → end_lesson_confirm', () => {
      const next = transition(s, {
        type: 'END_LESSON_DETECTED',
        tasksDone: 1,
        tasksTotal: 4,
      });
      expect(next).toEqual({ kind: 'end_lesson_confirm', tasksDone: 1, tasksTotal: 4 });
    });
  });

  describe('end_lesson_confirm', () => {
    const s: SessionState = { kind: 'end_lesson_confirm', tasksDone: 2, tasksTotal: 4 };

    it('END_LESSON_CONFIRM → processing', () => {
      const next = transition(s, { type: 'END_LESSON_CONFIRM' });
      expect(next.kind).toBe('processing');
    });

    it('END_LESSON_DISMISS → awaiting_user_speech', () => {
      const next = transition(s, { type: 'END_LESSON_DISMISS' });
      expect(next).toEqual({ kind: 'awaiting_user_speech' });
    });
  });

  describe('FINISH_RESPONSE — terminal from any state', () => {
    it('processing → lesson_complete', () => {
      const next = transition(
        { kind: 'processing' },
        { type: 'FINISH_RESPONSE', payload: { corrections: [], xpAwarded: 50 } },
      );
      expect(next).toEqual({ kind: 'lesson_complete', corrections: [], xpAwarded: 50 });
    });

    it('end_lesson_confirm → lesson_complete', () => {
      const next = transition(
        { kind: 'end_lesson_confirm', tasksDone: 4, tasksTotal: 4 },
        { type: 'FINISH_RESPONSE', payload: { corrections: [], xpAwarded: 75 } },
      );
      expect(next).toEqual({ kind: 'lesson_complete', corrections: [], xpAwarded: 75 });
    });

    it('loading → lesson_complete (terminal-from-any-state)', () => {
      const next = transition(
        { kind: 'loading' },
        { type: 'FINISH_RESPONSE', payload: { corrections: [], xpAwarded: 10 } },
      );
      expect(next).toEqual({ kind: 'lesson_complete', corrections: [], xpAwarded: 10 });
    });
  });

  describe('error', () => {
    const s: SessionState = { kind: 'error', cause: 'stt_failed', retryable: true };

    it('RETRY → awaiting_user_speech', () => {
      const next = transition(s, { type: 'RETRY' });
      expect(next).toEqual({ kind: 'awaiting_user_speech' });
    });

    it('non-retry event in error → unchanged (identity)', () => {
      const next = transition(s, { type: 'AI_AUDIO_ENDED' });
      expect(next).toBe(s);
    });
  });

  describe('lesson_complete', () => {
    it('terminal — any event returns same state (identity)', () => {
      const s: SessionState = { kind: 'lesson_complete', corrections: [], xpAwarded: 50 };
      const next = transition(s, { type: 'RETRY' });
      expect(next).toBe(s);
    });
  });

  describe('unknown event in unrelated state', () => {
    it('returns current state unchanged', () => {
      const s: SessionState = { kind: 'awaiting_user_speech' };
      const next = transition(s, { type: 'AI_AUDIO_ENDED' });
      expect(next).toBe(s);
    });
  });

  it('initialState is loading', () => {
    expect(initialState).toEqual({ kind: 'loading' });
  });
});
