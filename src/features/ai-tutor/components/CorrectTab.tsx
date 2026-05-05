import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { aiTutorAPI } from "@/lib/api/aiTutor";
import { useUserStore } from "@/stores/useUserStore";
import { getLearnerLanguage } from "@/features/lessons/utils/learnerLanguage";
import type { CorrectionResponse } from "@/lib/api/aiTutor";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; data: CorrectionResponse }
  | { status: "disabled" }
  | { status: "error" };

export default function CorrectTab() {
  const { t, i18n } = useTranslation();
  const profile = useUserStore((s) => s.profile);
  const [sentence, setSentence] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  const learnerLanguage = getLearnerLanguage(i18n.language) ?? "en";
  const cefrLevel = profile?.cefr_estimate ?? "A1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sentence.trim()) return;
    setState({ status: "loading" });

    const result = await aiTutorAPI.correct({
      sentence: sentence.trim(),
      learner_language: learnerLanguage,
      cefr_level: cefrLevel,
    });

    if (!result) {
      setState({ status: "error" });
    } else if ("code" in result && result.code === "ai_disabled") {
      setState({ status: "disabled" });
    } else if ("corrected" in result) {
      setState({ status: "done", data: result });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor="correct-sentence" className="text-sm font-medium text-semantic-text">
          {t("aiTutor.correct.label", { defaultValue: "Enter a sentence to check" })}
        </label>
        <textarea
          id="correct-sentence"
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          placeholder={t("aiTutor.correct.placeholder", { defaultValue: "e.g. I go to market yesterday" })}
          rows={3}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-semantic-text px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={state.status === "loading"}
        />
        <button
          type="submit"
          disabled={!sentence.trim() || state.status === "loading"}
          className="self-end flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {state.status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <CheckCircle className="w-4 h-4" aria-hidden />
          )}
          {t("aiTutor.correct.submit", { defaultValue: "Correct" })}
        </button>
      </form>

      {state.status === "done" && (
        <div className="flex flex-col gap-3 text-sm">
          <Block label={t("aiTutor.correct.result.original", { defaultValue: "Your sentence" })} content={state.data.original} variant="neutral" />
          <Block label={t("aiTutor.correct.result.corrected", { defaultValue: "Better sentence" })} content={state.data.corrected} variant="success" />
          <Block label={t("aiTutor.correct.result.explanation", { defaultValue: "Why" })} content={state.data.explanation} variant="neutral" />
          {state.data.explanation_l1 && state.data.explanation_l1 !== state.data.explanation && (
            <Block label={t("aiTutor.correct.result.explanation_l1", { defaultValue: "In your language" })} content={state.data.explanation_l1} variant="neutral" />
          )}
          {state.data.try_again_prompt && (
            <div className="rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-3">
              <p className="font-medium text-primary-700 dark:text-primary-300 mb-1">
                {t("aiTutor.correct.result.try_again", { defaultValue: "Try again" })}
              </p>
              <p className="text-semantic-text">{state.data.try_again_prompt}</p>
              <details className="mt-2">
                <summary className="text-xs text-semantic-text-muted cursor-pointer">
                  {t("aiTutor.correct.result.show_answer", { defaultValue: "Show answer" })}
                </summary>
                <p className="mt-1 font-medium text-semantic-text">{state.data.try_again_answer}</p>
              </details>
            </div>
          )}
        </div>
      )}

      {state.status === "disabled" && <DisabledNotice t={t} />}
      {state.status === "error" && <ErrorNotice t={t} />}
    </div>
  );
}

function Block({ label, content, variant }: { label: string; content: string; variant: "neutral" | "success" }) {
  const bg = variant === "success"
    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
    : "bg-semantic-surface-2 border-gray-200 dark:border-gray-700";
  return (
    <div className={`rounded-lg border p-3 ${bg}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-semantic-text-muted mb-1">{label}</p>
      <p className="text-semantic-text">{content}</p>
    </div>
  );
}

function DisabledNotice({ t }: { t: ReturnType<typeof import("react-i18next").useTranslation>["t"] }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-200">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
      {t("aiTutor.disabled", { defaultValue: "AI Tutor is not available on this server." })}
    </div>
  );
}

function ErrorNotice({ t }: { t: ReturnType<typeof import("react-i18next").useTranslation>["t"] }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
      {t("aiTutor.error.network", { defaultValue: "Something went wrong. Please try again." })}
    </div>
  );
}
