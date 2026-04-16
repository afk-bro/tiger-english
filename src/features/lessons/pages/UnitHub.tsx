import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { getUnit } from "../data/getUnit";
import SectionCard from "../components/SectionCard";
import { useLessonProgressStore } from "../useLessonProgressStore";
import { SECTION_ORDER, type SectionKey } from "../lesson.types";

export default function UnitHub() {
  const { t } = useTranslation();
  const { unitSlug } = useParams<{ unitSlug: string }>();
  const navigate = useNavigate();
  const unit = unitSlug ? getUnit(unitSlug) : undefined;
  const getSectionProgress = useLessonProgressStore((s) => s.getSectionProgress);
  const lastVisitedMap = useLessonProgressStore((s) => s.lastVisitedSectionKey);

  if (!unit) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-semantic-text mb-3">{t("lessons.notFound")}</h1>
        <Link to="/lessons" className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t("lessons.backToLessons")}
        </Link>
      </div>
    );
  }

  if (unit.status === "coming-soon") {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Link to="/lessons" className="inline-flex items-center gap-2 text-sm text-semantic-text-muted hover:text-primary-600 dark:hover:text-primary-400 mb-4">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t("lessons.backToLessons")}
        </Link>
        <h1 className="text-2xl font-bold text-semantic-text mb-3">
          {t("lessons.unitShort", { number: unit.number })} — {unit.title}
        </h1>
        <p className="text-semantic-text-muted">{t("lessons.comingSoonMessage")}</p>
      </div>
    );
  }

  const hasAnyVisited = unit.sections.some((s) => getSectionProgress(unit.slug, s.key).visited);
  const allCompleted = unit.sections.every((s) => getSectionProgress(unit.slug, s.key).completed);

  let ctaLabel: string;
  let ctaTarget: SectionKey;

  if (allCompleted) {
    ctaLabel = t("lessons.hub.reviewUnit");
    ctaTarget = "overview";
  } else if (hasAnyVisited) {
    ctaLabel = t("lessons.hub.continue");
    const lastVisited = lastVisitedMap[unit.slug];
    if (lastVisited && !getSectionProgress(unit.slug, lastVisited).completed) {
      ctaTarget = lastVisited;
    } else {
      ctaTarget = SECTION_ORDER.find((key) => !getSectionProgress(unit.slug, key).completed) ?? "overview";
    }
  } else {
    ctaLabel = t("lessons.hub.startUnit");
    ctaTarget = "overview";
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link to="/lessons" className="inline-flex items-center gap-2 text-sm text-semantic-text-muted hover:text-primary-600 dark:hover:text-primary-400 mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {t("lessons.backToLessons")}
      </Link>
      <h1 className="text-2xl font-bold text-semantic-text mb-1">
        {t("lessons.unitShort", { number: unit.number })} — {unit.title}
      </h1>
      <p className="text-semantic-text-muted mb-1">{unit.topic}</p>
      <p className="text-sm text-semantic-subtle mb-6">{unit.grammarFocus}</p>
      <button
        type="button"
        onClick={() => navigate(`/lessons/${unit.slug}/${ctaTarget}`)}
        className="w-full mb-6 px-6 py-3 rounded-lg bg-primary-500 text-white text-base font-semibold hover:bg-primary-600 transition-colors"
      >
        {ctaLabel}
      </button>
      <div className="space-y-2">
        {unit.sections.map((section) => (
          <SectionCard key={section.key} section={section} unitSlug={unit.slug} progress={getSectionProgress(unit.slug, section.key)} />
        ))}
      </div>
    </div>
  );
}
