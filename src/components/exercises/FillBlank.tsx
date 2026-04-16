// src/components/exercises/FillBlank.tsx
import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { clsx } from "clsx";
import type { FillBlankExercise } from "./exercises.types";

type Props = {
  exercise: FillBlankExercise;
};

export default function FillBlank({ exercise }: Props) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const allAcceptable = [
    exercise.correctAnswer,
    ...(exercise.acceptableAnswers ?? []),
  ];
  const isCorrect = allAcceptable.some(
    (a) => a.toLowerCase().trim() === value.toLowerCase().trim(),
  );

  function handleSubmit() {
    if (value.trim() === "") return;
    setSubmitted(true);
  }

  return (
    <div className="space-y-4">
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
          aria-label="Fill in the blank"
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
          Check
        </button>
      )}
      {submitted && (
        <div
          className={clsx(
            "flex items-center gap-2 text-sm font-medium",
            isCorrect ? "text-semantic-success" : "text-red-600 dark:text-red-400",
          )}
        >
          {isCorrect ? (
            <>
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
              Correct!
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" aria-hidden="true" />
              Incorrect
            </>
          )}
        </div>
      )}
    </div>
  );
}
