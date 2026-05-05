import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, Loader2, AlertCircle } from "lucide-react";
import { aiTutorAPI } from "@/lib/api/aiTutor";
import { useUserStore } from "@/stores/useUserStore";
import { getLearnerLanguage } from "@/features/lessons/utils/learnerLanguage";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; explanation: string }
  | { status: "disabled" }
  | { status: "error"; message: string };

export default function ExplainTab() {
  const { t, i18n } = useTranslation();
  const profile = useUserStore((s) => s.profile);
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  const learnerLanguage = getLearnerLanguage(i18n.language) ?? "en";
  const cefrLevel = profile?.cefr_estimate ?? "A1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setState({ status: "loading" });

    const result = await aiTutorAPI.explain({
      question: question.trim(),
      learner_language: learnerLanguage,
      cefr_level: cefrLevel,
    });

    if (!result) {
      setState({ status: "error", message: t("aiTutor.error.network", { defaultValue: "Something went wrong. Please try again." }) });
    } else if ("code" in result && result.code === "ai_disabled") {
      setState({ status: "disabled" });
    } else if ("explanation" in result) {
      setState({ status: "done", explanation: result.explanation });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor="explain-question" className="text-sm font-medium text-semantic-text">
          {t("aiTutor.explain.label", { defaultValue: "Ask a grammar or vocabulary question" })}
        </label>
        <textarea
          id="explain-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("aiTutor.explain.placeholder", { defaultValue: "e.g. What is present simple?" })}
          rows={3}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-semantic-text px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={state.status === "loading"}
        />
        <button
          type="submit"
          disabled={!question.trim() || state.status === "loading"}
          className="self-end flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {state.status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Send className="w-4 h-4" aria-hidden />
          )}
          {t("aiTutor.explain.submit", { defaultValue: "Ask" })}
        </button>
      </form>

      {state.status === "done" && (
        <div className="rounded-lg bg-semantic-surface-2 p-4 text-sm text-semantic-text whitespace-pre-wrap">
          {state.explanation}
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
          {"message" in state ? state.message : ""}
        </div>
      )}
    </div>
  );
}
