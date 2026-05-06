/**
 * SkillsPage — /skills
 * Shows all 11 skill cards in a grid with SkillBar, score, sample_size, last_updated.
 * Data fetched from GET /api/v1/me/skills/summary.
 * Falls back to a zero-state view when the user has no data yet.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/stores/useUserStore";
import CefrBadge from "@/components/CefrBadge";
import SkillBar from "../components/SkillBar";
import { SKILL_KEYS, SKILL_LABELS } from "../skills.types";
import type { SkillScore } from "../skills.types";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8000/api/v1";

type LoadingState =
  | { status: "loading" }
  | { status: "ready"; scores: SkillScore[] }
  | { status: "error" };

async function fetchSkillSummary(): Promise<SkillScore[] | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const res = await fetch(`${API_BASE}/me/skills/summary`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return (Array.isArray(data) ? data : data?.skills ?? []) as SkillScore[];
}

/** Build zero-score placeholders for all 11 skills. */
function buildZeroScores(): SkillScore[] {
  return SKILL_KEYS.map((skill) => ({
    skill,
    score: 0,
    sample_size: 0,
    last_updated_at: null,
  }));
}

export default function SkillsPage() {
  const { t } = useTranslation();
  const profile = useUserStore((s) => s.profile);
  const cefrEstimate = profile?.cefr_estimate ?? null;
  const [state, setState] = useState<LoadingState>({ status: "loading" });

  useEffect(() => {
    fetchSkillSummary()
      .then((scores) => {
        if (scores) {
          // Merge API data with the canonical key list (in case some skills have no data yet)
          const map = new Map(scores.map((s) => [s.skill, s]));
          const merged = SKILL_KEYS.map((key) =>
            map.get(key) ?? { skill: key, score: 0, sample_size: 0, last_updated_at: null }
          );
          setState({ status: "ready", scores: merged });
        } else {
          // Not authenticated or endpoint not yet available — show zeros
          setState({ status: "ready", scores: buildZeroScores() });
        }
      })
      .catch(() => setState({ status: "error" }));
  }, []);

  const scores =
    state.status === "ready"
      ? state.scores
      : state.status === "loading"
      ? buildZeroScores()
      : buildZeroScores();

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-2">
        <Zap className="w-7 h-7 text-primary-600 dark:text-primary-400" aria-hidden />
        <h1 className="text-2xl font-bold text-semantic-text">
          {t("skills.title", { defaultValue: "My Skills" })}
        </h1>
        {cefrEstimate && (
          <CefrBadge level={cefrEstimate} />
        )}
      </div>
      <p className="text-semantic-text-muted mb-8">
        {t("skills.subtitle", {
          defaultValue: "Your EWMA-smoothed scores across 11 English skill dimensions.",
        })}
      </p>

      {state.status === "error" && (
        <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
          {t("skills.error", { defaultValue: "Could not load skill data. Please try again." })}
        </div>
      )}

      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-label={t("skills.grid.label", { defaultValue: "Skill scores" })}
      >
        {scores.map((skillScore) => (
          <SkillCard key={skillScore.skill} skillScore={skillScore} />
        ))}
      </div>
    </div>
  );
}

function SkillCard({ skillScore }: { skillScore: SkillScore }) {
  const { t } = useTranslation();
  const label = SKILL_LABELS[skillScore.skill];
  const isEmpty = skillScore.sample_size === 0;

  return (
    <Link to={`/skills/${skillScore.skill}`} className="block group">
    <article className="card p-4 flex flex-col gap-3 group-hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-semantic-text">
          {t(`skills.names.${skillScore.skill}`, { defaultValue: label })}
        </h2>
        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
          {isEmpty ? "–" : skillScore.score.toFixed(1)}
          {!isEmpty && (
            <span className="text-xs text-semantic-text-muted font-normal">/5</span>
          )}
        </span>
      </div>

      <SkillBar
        score={skillScore.score}
        sampleSize={skillScore.sample_size}
        lastUpdatedAt={skillScore.last_updated_at}
        label={label}
      />

      <div className="flex items-center justify-between text-xs text-semantic-text-muted">
        <span>
          {isEmpty
            ? t("skills.card.noData", { defaultValue: "No data yet" })
            : t("skills.card.sampleSize", {
                count: skillScore.sample_size,
                defaultValue: `${skillScore.sample_size} attempts`,
              })}
        </span>
        {skillScore.last_updated_at && (
          <span>
            {new Date(skillScore.last_updated_at).toLocaleDateString()}
          </span>
        )}
      </div>
    </article>
    </Link>
  );
}
