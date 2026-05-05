/**
 * OutputTaskBlock — free-writing task with live word count and "Get feedback" button.
 *
 * Used in lesson activities sections. Optionally integrates with the AI tutor
 * writing-coach endpoint (when available) via the "Get feedback" CTA.
 */
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { PenLine, SendHorizontal } from "lucide-react";
import clsx from "clsx";

interface Props {
  prompt: string;
  minWords?: number;
  maxWords?: number;
  translations?: Partial<Record<string, string>>;
}

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export default function OutputTaskBlock({ prompt, minWords = 20, maxWords = 80 }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [feedbackState, setFeedbackState] = useState<"idle" | "pending" | "done">("idle");

  const wordCount = countWords(text);
  const meetsMin = wordCount >= minWords;
  const exceedsMax = wordCount > maxWords;
  const progress = Math.min((wordCount / maxWords) * 100, 100);

  const handleFeedback = useCallback(() => {
    if (!meetsMin) return;
    setFeedbackState("pending");
    // Stub: in a full implementation this calls POST /api/v1/me/ai-tutor/writing-coach
    // For now, simulate a short delay then show a generic message
    setTimeout(() => setFeedbackState("done"), 1200);
  }, [meetsMin]);

  return (
    <div className="rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10 p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <PenLine className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" aria-hidden />
        <span className="text-sm font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wide">
          {t("lessons.outputTask.label", { defaultValue: "Writing task" })}
        </span>
      </div>

      {/* Prompt */}
      <p className="text-sm text-semantic-text mb-4 leading-relaxed">{prompt}</p>

      {/* Word target row */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {t("lessons.outputTask.target", {
            min: minWords,
            max: maxWords,
            defaultValue: `Target: ${minWords}–${maxWords} words`,
          })}
        </span>
        <div className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className={clsx(
              "h-full rounded-full transition-all",
              exceedsMax
                ? "bg-red-500"
                : meetsMin
                ? "bg-green-500"
                : "bg-primary-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span
          className={clsx(
            "text-xs font-medium tabular-nums",
            exceedsMax
              ? "text-red-500"
              : meetsMin
              ? "text-green-600 dark:text-green-400"
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          {wordCount}/{maxWords}
        </span>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (feedbackState === "done") setFeedbackState("idle");
        }}
        rows={5}
        placeholder={t("lessons.outputTask.placeholder", { defaultValue: "Write your response here…" })}
        className={clsx(
          "w-full text-sm rounded-lg border p-3 bg-white dark:bg-gray-900 text-semantic-text placeholder-gray-400 resize-y focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors",
          exceedsMax
            ? "border-red-300 dark:border-red-700"
            : "border-gray-200 dark:border-gray-700"
        )}
      />

      {/* Footer: word count + feedback button */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {t("lessons.outputTask.wordCount", {
            count: wordCount,
            defaultValue: `${wordCount} word${wordCount !== 1 ? "s" : ""}`,
          })}
        </span>

        <button
          type="button"
          disabled={!meetsMin || feedbackState === "pending"}
          onClick={handleFeedback}
          className={clsx(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
            meetsMin
              ? "bg-primary-600 hover:bg-primary-700 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          )}
        >
          {feedbackState === "pending" ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              {t("lessons.outputTask.getting_feedback", { defaultValue: "Getting feedback…" })}
            </>
          ) : (
            <>
              <SendHorizontal className="w-3.5 h-3.5" />
              {t("lessons.outputTask.get_feedback", { defaultValue: "Get feedback" })}
            </>
          )}
        </button>
      </div>

      {/* Feedback result (stub) */}
      {feedbackState === "done" && (
        <div className="mt-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-800 dark:text-green-300">
          ✅{" "}
          {t("lessons.outputTask.feedbackPlaceholder", {
            defaultValue: "Great effort! Enable the AI Tutor to get personalized writing feedback.",
          })}
        </div>
      )}
    </div>
  );
}
