import { useEffect, useState } from "react";
import { authedGet } from "@/lib/api/authedFetch";
import type { SkillScore } from "./skills.types";

type SkillsSummary = {
  skills: SkillScore[];
  cefr_estimate: string | null;
};

type UseSkillsSummaryResult = {
  data: SkillsSummary | null;
  isLoading: boolean;
  error: string | null;
};

export function useSkillsSummary(): UseSkillsSummaryResult {
  const [data, setData] = useState<SkillsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const json = await authedGet<SkillsSummary>("/me/skills/summary");
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load skills");
          setData(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}
