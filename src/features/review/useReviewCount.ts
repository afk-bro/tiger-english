import { useEffect, useState } from "react";
import { authedGet } from "@/lib/api/authedFetch";

export function useReviewCount() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await authedGet<{ count?: number }>("/me/review/count");
        if (cancelled) return;
        setCount(data?.count ?? 0);
      } catch {
        if (!cancelled) setCount(0);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { count, isLoading };
}
