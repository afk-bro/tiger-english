import { Clock, MessageCircle, Lock } from "lucide-react";
import { CefrBadge } from "@/components/CefrBadge";
import type { ConversationScenario } from "../conversations.types";

interface Props {
  scenario: ConversationScenario;
  onStart?: (scenario: ConversationScenario) => void;
  /** When true, the start button is replaced with an upgrade prompt (Feature 54: free-plan gating). */
  planLocked?: boolean;
}

export function ScenarioCard({ scenario, onStart, planLocked = false }: Props) {
  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header: title + level badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-semantic-text leading-snug">
          {scenario.title}
        </h3>
        <CefrBadge level={scenario.level} size="sm" className="flex-shrink-0" />
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
        {scenario.description}
      </p>

      {/* Vocab chips (first 3) */}
      <div className="flex flex-wrap gap-1">
        {scenario.target_vocabulary.slice(0, 3).map((word) => (
          <span
            key={word}
            className="inline-block px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs"
          >
            {word}
          </span>
        ))}
        {scenario.target_vocabulary.length > 3 && (
          <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs">
            +{scenario.target_vocabulary.length - 3} more
          </span>
        )}
      </div>

      {/* Footer: estimated time + start button */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
          <Clock className="w-3 h-3" />
          {scenario.estimated_minutes} min
        </span>
        {planLocked ? (
          <button
            type="button"
            title="Upgrade your plan to access AI conversations"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 text-xs font-medium cursor-not-allowed"
            onClick={() => alert("Upgrade your plan to access AI conversation missions. Contact us at contact@gainenglish.com")}
          >
            <Lock className="w-3.5 h-3.5" />
            Upgrade to unlock
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onStart?.(scenario)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Start mission
          </button>
        )}
      </div>
    </div>
  );
}
