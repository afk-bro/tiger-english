/**
 * ReviewDrillCard — shows a single review item as a drill card.
 *
 * Flow:
 *   1. Learner sees the prompt, types answer, clicks Submit (or presses Enter)
 *   2. Answer is revealed; correct answer shown alongside learner's answer
 *   3. Difficulty buttons: Incorrect / Difficult / Got it / Easy
 *   4. onRate(difficulty) is called → parent advances to next item
 */
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle, XCircle } from "lucide-react";
import type { DifficultyRating, ReviewItem } from "../review.types";

type Phase = "input" | "revealed";

type Props = {
  item: ReviewItem;
  index: number;
  total: number;
  onRate: (difficulty: DifficultyRating) => void;
};

const DIFFICULTY_BUTTONS: { key: DifficultyRating; labelKey: string; defaultLabel: string; className: string }[] = [
  { key: "incorrect", labelKey: "review.difficulty.incorrect", defaultLabel: "Incorrect", className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50" },
  { key: "difficult", labelKey: "review.difficulty.difficult", defaultLabel: "Difficult", className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50" },
  { key: "got_it",    labelKey: "review.difficulty.got_it",   defaultLabel: "Got it",    className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50" },
  { key: "easy",      labelKey: "review.difficulty.easy",     defaultLabel: "Easy",      className: "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50" },
];

export default function ReviewDrillCard({ item, index, total, onRate }: Props) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("input");
  const [userAnswer, setUserAnswer] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset when the item changes
  useEffect(() => {
    setPhase("input");
    setUserAnswer("");
    inputRef.current?.focus();
  }, [item.id]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPhase("revealed");
  }

  const isCorrect =
    phase === "revealed" &&
    userAnswer.trim().toLowerCase() === item.answer.trim().toLowerCase();

  return (
    <div className="flex flex-col gap-5" data-testid="review-drill-card">
      {/* Progress bar */}
      <div aria-label={t("review.progress.label", { defaultValue: "Review progress" })}>
        <div className="flex items-center justify-between text-xs text-semantic-text-muted mb-1">
          <span>{t("review.progress.count", { current: index + 1, total, defaultValue: `${index + 1} / ${total}` })}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-[width] duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="card p-6 flex flex-col gap-4">
        {/* Item type badge */}
        <span className="text-xs font-medium uppercase tracking-wide text-semantic-text-muted">
          {t(`review.itemType.${item.item_type}`, { defaultValue: item.item_type.replace(/_/g, " ") })}
        </span>

        {/* Prompt */}
        <p className="text-xl font-semibold text-semantic-text leading-snug">
          {item.prompt}
        </p>

        {/* Translation hint */}
        {item.translation && (
          <p className="text-sm text-semantic-text-muted italic">{item.translation}</p>
        )}

        {/* Input phase */}
        {phase === "input" && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder={t("review.input.placeholder", { defaultValue: "Type your answer…" })}
              aria-label={t("review.input.label", { defaultValue: "Your answer" })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-semantic-text px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              disabled={!userAnswer.trim()}
              className="self-end px-5 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t("review.input.submit", { defaultValue: "Submit" })}
            </button>
          </form>
        )}

        {/* Revealed phase */}
        {phase === "revealed" && (
          <div className="flex flex-col gap-3">
            {/* User answer with correct/incorrect indicator */}
            <div className={`flex items-start gap-2 rounded-lg p-3 ${
              isCorrect
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}>
              {isCorrect
                ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden />
                : <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden />
              }
              <div>
                <p className="text-xs text-semantic-text-muted mb-0.5">
                  {t("review.reveal.yourAnswer", { defaultValue: "Your answer" })}
                </p>
                <p className={`font-medium ${isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                  {userAnswer || <em className="opacity-60">{t("review.reveal.blank", { defaultValue: "(blank)" })}</em>}
                </p>
              </div>
            </div>

            {/* Correct answer */}
            {!isCorrect && (
              <div className="rounded-lg bg-semantic-surface-2 p-3">
                <p className="text-xs text-semantic-text-muted mb-0.5">
                  {t("review.reveal.correctAnswer", { defaultValue: "Correct answer" })}
                </p>
                <p className="font-semibold text-semantic-text">{item.answer}</p>
              </div>
            )}

            {/* Note */}
            {item.note && (
              <p className="text-sm text-semantic-text-muted italic">{item.note}</p>
            )}

            {/* Difficulty buttons */}
            <div
              role="group"
              aria-label={t("review.difficulty.label", { defaultValue: "How did that go?" })}
              className="grid grid-cols-4 gap-2 pt-1"
            >
              {DIFFICULTY_BUTTONS.map(({ key, labelKey, defaultLabel, className }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onRate(key)}
                  className={`py-2 px-1 rounded-lg text-sm font-medium transition-colors ${className}`}
                >
                  {t(labelKey, { defaultValue: defaultLabel })}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
