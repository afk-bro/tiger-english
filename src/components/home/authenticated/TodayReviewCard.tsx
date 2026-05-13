import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useReviewCount } from "@/features/review/useReviewCount";
import { reportTutorEvent } from "@/features/ai-tutor/api/events";

export function TodayReviewCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { count, isLoading } = useReviewCount();

  if (isLoading) {
    return (
      <div
        data-testid="today-review-skeleton"
        className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-32"
      />
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-3">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {t("authhome.today_review.heading")}
      </h3>
      {count === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("authhome.today_review.empty")}
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {t("authhome.today_review.due_count", { count })}
          </p>
          <button
            onClick={() => {
              void reportTutorEvent('home.review.click', { due_count: count });
              navigate("/review");
            }}
            className="self-start px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
          >
            {t("authhome.today_review.cta")}
          </button>
        </>
      )}
    </div>
  );
}
