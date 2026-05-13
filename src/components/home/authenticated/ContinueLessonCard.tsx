import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export function ContinueLessonCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-3">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {t("authhome.continue_lesson.heading")}
      </h3>
      <button
        type="button"
        onClick={() => navigate("/lessons")}
        className="self-start px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
      >
        {t("authhome.continue_lesson.cta")}
      </button>
    </div>
  );
}
