import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, Lock } from "lucide-react";
import type { Unit } from "../lesson.types";
import { getLearnerLanguage } from "../utils/learnerLanguage";

type Props = { unit: Unit };

export default function UnitCard({ unit }: Props) {
  const { t, i18n } = useTranslation();
  const learnerLang = getLearnerLanguage(i18n.language);
  const localized = learnerLang ? unit.translations[learnerLang] : undefined;
  const title = localized?.title || unit.title;
  const topic = localized?.topic || unit.topic;
  const grammarFocus = localized?.grammarFocus || unit.grammarFocus;

  const isAvailable = unit.status === "available";
  const isLocked = unit.status === "locked";

  const className = `block ${
    isAvailable ? "card card-interactive" : "card opacity-60 cursor-not-allowed"
  }`;

  const statusBadge = (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
      isAvailable
        ? "bg-semantic-success/10 text-semantic-success"
        : "bg-semantic-surface-2 text-semantic-text-muted"
    }`}>
      {(isLocked || !isAvailable) && <Lock className="w-3 h-3" aria-hidden="true" />}
      {isAvailable ? t("lessons.status.available") : isLocked ? t("lessons.status.locked") : t("lessons.status.comingSoon")}
    </span>
  );

  const content = (
    <>
      <div className="flex items-start justify-between mb-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold">
          {unit.number}
        </span>
        {statusBadge}
      </div>
      <h2 className="text-lg font-semibold text-semantic-text mb-1">{title}</h2>
      <p className="text-sm text-semantic-text-muted mb-2">{topic}</p>
      <p className="text-xs text-semantic-subtle mb-4">{grammarFocus}</p>
      <div className="flex items-center gap-1 text-xs text-semantic-subtle">
        <Clock className="w-3 h-3" aria-hidden="true" />
        {t("lessons.card.estMinutes", { count: unit.estimatedMinutes })}
      </div>
    </>
  );

  if (isAvailable) {
    return <Link to={`/lessons/${unit.slug}`} className={className}>{content}</Link>;
  }
  return <div className={className} aria-disabled="true">{content}</div>;
}
