import type {
  TutorTurnDTO,
  EvaluationResult,
  TurnCorrection,
  TutorSessionDTO,
} from '../types';

export type ErrorCause = 'stt_failed' | 'network' | 'mic_denied' | 'unsupported_browser';

export type SessionState =
  | { kind: 'loading' }
  | { kind: 'ai_speaking'; turn: TutorTurnDTO }
  | { kind: 'awaiting_user_speech' }
  | { kind: 'recording'; startedAt: number }
  | { kind: 'processing'; transcriptPreview?: string }
  | { kind: 'showing_eval'; result: EvaluationResult }
  | { kind: 'end_lesson_confirm'; tasksDone: number; tasksTotal: number }
  | { kind: 'lesson_complete'; corrections: TurnCorrection[]; xpAwarded: number }
  | { kind: 'error'; cause: ErrorCause; retryable: boolean };

export interface TurnResponsePayload {
  evaluation: EvaluationResult;
  newAiTurn: TutorTurnDTO | null; // null on vi_spoken; the user turn dispatch handles its own card
  session: TutorSessionDTO;
  endLessonDetected: boolean;
  tasksDone: number | null;
  tasksTotal: number | null;
}

export interface FinishResponsePayload {
  corrections: TurnCorrection[];
  xpAwarded: number;
}

export type Event =
  | { type: 'HYDRATED'; openingTurn: TutorTurnDTO }
  | { type: 'AI_AUDIO_ENDED' }
  | { type: 'RECORD_START'; startedAt: number }
  | { type: 'RECORD_STOP' }
  | { type: 'RECORD_CANCEL' }
  | { type: 'TURN_RESPONSE'; payload: TurnResponsePayload }
  | { type: 'TURN_ERROR'; cause: ErrorCause; retryable?: boolean }
  | { type: 'END_LESSON_DETECTED'; tasksDone: number; tasksTotal: number }
  | { type: 'END_LESSON_CONFIRM' }
  | { type: 'END_LESSON_DISMISS' }
  | { type: 'FINISH_RESPONSE'; payload: FinishResponsePayload }
  | { type: 'RETRY' }
  | { type: 'UNSUPPORTED_BROWSER' };

export const initialState: SessionState = { kind: 'loading' };

/**
 * Pure reducer for the AI Tutor session state machine.
 *
 * Transitions (see spec §7):
 *
 * loading
 *   ← HYDRATED(turn)           → ai_speaking(turn)
 *   ← UNSUPPORTED_BROWSER      → error(cause='unsupported_browser', retryable=false)
 *
 * ai_speaking
 *   ← AI_AUDIO_ENDED           → awaiting_user_speech
 *   (RECORD_START during AI speech is ignored — UI gates it)
 *
 * awaiting_user_speech
 *   ← RECORD_START(now)        → recording(startedAt=now)
 *
 * recording
 *   ← RECORD_STOP              → processing
 *   ← RECORD_CANCEL            → awaiting_user_speech
 *
 * processing
 *   ← TURN_RESPONSE(payload)   →
 *        if endLessonDetected: end_lesson_confirm(tasksDone, tasksTotal)
 *        elif evaluation.kind == 'vi_spoken': awaiting_user_speech (toast handled outside)
 *        elif newAiTurn != null: ai_speaking(newAiTurn)
 *        else: awaiting_user_speech
 *   ← TURN_ERROR(cause)        → error(cause, retryable=true)
 *   ← END_LESSON_DETECTED      → end_lesson_confirm(tasksDone, tasksTotal)
 *
 * end_lesson_confirm
 *   ← END_LESSON_CONFIRM       → processing (frontend calls /finish next)
 *   ← END_LESSON_DISMISS       → awaiting_user_speech
 *
 * * (any state) — terminal:
 *   ← FINISH_RESPONSE(payload) → lesson_complete(corrections, xpAwarded)
 *
 * error
 *   ← RETRY                    → awaiting_user_speech
 *   (no other transitions out of error mid-session; mic_denied is sticky — user must allow + retry)
 *
 * lesson_complete (terminal)
 *   no transitions out
 *
 * Default case: return current state unchanged (no-op for unknown event in this state).
 */
export function transition(state: SessionState, event: Event): SessionState {
  // FINISH_RESPONSE is terminal from any state.
  if (event.type === 'FINISH_RESPONSE') {
    return {
      kind: 'lesson_complete',
      corrections: event.payload.corrections,
      xpAwarded: event.payload.xpAwarded,
    };
  }

  switch (state.kind) {
    case 'loading': {
      switch (event.type) {
        case 'HYDRATED':
          return { kind: 'ai_speaking', turn: event.openingTurn };
        case 'UNSUPPORTED_BROWSER':
          return { kind: 'error', cause: 'unsupported_browser', retryable: false };
        default:
          return state;
      }
    }

    case 'ai_speaking': {
      switch (event.type) {
        case 'AI_AUDIO_ENDED':
          return { kind: 'awaiting_user_speech' };
        // RECORD_START during AI speech is ignored — UI gates it.
        default:
          return state;
      }
    }

    case 'awaiting_user_speech': {
      switch (event.type) {
        case 'RECORD_START':
          return { kind: 'recording', startedAt: event.startedAt };
        default:
          return state;
      }
    }

    case 'recording': {
      switch (event.type) {
        case 'RECORD_STOP':
          return { kind: 'processing' };
        case 'RECORD_CANCEL':
          return { kind: 'awaiting_user_speech' };
        default:
          return state;
      }
    }

    case 'processing': {
      switch (event.type) {
        case 'TURN_RESPONSE': {
          const { evaluation, newAiTurn, endLessonDetected, tasksDone, tasksTotal } =
            event.payload;
          // 1) End-lesson takes priority — server flagged the user's utterance as a goodbye.
          if (endLessonDetected) {
            return {
              kind: 'end_lesson_confirm',
              tasksDone: tasksDone ?? 0,
              tasksTotal: tasksTotal ?? 0,
            };
          }
          // 2) Vietnamese spoken: bounce back to awaiting; the toast is handled outside.
          if (evaluation.kind === 'vi_spoken') {
            return { kind: 'awaiting_user_speech' };
          }
          // 3) New AI turn available: play it.
          if (newAiTurn !== null) {
            return { kind: 'ai_speaking', turn: newAiTurn };
          }
          // 4) Fallback: wait for the user to speak again.
          return { kind: 'awaiting_user_speech' };
        }
        case 'TURN_ERROR':
          return {
            kind: 'error',
            cause: event.cause,
            retryable: event.retryable ?? true,
          };
        case 'END_LESSON_DETECTED':
          return {
            kind: 'end_lesson_confirm',
            tasksDone: event.tasksDone,
            tasksTotal: event.tasksTotal,
          };
        default:
          return state;
      }
    }

    case 'showing_eval': {
      // No incoming transitions are defined out of showing_eval in the contract;
      // returning state preserves it until external code dispatches an explicit move.
      return state;
    }

    case 'end_lesson_confirm': {
      switch (event.type) {
        case 'END_LESSON_CONFIRM':
          return { kind: 'processing' };
        case 'END_LESSON_DISMISS':
          return { kind: 'awaiting_user_speech' };
        default:
          return state;
      }
    }

    case 'error': {
      switch (event.type) {
        case 'RETRY':
          return { kind: 'awaiting_user_speech' };
        default:
          return state;
      }
    }

    case 'lesson_complete': {
      // Terminal: no transitions out.
      return state;
    }

    default: {
      // Exhaustiveness guard — if a new state kind is added, this surfaces it at compile time.
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}
