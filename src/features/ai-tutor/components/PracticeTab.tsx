import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dumbbell, Loader2, AlertCircle } from "lucide-react";
import { aiTutorAPI } from "@/lib/api/aiTutor";
import { useUserStore } from "@/stores/useUserStore";
import { getLearnerLanguage } from "@/features/lessons/utils/learnerLanguage";
import type { PracticeItem } from "@/lib/api/aiTutor";

type Skill = "grammar" | "vocabulary" | "listening" | "reading" | "writing";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; items: PracticeItem[] }
  | { status: "disabled" }
  | { status: "error" };

const SKILLS: Skill[] = ["grammar", "vocabulary", "reading", "writing"];

export default function PracticeTab() {
  const { t, i18n } = useTranslation();
  const profile = useUserStore((s) => s.profile);
  const [skill, setSkill] = useState<Skill>("grammar");
  const [topic, setTopic] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const learnerLanguage = getLearnerLanguage(i18n.language) ?? "en";
  const cefrLevel = profile?.cefr_estimate ?? "A1";

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: "loading" });
    setRevealed(new Set());

    const result = await aiTutorAPI.practice({
      skill,
      topic: topic.trim() || undefined,
      cefr_level: cefrLevel,
      learner_language: learnerLanguage,
      count: 5,
    });

    if (!result) {
      setState({ status: "error" });
    } else if ("code" in result && result.code === "ai_disabled") {
      setState({ status: "disabled" });
    } else if ("items" in result) {
      setState({ status: "done", items: result.items });
    }
  }

  function toggleReveal(i: number) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleGenerate} className="flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium text-semantic-text mb-1 block">
            {t("aiTutor.practice.skill", { defaultValue: "Skill" })}
          </label>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSkill(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  skill === s
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-semantic-text-muted hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {t(`aiTutor.practice.skills.${s}`, { defaultValue: s[0].toUpperCase() + s.slice(1) })}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="practice-topic" className="text-sm font-medium text-semantic-text mb-1 block">
            {t("aiTutor.practice.topic", { defaultValue: "Topic (optional)" })}
          </label>
          <input
            id="practice-topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t("aiTutor.practice.topic_placeholder", { defaultValue: "e.g. to be, past simple…" })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-semantic-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={state.status === "loading"}
          />
        </div>

        <button
          type="submit"
          disabled={state.status === "loading"}
          className="self-start flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {state.status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Dumbbell className="w-4 h-4" aria-hidden />
          )}
          {t("aiTutor.practice.generate", { defaultValue: "Generate Practice" })}
        </button>
      </form>

      {state.status === "done" && state.items.length > 0 && (
        <ol className="flex flex-col gap-3" aria-label={t("aiTutor.practice.results", { defaultValue: "Practice exercises" })}>
          {state.items.map((item, i) => (
            <li key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-semantic-surface-2 p-3 text-sm">
              <p className="font-medium text-semantic-text mb-2">{item.question}</p>
              {item.hint && (
                <p className="text-xs text-semantic-text-muted mb-2">
                  {t("aiTutor.practice.hint", { defaultValue: "Hint" })}: {item.hint}
                </p>
              )}
              <button
                type="button"
                onClick={() => toggleReveal(i)}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                {revealed.has(i)
                  ? t("aiTutor.practice.hide_answer", { defaultValue: "Hide answer" })
                  : t("aiTutor.practice.show_answer", { defaultValue: "Show answer" })}
              </button>
              {revealed.has(i) && (
                <p className="mt-1 font-semibold text-semantic-text">{item.answer}</p>
              )}
            </li>
          ))}
        </ol>
      )}

      {state.status === "done" && state.items.length === 0 && (
        <p className="text-sm text-semantic-text-muted">
          {t("aiTutor.practice.empty", { defaultValue: "No exercises generated. Try again." })}
        </p>
      )}

      {state.status === "disabled" && (
        <div className="flex items-start gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
          {t("aiTutor.disabled", { defaultValue: "AI Tutor is not available on this server." })}
        </div>
      )}

      {state.status === "error" && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
          {t("aiTutor.error.network", { defaultValue: "Something went wrong. Please try again." })}
        </div>
      )}
    </div>
  );
}
