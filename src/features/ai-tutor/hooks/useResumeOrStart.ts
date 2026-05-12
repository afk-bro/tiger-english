/**
 * useResumeOrStart — bridge between the scenario detail page and a session.
 *
 * Returns:
 *  - `existingActiveSessionId`: surfaced from the scenario detail so the
 *    UI can offer "Continue" alongside "Start fresh".
 *  - `startFresh()` / `startContinue()`: call `POST /me/ai-tutor/sessions`
 *    with the matching mode, then navigate to the session route, passing
 *    the `StartSessionResponse.opening_turn` + `current_task_id` via
 *    router state so the session page can hydrate without a second fetch.
 *  - `isStarting` / `error`: standard request UI flags.
 */
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tutorAPI } from '../api/tutor';
import type { TutorScenarioDetail } from '../types';

export interface UseResumeOrStartOptions {
  slug: string;
  scenarioDetail: TutorScenarioDetail | null;
}

export interface UseResumeOrStartResult {
  existingActiveSessionId: string | null;
  startFresh: () => Promise<void>;
  startContinue: () => Promise<void>;
  isStarting: boolean;
  error: Error | null;
}

export function useResumeOrStart({
  slug,
  scenarioDetail,
}: UseResumeOrStartOptions): UseResumeOrStartResult {
  const navigate = useNavigate();
  const [isStarting, setStarting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const begin = useCallback(
    async (mode: 'fresh' | 'continue') => {
      setStarting(true);
      setError(null);
      try {
        const resp = await tutorAPI.startSession(slug, mode);
        navigate(`/ai-tutor/scenarios/${slug}/session/${resp.session_id}`, {
          state: {
            openingTurn: resp.opening_turn,
            currentTaskId: resp.current_task_id,
          },
        });
      } catch (err) {
        setError(err as Error);
      } finally {
        setStarting(false);
      }
    },
    [navigate, slug],
  );

  const startFresh = useCallback(() => begin('fresh'), [begin]);
  const startContinue = useCallback(() => begin('continue'), [begin]);

  return {
    existingActiveSessionId: scenarioDetail?.existing_active_session_id ?? null,
    startFresh,
    startContinue,
    isStarting,
    error,
  };
}
