import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type {
  ActiveTutorSessionDTO,
  TutorScenarioSummary,
} from "@/features/ai-tutor/types";

interface Props {
  activeSession: ActiveTutorSessionDTO | null;
  featuredScenario: TutorScenarioSummary | null;
  isLoading: boolean;
}

export function TutorHeroCard({
  activeSession,
  featuredScenario,
  isLoading,
}: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div
        data-testid="tutor-hero-skeleton"
        className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-44"
      />
    );
  }

  const useVi = i18n.language?.startsWith("vi");

  if (activeSession) {
    const title = useVi
      ? activeSession.scenario_title_vi
      : activeSession.scenario_title_en;
    return (
      <div
        data-testid="tutor-hero-active"
        className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-3 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-900"
      >
        <p className="text-xs uppercase tracking-wide text-primary-600 dark:text-primary-400 font-semibold">
          {t("authhome.tutor_hero.active.eyebrow")}
        </p>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("authhome.tutor_hero.active.subtitle", {
            tasks_done: activeSession.tasks_done,
            tasks_total: activeSession.tasks_total,
          })}
        </p>
        <button
          data-testid="tutor-hero-cta"
          onClick={() =>
            navigate(
              `/ai-tutor/scenarios/${activeSession.scenario_slug}/session/${activeSession.session_id}`,
            )
          }
          className="self-start px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
        >
          {t("authhome.tutor_hero.active.cta")}
        </button>
      </div>
    );
  }

  if (featuredScenario) {
    const title = useVi ? featuredScenario.title_vi : featuredScenario.title_en;
    return (
      <div
        data-testid="tutor-hero-featured"
        className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-3"
      >
        <p className="text-xs uppercase tracking-wide text-primary-600 dark:text-primary-400 font-semibold">
          {t("authhome.tutor_hero.featured.eyebrow")}
        </p>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <button
          data-testid="tutor-hero-cta"
          onClick={() =>
            navigate(`/ai-tutor/scenarios/${featuredScenario.slug}/briefing`)
          }
          className="self-start px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
        >
          {t("authhome.tutor_hero.featured.cta")}
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="tutor-hero-cold"
      className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-3"
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {t("authhome.tutor_hero.cold.title")}
      </h2>
      <button
        data-testid="tutor-hero-cta"
        onClick={() => navigate("/ai-tutor")}
        className="self-start px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
      >
        {t("authhome.tutor_hero.cold.cta")}
      </button>
    </div>
  );
}
