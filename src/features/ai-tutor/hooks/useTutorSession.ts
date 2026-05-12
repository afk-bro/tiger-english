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
import { useEffect, useReducer, useRef, useState, useCallback } from 'react';
import { tutorAPI, TutorAPIError } from '../api/tutor';
import { initialState, transition } from '../state/sessionMachine';
import { useTutorTTS } from '../audio/useTutorTTS';
import { useMicRecorder } from '../audio/useMicRecorder';
import type { EvaluationResult, TutorTurnDTO } from '../types';

export interface UseTutorSessionOptions {
  sessionId: string | undefined;
  /** Hard cap on a single recording, in ms. Defaults to 20s. */
  maxRecordMs?: number;
  /**
   * Initial value for the advancing `current_task_id` pointer. Typically the
   * `StartSessionResponse.current_task_id` from the briefing page's router
   * state. Updated on every successful `submitTurn` from
   * `TurnResponse.current_task_id`.
   */
  initialCurrentTaskId?: string | null;
  /**
   * Fires on every successful turn response (i.e. backend returned an
   * EvaluationResult). Skipped on end-lesson responses — those route through
   * the END_LESSON_DETECTED dispatch instead. The page uses this to surface
   * the Vi+En toast when `evaluation.kind === 'vi_spoken'`; a callback (vs.
   * exposing reactive `lastEvaluation` state) avoids the "two same-kind
   * evaluations in a row dedupe to one toast" trap.
   */
  onEvaluation?: (evaluation: EvaluationResult) => void;
}

export function useTutorSession({
  sessionId,
  maxRecordMs = 20_000,
  initialCurrentTaskId = null,
  onEvaluation,
}: UseTutorSessionOptions) {
  const [state, dispatch] = useReducer(transition, initialState);
  const tts = useTutorTTS();
  const mic = useMicRecorder({ maxMs: maxRecordMs });

  // Keep onEvaluation in a ref so changing the callback's identity doesn't
  // bust submitTurn's useCallback (which would re-render every consumer
  // that captured the old reference).
  const onEvaluationRef = useRef(onEvaluation);
  useEffect(() => {
    onEvaluationRef.current = onEvaluation;
  }, [onEvaluation]);

  // Advancing current-task pointer. Tracked in both state (so React re-renders
  // when it changes — the page needs this to highlight the right task in the
  // banner) AND a ref (so `submitTurn`'s callback reads the freshest value
  // without capturing a stale closure).
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(
    initialCurrentTaskId ?? null,
  );
  const currentTaskIdRef = useRef<string | null>(initialCurrentTaskId ?? null);
  // Retains the most-recent non-null task id even after the backend reports
  // `current_task_id: null` (all tasks done → wrap-up line). The user can
  // still talk past the wrap-up (e.g. "end lesson") and we need to send a
  // valid task id so the backend's end-lesson detector can run — it ignores
  // evaluation in that path but still requires `current_task_id` in the
  // form payload.
  const lastTaskIdRef = useRef<string | null>(initialCurrentTaskId ?? null);

  // Completed-task ids from the backend's view (TurnResponse.session.
  // completed_task_ids). Source of truth for the progress banner: deriving
  // tasks-done from local turn flags is unreliable because the page only
  // accumulates AI turns (which always carry task_completed=false) — the
  // user-turn-with-task_completed-true flag is dropped in submitTurn.
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

  // If the caller hands us an `initialCurrentTaskId` after the first render
  // (e.g. router state arrives a tick late), pick it up — but never let it
  // clobber a pointer we've already advanced via a turn response.
  useEffect(() => {
    if (!initialCurrentTaskId) return;
    if (currentTaskIdRef.current) return;
    currentTaskIdRef.current = initialCurrentTaskId;
    lastTaskIdRef.current = initialCurrentTaskId;
    setCurrentTaskId(initialCurrentTaskId);
  }, [initialCurrentTaskId]);

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
   * Submit a captured mic blob as a tutor turn. The page passes the blob +
   * mimeType in directly (returned by awaiting `mic.stop()`) — we deliberately
   * do NOT read them from `mic.blob` state because that's stale-closure-prone
   * relative to the click that triggers submission.
   *
   * The current task id is read from `currentTaskIdRef.current` so it always
   * reflects the latest `TurnResponse.current_task_id` (i.e. submitting
   * after task 1 advances evaluates against task 2, not task 1).
   */
  const submitTurn = useCallback(
    async ({
      blob,
      mimeType,
    }: {
      blob: Blob;
      mimeType: string;
    }): Promise<void> => {
      if (!sessionId) return;
      // Prefer the active task id; fall back to the last-known task id so
      // we can still send a post-wrap-up turn (e.g. "end lesson") through
      // the end-lesson detector.
      const taskId = currentTaskIdRef.current ?? lastTaskIdRef.current;
      if (!taskId) return;
      dispatch({ type: 'RECORD_STOP' }); // → processing
      try {
        const response = await tutorAPI.submitTurn(
          sessionId,
          blob,
          mimeType,
          taskId,
        );
        if (response.end_lesson_detected) {
          dispatch({
            type: 'END_LESSON_DETECTED',
            tasksDone: response.tasks_done ?? 0,
            tasksTotal: response.tasks_total ?? 0,
          });
          return;
        }
        // Advance the current-task pointer from the backend's view (after
        // it has applied evaluation + task transitions). null means "all
        // tasks done" — the wrap-up line follows.
        if (response.current_task_id) {
          currentTaskIdRef.current = response.current_task_id;
          lastTaskIdRef.current = response.current_task_id;
          setCurrentTaskId(response.current_task_id);
        } else {
          currentTaskIdRef.current = null;
          setCurrentTaskId(null);
        }
        // Track the backend's authoritative completed-task list. Backend
        // returns the full array on each turn; replace (don't merge) so
        // hypothetical server-side resets stay consistent.
        if (response.session?.completed_task_ids) {
          setCompletedTaskIds(response.session.completed_task_ids);
        }
        // Surface the evaluation to consumers (vi_spoken toast, future
        // mid-evaluation UI). Called after end-lesson is ruled out so the
        // page doesn't double-handle an end-lesson "kết thúc bài học" turn.
        onEvaluationRef.current?.(response.evaluation);
        const newAi =
          response.new_turns.find((t) => t.speaker === 'ai') ?? null;
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
      }
    },
    [sessionId],
  );

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

  return {
    state,
    dispatch,
    tts,
    mic,
    submitTurn,
    finishSession,
    currentTaskId,
    completedTaskIds,
  };
}
