import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Circle, CircleDot, CheckCircle, Clock } from "lucide-react";
import { clsx } from "clsx";
import type { SectionMeta } from "../lesson.types";
import type { SectionProgress } from "../useLessonProgressStore";

type Props = { section: SectionMeta; unitSlug: string; progress: SectionProgress };

export default function SectionCard({ section, unitSlug, progress }: Props) {
  const { t } = useTranslation();
  const StatusIcon = progress.completed ? CheckCircle : progress.visited ? CircleDot : Circle;
  const statusColor = progress.completed ? "text-accent-500" : progress.visited ? "text-semantic-text-muted" : "text-semantic-subtle";

  return (
    <Link to={`/lessons/${unitSlug}/${section.key}`} className="card card-interactive flex items-center gap-4 p-4">
      <StatusIcon className={clsx("w-5 h-5 flex-shrink-0", statusColor)} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-semantic-text">{section.title}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-semantic-subtle flex-shrink-0">
        <Clock className="w-3 h-3" aria-hidden="true" />
        {t("lessons.card.estMinutes", { count: section.estimatedMinutes })}
      </div>
    </Link>
  );
}
