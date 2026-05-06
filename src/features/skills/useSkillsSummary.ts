import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { SkillScore } from "./skills.types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000/api/v1";

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
    async function fetchSummary() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setData(null);
          setIsLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/me/skills/summary`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json() as SkillsSummary;
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load skills");
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }
    void fetchSummary();
  }, []);

  return { data, isLoading, error };
}
