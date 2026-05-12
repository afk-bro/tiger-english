import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TutorScenarioSummary } from "@/features/ai-tutor/types";

interface Props {
  scenario: TutorScenarioSummary;
}

/**
 * Hero / featured-lesson card rendered above the Free Talk grid on the
 * AI Tutor home page. Visually emphasises the Vietnamese title (the
 * learner's L1) with the English title underneath as supporting context.
 */
export function FeaturedLessonCard({ scenario }: Props) {
  const { t } = useTranslation();

  return (
    <article className="relative rounded-2xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-900">
      {scenario.is_free && (
        <span className="absolute top-3 right-3 px-2 py-0.5 text-xs font-semibold rounded-full bg-accent-100 text-accent-700">
          {t("tutor.home.freePill", { defaultValue: "Free" })}
        </span>
      )}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        {scenario.title_vi}
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {scenario.title_en}
      </p>
      <Link
        to={`/ai-tutor/scenarios/${scenario.slug}/phrasebook`}
        className="mt-4 inline-flex items-center justify-center w-full px-4 py-2 rounded-md bg-primary-500 text-white text-sm font-medium hover:bg-primary-600"
      >
        {t("tutor.home.start", { defaultValue: "Start" })}
      </Link>
    </article>
  );
}
