import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { clsx } from "clsx";
import { SECTION_ORDER, type SectionKey } from "../lesson.types";

type Props = {
  unitSlug: string;
  currentSection: SectionKey;
  completed: boolean;
  onToggleComplete: () => void;
  isLastSection: boolean;
  nextUnit?: { slug: string; ctaText: string };
};

export default function SectionNav({
  unitSlug,
  currentSection,
  completed,
  onToggleComplete,
  isLastSection,
  nextUnit,
}: Props) {
  const { t } = useTranslation();
  const currentIndex = SECTION_ORDER.indexOf(currentSection);
  const prevSection = currentIndex > 0 ? SECTION_ORDER[currentIndex - 1] : null;
  const nextSection = !isLastSection ? SECTION_ORDER[currentIndex + 1] : null;

  return (
    <div className="mt-12 pt-6 border-t border-semantic-border space-y-4">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onToggleComplete}
          className={clsx(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
            completed
              ? "bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400"
              : "bg-semantic-surface-2 text-semantic-text hover:bg-semantic-surface-2/80",
          )}
        >
          {completed && <Check className="w-4 h-4" aria-hidden="true" />}
          {completed ? t("lessons.section.completed") : t("lessons.section.markComplete")}
        </button>
      </div>
      <div className="flex items-center justify-between">
        {prevSection ? (
          <Link to={`/lessons/${unitSlug}/${prevSection}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t("lessons.section.previous")}
          </Link>
        ) : <div />}
        {nextSection ? (
          <Link to={`/lessons/${unitSlug}/${nextSection}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors">
            {t("lessons.section.next")}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        ) : nextUnit ? (
          <Link to={`/lessons/${nextUnit.slug}/overview`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 shadow-md transition-colors">
            {nextUnit.ctaText}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        ) : (
          <Link to={`/lessons/${unitSlug}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors">
            {t("lessons.section.backToUnit")}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      {isLastSection && !nextUnit && (
        <div className="flex flex-col items-center gap-1 pt-2">
          <p className="text-sm text-semantic-text-muted">{t("lessons.section.allUnitsCompletedMessage")}</p>
          <Link to="/lessons" className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t("lessons.section.backToLessons")}
          </Link>
        </div>
      )}
    </div>
  );
}
