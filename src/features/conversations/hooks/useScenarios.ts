import { useEffect, useState } from "react";
import { authedGet } from "@/lib/api/authedFetch";
import type { ConversationScenario, LevelBand, ScenariosResponse } from "../conversations.types";

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
        const path = filterLevel
          ? `/me/conversations/scenarios?level=${encodeURIComponent(filterLevel)}`
          : "/me/conversations/scenarios";
        const data = await authedGet<ScenariosResponse>(path);

        if (cancelled) return;
        if (!data) {
          setError("Not authenticated");
          return;
        }
        setScenarios(data.scenarios);
        setLevelBands(data.level_bands);
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
