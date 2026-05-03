import { useState } from "react";
import { CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import { useLocalizedContent } from "@/features/lessons/utils/useLocalizedContent";
import type { FillBlankExercise } from "./exercises.types";

type Props = {
  exercise: FillBlankExercise;
  onCorrect?: () => void;
};

export default function FillBlank({ exercise, onCorrect }: Props) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const allAcceptable = [
    exercise.correctAnswer,
    ...(exercise.acceptableAnswers ?? []),
  ];
  const normalized = (s: string) =>
    s.toLowerCase().trim().replace(/['‘’]/g, "");
  const isStrictMatch = allAcceptable.some(
    (a) => a.toLowerCase().trim() === value.toLowerCase().trim(),
  );
  const isLenientMatch =
    !isStrictMatch &&
    allAcceptable.some((a) => normalized(a) === normalized(value));
  const isCorrect = isStrictMatch || isLenientMatch;
  const showApostropheReminder = isLenientMatch;
  const { t } = useTranslation();
  const localizedInstruction = useLocalizedContent(
    exercise.instruction ?? "",
    exercise.instructionTranslations,
  );

  function handleSubmit() {
    if (value.trim() === "") return;
    setSubmitted(true);
    if (isCorrect) {
      onCorrect?.();
    }
  }

  function handleReset() {
    setValue("");
    setSubmitted(false);
  }

  return (
    <div className="space-y-4">
      {exercise.instruction && (
        <p className="text-base font-medium text-semantic-text">
          {localizedInstruction}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 text-base text-semantic-text">
        <span>{exercise.beforeBlank}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={submitted}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          className={clsx(
            "w-32 px-3 py-1.5 rounded-lg border text-center text-sm font-medium",
            !submitted && "border-semantic-border bg-semantic-surface text-semantic-text focus:border-primary-500 focus:ring-1 focus:ring-primary-500",
            submitted && isCorrect && "border-semantic-success bg-semantic-success/10 text-semantic-success",
            submitted && !isCorrect && "border-red-400 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-400",
          )}
          placeholder="..."
          aria-label={t("lessons.exercises.fillInTheBlank")}
        />
        <span>{exercise.afterBlank}</span>
      </div>
      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={value.trim() === ""}
          className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t("lessons.exercises.check")}
        </button>
      )}
      {submitted && (
        <div className="flex items-center justify-between">
          <div
            className={clsx(
              "flex items-center gap-2 text-sm font-medium",
              isCorrect ? "text-semantic-success" : "text-red-600 dark:text-red-400",
            )}
          >
            {isCorrect ? (
              <>
                <CheckCircle className="w-4 h-4" aria-hidden="true" />
                {t("lessons.exercises.correct")}
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" aria-hidden="true" />
                {t("lessons.exercises.incorrect")}
              </>
            )}
          </div>
          {!isCorrect && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              {t("lessons.exercises.tryAgain")}
            </button>
          )}
        </div>
      )}
      {submitted && showApostropheReminder && (
        <p className="text-sm text-semantic-success">
          {t("lessons.exercises.apostropheReminder", { form: exercise.correctAnswer })}
        </p>
      )}
    </div>
  );
}
