import { Link } from "react-router-dom";
import type { TutorScenarioSummary } from "@/features/ai-tutor/types";

interface Props {
  scenario: TutorScenarioSummary;
}

/**
 * Compact scenario tile used in the Free Talk grid on the AI Tutor home
 * page. The whole card is a single Link to keep the tap target large on
 * mobile — there is no separate "Start" button.
 */
export function ScenarioCard({ scenario }: Props) {
  return (
    <Link
      to={`/ai-tutor/scenarios/${scenario.slug}/phrasebook`}
      className="block rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900 hover:border-primary-500 transition"
    >
      <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {scenario.title_vi}
      </h4>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {scenario.title_en}
      </p>
    </Link>
  );
}
