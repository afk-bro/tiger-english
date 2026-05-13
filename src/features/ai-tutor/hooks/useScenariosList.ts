import { useEffect, useState } from "react";
import { tutorAPI } from "@/features/ai-tutor/api/tutor";
import type { TutorScenarioSummary } from "@/features/ai-tutor/types";

export interface UseScenariosList {
  data: TutorScenarioSummary[] | null;
  isLoading: boolean;
  error: Error | null;
}

export function useScenariosList(): UseScenariosList {
  const [data, setData] = useState<TutorScenarioSummary[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    tutorAPI
      .listScenarios()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err as Error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}
