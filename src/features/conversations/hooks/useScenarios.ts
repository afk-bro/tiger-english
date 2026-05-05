import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ConversationScenario, LevelBand, ScenariosResponse } from "../conversations.types";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8000/api/v1";

export function useScenarios(filterLevel?: LevelBand | null) {
  const [scenarios, setScenarios] = useState<ConversationScenario[]>([]);
  const [levelBands, setLevelBands] = useState<LevelBand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setError("Not authenticated");
          setIsLoading(false);
          return;
        }

        const url = filterLevel
          ? `${API_BASE}/me/conversations/scenarios?level=${encodeURIComponent(filterLevel)}`
          : `${API_BASE}/me/conversations/scenarios`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ScenariosResponse = await res.json();

        if (!cancelled) {
          setScenarios(data.scenarios);
          setLevelBands(data.level_bands);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load scenarios");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filterLevel]);

  return { scenarios, levelBands, isLoading, error };
}
