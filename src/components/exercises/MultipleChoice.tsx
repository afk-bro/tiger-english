import { useState } from "react";
import { CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import { useLocalizedContent } from "@/features/lessons/utils/useLocalizedContent";
import type { McqExercise } from "./exercises.types";

type Props = {
  exercise: McqExercise;
  onCorrect?: () => void;
  onAttempt?: (isCorrect: boolean) => void;
};

export default function MultipleChoice({ exercise, onCorrect, onAttempt }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const answered = selectedId !== null;
  const isCorrect = selectedId === exercise.correctOptionId;
  const { t } = useTranslation();
  const localizedQuestion = useLocalizedContent(exercise.question, exercise.questionTranslations);

  function handleSelect(optionId: string) {
    setSelectedId(optionId);
    const correct = optionId === exercise.correctOptionId;
    onAttempt?.(correct);
    if (correct) {
      onCorrect?.();
    }
  }

  function handleReset() {
    setSelectedId(null);
  }

  return (
    <div className="space-y-4">
      <p className="text-base font-medium text-semantic-text">
        {localizedQuestion}
      </p>
      <div className="space-y-2">
        {exercise.options.map((option) => {
          const isSelected = option.id === selectedId;
          const isCorrectOption = option.id === exercise.correctOptionId;

          return (
            <button
              key={option.id}
              type="button"
              disabled={answered}
              onClick={() => handleSelect(option.id)}
              className={clsx(
                "w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors",
                !answered && "border-semantic-border bg-semantic-surface hover:bg-semantic-surface-2 text-semantic-text",
                answered && isSelected && isCorrect && "border-semantic-success bg-semantic-success/10 text-semantic-success",
                answered && isSelected && !isCorrect && "border-red-400 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-400",
                answered && !isSelected && isCorrectOption && "border-semantic-success/50 bg-semantic-success/5 text-semantic-text",
                answered && !isSelected && !isCorrectOption && "border-semantic-border bg-semantic-surface text-semantic-text-muted opacity-60",
              )}
            >
              {option.text}
            </button>
          );
        })}
      </div>
      {answered && (
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
    </div>
  );
}
