import { useEffect, useState } from "react";
import { ProgressAPI, type ProgressSummary } from "@/lib/api/progress";

export function useProgressSummary() {
  const [data, setData] = useState<ProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    ProgressAPI.getSummary()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e : new Error(String(e))); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}
