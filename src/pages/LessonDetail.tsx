import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Wrench, ArrowLeft } from "lucide-react";
import { findUnitBySlug } from "@/data/units";

const OUTLINE_SECTIONS = [
  "overview",
  "grammar",
  "vocabulary",
  "dialogues",
  "activities",
] as const;

const BACK_LINK_CLASS =
  "inline-flex items-center gap-2 text-sm text-semantic-text-muted hover:text-primary-600 dark:hover:text-primary-400 mb-4";

export default function LessonDetail() {
  const { t } = useTranslation();
  const { unitSlug } = useParams<{ unitSlug: string }>();
  const unit = unitSlug ? findUnitBySlug(unitSlug) : undefined;

  if (!unit) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-semantic-text mb-3">
          {t("lessons.notFound")}
        </h1>
        <Link
          to="/lessons"
          className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t("lessons.backToLessons")}
        </Link>
      </div>
    );
  }

  if (unit.status === "coming-soon") {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Link to="/lessons" className={BACK_LINK_CLASS}>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t("lessons.backToLessons")}
        </Link>
        <h1 className="text-2xl font-bold text-semantic-text mb-3">
          {t("lessons.unitShort", { number: unit.number })} — {unit.title}
        </h1>
        <p className="text-semantic-text-muted">
          {t("lessons.comingSoonMessage")}
        </p>
      </div>
    );
  }

  // Available unit — real route, scaffold content.
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link to="/lessons" className={BACK_LINK_CLASS}>
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {t("lessons.backToLessons")}
      </Link>

      <div
        role="note"
        className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/20 p-4 mb-6"
      >
        <Wrench
          className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            {t("lessons.detail.building_title")}
          </p>
          <p className="text-sm text-amber-800 dark:text-amber-300/90 mt-0.5">
            {t("lessons.detail.building_subtitle")}
          </p>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-semantic-text mb-1">
        {t("lessons.unitShort", { number: unit.number })} — {unit.title}
      </h1>
      <p className="text-semantic-text-muted mb-1">{unit.topic}</p>
      <p className="text-sm text-semantic-subtle mb-8">
        {unit.grammarFocus}
      </p>

      <div className="card card-lg">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-semantic-text-muted mb-4">
          {t("lessons.detail.outline_heading")}
        </h2>
        <ul className="space-y-3">
          {OUTLINE_SECTIONS.map((key) => (
            <li
              key={key}
              className="flex items-center gap-3 text-semantic-text-muted"
            >
              <span
                className="inline-block w-5 h-5 rounded border border-semantic-border flex-shrink-0"
                aria-hidden="true"
              />
              <span>{t(`lessons.detail.sections.${key}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
