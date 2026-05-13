import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ScenarioCard } from "@/features/ai-tutor/components/ScenarioCard";
import type { TutorScenarioSummary } from "@/features/ai-tutor/types";

interface Props {
  scenarios: TutorScenarioSummary[] | null;
  isLoading: boolean;
}

export function ScenarioShortcutsRow({ scenarios, isLoading }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div
        data-testid="scenario-shortcuts-skeleton"
        className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-28"
      />
    );
  }

  if (!scenarios || scenarios.length === 0) return null;

  const sorted = [...scenarios].sort((a, b) => {
    if (a.mode === b.mode) return a.title_en.localeCompare(b.title_en);
    return a.mode === "course" ? -1 : 1;
  });
  const visible = sorted.slice(0, 6);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {t("authhome.scenario_shortcuts.heading")}
        </h3>
        <Link
          to="/ai-tutor"
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          {t("authhome.scenario_shortcuts.browse_all")}
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {visible.map((s) => (
          <div key={s.slug} className="min-w-[14rem] flex-shrink-0">
            <ScenarioCard scenario={s} />
          </div>
        ))}
      </div>
    </section>
  );
}
