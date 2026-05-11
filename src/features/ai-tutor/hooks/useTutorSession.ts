/**
 * useTutorSession — the orchestrator hook for an active AI Tutor session.
 *
 * Wires together:
 *  - the session state machine (`sessionMachine.ts`)
 *  - the TTS helper (`useTutorTTS`)
 *  - the mic recorder (`useMicRecorder`)
 *  - the network client (`tutorAPI`)
 *
 * The page component is responsible for kicking off recording and calling
 * `submitTurn` once the mic blob is available. This hook owns:
 *  - hydration: dispatch HYDRATED once on mount so the reducer leaves
 *    `loading` (the page can also pre-populate the opening turn from
 *    `StartSessionResponse` carried in router state)
 *  - audio playback: when the state is `ai_speaking`, play the turn's
 *    audio (or fall back to SpeechSynthesis) and dispatch
 *    `AI_AUDIO_ENDED` when it finishes
 *  - submitTurn: stop recording → POST audio → dispatch reducer events
 *  - finishSession: POST /finish → dispatch FINISH_RESPONSE
 *
 * v1 hydration deliberately uses a placeholder opening turn. The page
 * component should dispatch its own `HYDRATED` with the real opening
 * turn from `StartSessionResponse` (carried via router state when
 * navigating from `useResumeOrStart`).
 */
import { useEffect, useReducer, useRef } from 'react';
import { tutorAPI, TutorAPIError } from '../api/tutor';
import { initialState, transition } from '../state/sessionMachine';
import { useTutorTTS } from '../audio/useTutorTTS';
import { useMicRecorder } from '../audio/useMicRecorder';
import type { TutorTurnDTO } from '../types';

export interface UseTutorSessionOptions {
  sessionId: string | undefined;
  /** Hard cap on a single recording, in ms. Defaults to 20s. */
  maxRecordMs?: number;
}

export function useTutorSession({
  sessionId,
  maxRecordMs = 20_000,
}: UseTutorSessionOptions) {
  const [state, dispatch] = useReducer(transition, initialState);
  const tts = useTutorTTS();
  const mic = useMicRecorder({ maxMs: maxRecordMs });

  // Hydration: load session on mount. v1 dispatches a placeholder opening
  // turn so the reducer leaves `loading`; the page replaces it with the
  // real `StartSessionResponse.opening_turn` once available.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!sessionId || hydratedRef.current) return;
    hydratedRef.current = true;
    void (async () => {
      try {
        const placeholderTurn: TutorTurnDTO = {
          id: 'opening-placeholder',
          speaker: 'ai',
          text_en: '',
          audio_url: null,
          correction: null,
          task_completed: false,
          created_at: new Date().toISOString(),
        };
        dispatch({ type: 'HYDRATED', openingTurn: placeholderTurn });
      } catch {
        dispatch({ type: 'TURN_ERROR', cause: 'network', retryable: true });
      }
    })();
  }, [sessionId]);

  // When state is ai_speaking, play the turn. When playback ends,
  // dispatch AI_AUDIO_ENDED so the reducer advances to awaiting_user_speech.
  const aiTurnId = state.kind === 'ai_speaking' ? state.turn.id : null;
  useEffect(() => {
    if (state.kind !== 'ai_speaking') return;
    // Skip playback for the placeholder turn (empty text + no audio):
    // the page will dispatch a real HYDRATED with the actual opening turn.
    if (!state.turn.text_en && !state.turn.audio_url) {
      dispatch({ type: 'AI_AUDIO_ENDED' });
      return;
    }
    let cancelled = false;
    void tts
      .play({ text: state.turn.text_en ?? '', audioUrl: state.turn.audio_url })
      .then(() => {
        if (!cancelled) dispatch({ type: 'AI_AUDIO_ENDED' });
      });
    return () => {
      cancelled = true;
      tts.stop();
    };
    // We intentionally key off the turn id rather than the full state object
    // so playback doesn't restart on unrelated state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.kind, aiTurnId]);

  /**
   * Submit the currently captured mic blob as a tutor turn. The page
   * component is expected to call this AFTER `mic.stop()` has resolved a
   * blob (i.e., `mic.blob` is non-null).
   */
  const submitTurn = async (currentTaskId: string): Promise<void> => {
    if (!sessionId || !mic.blob) return;
    dispatch({ type: 'RECORD_STOP' }); // → processing
    try {
      const response = await tutorAPI.submitTurn(
        sessionId,
        mic.blob,
        mic.mimeType,
        currentTaskId,
      );
      if (response.end_lesson_detected) {
        dispatch({
          type: 'END_LESSON_DETECTED',
          tasksDone: response.tasks_done ?? 0,
          tasksTotal: response.tasks_total ?? 0,
        });
        return;
      }
      const newAi = response.new_turns.find((t) => t.speaker === 'ai') ?? null;
      dispatch({
        type: 'TURN_RESPONSE',
        payload: {
          evaluation: response.evaluation,
          newAiTurn: newAi,
          session: response.session,
          endLessonDetected: false,
          tasksDone: response.tasks_done,
          tasksTotal: response.tasks_total,
        },
      });
    } catch (err) {
      // Backend signals STT failure with HTTP 503. Anything else → network.
      const status =
        err instanceof TutorAPIError
          ? err.status
          : (err as { status?: number }).status;
      const cause = status === 503 ? 'stt_failed' : 'network';
      dispatch({ type: 'TURN_ERROR', cause });
    } finally {
      mic.reset();
    }
  };

  /**
   * Finalize the session. Dispatches FINISH_RESPONSE on success — the
   * reducer transitions to `lesson_complete` from any state.
   */
  const finishSession = async (): Promise<void> => {
    if (!sessionId) return;
    try {
      const response = await tutorAPI.finishSession(sessionId);
      dispatch({
        type: 'FINISH_RESPONSE',
        payload: {
          corrections: response.all_corrections,
          xpAwarded: response.xp_awarded,
        },
      });
    } catch {
      dispatch({ type: 'TURN_ERROR', cause: 'network' });
    }
  };

  return { state, dispatch, tts, mic, submitTurn, finishSession };
}
