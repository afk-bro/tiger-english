/**
 * useScenario — fetches a TutorScenarioDetail by slug on mount.
 *
 * Returns `{ scenario, isLoading, error, refetch }`. When `slug` is
 * undefined the hook is a no-op (isLoading=false, scenario=null) so the
 * caller can render a placeholder while the route param is hydrating.
 */
import { useCallback, useEffect, useState } from 'react';
import { tutorAPI } from '../api/tutor';
import type { TutorScenarioDetail } from '../types';

export interface UseScenarioResult {
  scenario: TutorScenarioDetail | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useScenario(slug: string | undefined): UseScenarioResult {
  const [scenario, setScenario] = useState<TutorScenarioDetail | null>(null);
  const [isLoading, setLoading] = useState<boolean>(Boolean(slug));
  const [error, setError] = useState<Error | null>(null);

  const fetchScenario = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const result = await tutorAPI.getScenario(slug);
      setScenario(result);
    } catch (err) {
      setError(err as Error);
      setScenario(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void fetchScenario();
  }, [fetchScenario]);

  return { scenario, isLoading, error, refetch: fetchScenario };
}
