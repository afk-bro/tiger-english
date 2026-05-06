/**
 * AiMissionBlock — renders an AI conversation mission CTA inside a lesson section.
 * Shows title, description, estimated time, and a "Start mission" button that
 * navigates to /conversations/:slug.
 */
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageSquare, Clock, ArrowRight } from "lucide-react";
import CefrBadge from "@/components/CefrBadge";
import type { CefrLevel } from "../../lesson.types";

type Props = {
  scenarioSlug: string;
  title: string;
  description: string;
  estimatedMinutes?: number;
  cefrLevel?: CefrLevel;
};

export default function AiMissionBlock({ scenarioSlug, title, description, estimatedMinutes, cefrLevel = "A1" }: Props) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border-2 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/40 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
              {t("lessons.aiMission.label", { defaultValue: "AI Mission" })}
            </p>
            <h3 className="text-sm font-semibold text-semantic-text leading-tight">{title}</h3>
          </div>
        </div>
        <CefrBadge level={cefrLevel} />
      </div>

      {/* Description */}
      <p className="text-sm text-semantic-text-muted leading-relaxed">{description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3">
        {estimatedMinutes && (
          <div className="flex items-center gap-1 text-xs text-semantic-text-muted">
            <Clock className="w-3.5 h-3.5" aria-hidden />
            <span>
              {t("lessons.aiMission.duration", {
                count: estimatedMinutes,
                defaultValue: `~${estimatedMinutes} min`,
              })}
            </span>
          </div>
        )}
        <Link
          to={`/conversations/${scenarioSlug}`}
          className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          {t("lessons.aiMission.startButton", { defaultValue: "Start mission" })}
          <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
