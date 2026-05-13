import { useEffect, useState } from "react";
import { tutorAPI } from "@/features/ai-tutor/api/tutor";
import type { ActiveTutorSessionDTO } from "@/features/ai-tutor/types";

export interface UseActiveTutorSession {
  data: ActiveTutorSessionDTO | null;
  isLoading: boolean;
  error: Error | null;
}

export function useActiveTutorSession(): UseActiveTutorSession {
  const [data, setData] = useState<ActiveTutorSessionDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    tutorAPI
      .getActiveSession()
      .then((res) => {
        if (!cancelled) setData(res ?? null);
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
