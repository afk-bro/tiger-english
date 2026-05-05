import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PenLine, Loader2, AlertCircle } from "lucide-react";
import { aiTutorAPI } from "@/lib/api/aiTutor";
import { useUserStore } from "@/stores/useUserStore";
import { getLearnerLanguage } from "@/features/lessons/utils/learnerLanguage";
import type { WritingCoachResponse } from "@/lib/api/aiTutor";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; data: WritingCoachResponse }
  | { status: "disabled" }
  | { status: "error" };

export default function WritingCoachTab() {
  const { t, i18n } = useTranslation();
  const profile = useUserStore((s) => s.profile);
  const [text, setText] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  const learnerLanguage = getLearnerLanguage(i18n.language) ?? "en";
  const cefrLevel = profile?.cefr_estimate ?? "A1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 10) return;
    setState({ status: "loading" });

    const result = await aiTutorAPI.writingCoach({
      text: text.trim(),
      learner_language: learnerLanguage,
      cefr_level: cefrLevel,
    });

    if (!result) {
      setState({ status: "error" });
    } else if ("code" in result && result.code === "ai_disabled") {
      setState({ status: "disabled" });
    } else if ("scores" in result) {
      setState({ status: "done", data: result });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor="writing-text" className="text-sm font-medium text-semantic-text">
          {t("aiTutor.writingCoach.label", { defaultValue: "Paste your writing for feedback" })}
        </label>
        <textarea
          id="writing-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("aiTutor.writingCoach.placeholder", {
            defaultValue: "e.g. Yesterday I go to market and buyed some food.",
          })}
          rows={5}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-semantic-text px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={state.status === "loading"}
        />
        <button
          type="submit"
          disabled={text.trim().length < 10 || state.status === "loading"}
          className="self-end flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {state.status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <PenLine className="w-4 h-4" aria-hidden />
          )}
          {t("aiTutor.writingCoach.submit", { defaultValue: "Get Feedback" })}
        </button>
      </form>

      {state.status === "done" && (
        <div className="flex flex-col gap-4 text-sm">
          {/* Scores */}
          {state.data.scores.length > 0 && (
            <div>
              <p className="font-semibold text-semantic-text mb-2">
                {t("aiTutor.writingCoach.scores", { defaultValue: "Skill scores" })}
              </p>
              <div className="flex flex-col gap-2">
                {state.data.scores.map((score, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg bg-semantic-surface-2 p-3">
                    <div className="flex-shrink-0 w-10 text-center">
                      <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                        {score.score}
                      </span>
                      <span className="text-xs text-semantic-text-muted">/10</span>
                    </div>
                    <div>
                      <p className="font-medium text-semantic-text">{score.skill}</p>
                      <p className="text-semantic-text-muted">{score.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rewritten exemplar */}
          {state.data.rewritten_exemplar && (
            <div>
              <p className="font-semibold text-semantic-text mb-2">
                {t("aiTutor.writingCoach.rewritten", { defaultValue: "Improved version" })}
              </p>
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3 text-semantic-text whitespace-pre-wrap">
                {state.data.rewritten_exemplar}
              </div>
            </div>
          )}

          {/* Inline annotations */}
          {state.data.inline_annotations.length > 0 && (
            <div>
              <p className="font-semibold text-semantic-text mb-2">
                {t("aiTutor.writingCoach.annotations", { defaultValue: "Corrections" })}
              </p>
              <ul className="flex flex-col gap-2" aria-label="writing annotations">
                {state.data.inline_annotations.map((ann, i) => (
                  <li key={i} className="rounded-lg bg-semantic-surface-2 p-3">
                    <p className="text-semantic-text-muted mb-0.5">{ann.issue}</p>
                    <p className="font-medium text-semantic-text">
                      {t("aiTutor.writingCoach.suggestion", { defaultValue: "Suggestion" })}:{" "}
                      <span className="text-green-700 dark:text-green-400">{ann.suggestion}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
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
