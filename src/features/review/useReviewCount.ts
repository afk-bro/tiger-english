import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000/api/v1";

export function useReviewCount() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCount() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setCount(0);
          setIsLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/me/review/count`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) {
          setCount(0);
          setIsLoading(false);
          return;
        }
        const data = await res.json() as { count?: number };
        setCount(data.count ?? 0);
      } catch {
        setCount(0);
      } finally {
        setIsLoading(false);
      }
    }
    void fetchCount();
  }, []);

  return { count, isLoading };
}
