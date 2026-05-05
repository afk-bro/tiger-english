/**
 * ReviewSessionSummary — shown after all review items are answered.
 */
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { CheckCircle, Clock, ArrowLeft } from "lucide-react";
import type { ReviewSessionResult } from "../review.types";

type Props = {
  result: ReviewSessionResult;
  onPracticeAhead?: () => void;
};

export default function ReviewSessionSummary({ result, onPracticeAhead }: Props) {
  const { t } = useTranslation();
  const accuracy =
    result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4 text-center" data-testid="review-summary">
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" aria-hidden />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-semantic-text mb-1">
          {t("review.summary.heading", { defaultValue: "Review complete!" })}
        </h2>
        <p className="text-semantic-text-muted">
          {t("review.summary.accuracy", { accuracy, defaultValue: `${accuracy}% accuracy` })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        <StatBox
          value={result.correct}
          label={t("review.summary.correct", { defaultValue: "Correct" })}
          color="text-green-600 dark:text-green-400"
        />
        <StatBox
          value={result.incorrect}
          label={t("review.summary.incorrect", { defaultValue: "Incorrect" })}
          color="text-red-600 dark:text-red-400"
        />
        <StatBox
          value={result.total}
          label={t("review.summary.total", { defaultValue: "Total" })}
          color="text-semantic-text"
        />
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          to="/dashboard"
          className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          {t("review.summary.backToDashboard", { defaultValue: "Back to Dashboard" })}
        </Link>
        {onPracticeAhead && (
          <button
            type="button"
            onClick={onPracticeAhead}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-semantic-text font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Clock className="w-4 h-4" aria-hidden />
            {t("review.summary.practiceAhead", { defaultValue: "Practice ahead" })}
          </button>
        )}
      </div>
    </div>
  );
}

function StatBox({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="rounded-lg bg-semantic-surface-2 p-3 flex flex-col items-center">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-semantic-text-muted mt-0.5">{label}</span>
    </div>
  );
}
