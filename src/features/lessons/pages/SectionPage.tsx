import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { getUnit, getNextAvailableUnit } from "../data/getUnit";
import { getSection } from "../data/getSection";
import { useLessonProgressStore } from "../useLessonProgressStore";
import { SECTION_ORDER, type SectionKey } from "../lesson.types";
import { getLearnerLanguage } from "../utils/learnerLanguage";
import SectionRenderer from "../components/SectionRenderer";
import SectionNav from "../components/SectionNav";
import UnitCompleteModal from "../components/UnitCompleteModal";
import { hasUnitBeenCelebrated, markUnitAsCelebrated } from "../unitCelebration";

const DEFAULT_PROGRESS = { visited: false, completed: false } as const;

export default function SectionPage() {
  const { t, i18n } = useTranslation();
  const learnerLang = getLearnerLanguage(i18n.language);
  const { unitSlug, sectionKey } = useParams<{ unitSlug: string; sectionKey: string }>();

  const unit = unitSlug ? getUnit(unitSlug) : undefined;
  const validSectionKey =
    sectionKey && SECTION_ORDER.includes(sectionKey as SectionKey)
      ? (sectionKey as SectionKey)
      : undefined;
  const section = unitSlug && validSectionKey ? getSection(unitSlug, validSectionKey) : undefined;

  const markVisited = useLessonProgressStore((s) => s.markVisited);
  const setLastVisited = useLessonProgressStore((s) => s.setLastVisited);
  const markCompleted = useLessonProgressStore((s) => s.markCompleted);
  const toggleCompleted = useLessonProgressStore((s) => s.toggleCompleted);
  const getSectionProgress = useLessonProgressStore((s) => s.getSectionProgress);

  // `allCompleted` flips to true the moment the user marks the last
  // remaining section as completed. We watch for that transition (or
  // a first render where it's already true) and fire the celebration
  // modal exactly once per unit per browser — see unitCelebration.ts
  // for the localStorage flag that enforces "once".
  //
  // Effect depends on the primitive `unitSlug` (not the `unit` object)
  // because `getUnit` returns a fresh hydrated object each render —
  // depending on `unit` directly would re-run the effect on every
  // unrelated re-render and repeatedly poke localStorage.
  const allCompleted = Boolean(
    unit &&
      unit.status === "available" &&
      unit.sections.every((s) => getSectionProgress(unit.slug, s.key).completed),
  );

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  useEffect(() => {
    if (!unitSlug || !allCompleted) return;
    if (hasUnitBeenCelebrated(unitSlug)) return;
    setShowCompletionModal(true);
    markUnitAsCelebrated(unitSlug);
  }, [unitSlug, allCompleted]);

  const progressKey = unitSlug && validSectionKey ? `${unitSlug}:${validSectionKey}` : "";
  const progress = useLessonProgressStore(
    (s) => progressKey ? (s.progress[progressKey] ?? DEFAULT_PROGRESS) : DEFAULT_PROGRESS,
  );

  // Boolean (not Section) so useEffect deps don't churn when hydrateSection
  // returns a fresh object on each call (which it does whenever a sidecar
  // entry applies). See PR #101 review comment 3176769201.
  const shouldTrack = Boolean(unit?.status === "available" && validSectionKey && section);

  useEffect(() => {
    if (shouldTrack && unitSlug && validSectionKey) {
      markVisited(unitSlug, validSectionKey);
      setLastVisited(unitSlug, validSectionKey);
    }
  }, [shouldTrack, unitSlug, validSectionKey, markVisited, setLastVisited]);

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

  if (unit.status !== "available") {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Link to="/lessons" className="inline-flex items-center gap-2 text-sm text-semantic-text-muted hover:text-primary-600 dark:hover:text-primary-400 mb-4">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t("lessons.backToLessons")}
        </Link>
        <h1 className="text-2xl font-bold text-semantic-text mb-3">
          {t("lessons.unitShort", { number: unit.number })} — {(learnerLang && unit.translations[learnerLang]?.title) || unit.title}
        </h1>
        <p className="text-semantic-text-muted">{t("lessons.comingSoonMessage")}</p>
      </div>
    );
  }

  if (!validSectionKey || !section) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-semantic-text mb-3">{t("lessons.sectionNotFound")}</h1>
        <Link to={`/lessons/${unitSlug}`} className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t("lessons.backToUnit")}
        </Link>
      </div>
    );
  }

  const isLastSection =
    SECTION_ORDER.indexOf(validSectionKey) === SECTION_ORDER.length - 1;
  const nextUnitData = isLastSection
    ? getNextAvailableUnit(unit.slug)
    : undefined;
  const nextUnitTitle = nextUnitData
    ? (learnerLang && nextUnitData.translations?.[learnerLang]?.title) || nextUnitData.title
    : '';
  const nextUnit = nextUnitData
    ? {
        slug: nextUnitData.slug,
        ctaText: t('lessons.section.nextUnit', {
          unitLabel: `${t('lessons.unitShort', { number: nextUnitData.number })} — ${nextUnitTitle}`,
        }),
      }
    : undefined;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="sticky top-0 z-10 bg-semantic-bg pb-3 mb-6 border-b border-semantic-border -mx-4 px-4 pt-2">
        <Link to={`/lessons/${unitSlug}`} className="inline-flex items-center gap-2 text-sm text-semantic-text-muted hover:text-primary-600 dark:hover:text-primary-400">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t("lessons.backToUnit")}
        </Link>
        <h1 className="text-2xl font-bold text-semantic-text mt-1">{t(`lessons.detail.sections.${validSectionKey}`)}</h1>
      </div>
      {section.imageUrl && (
        <img
          src={section.imageUrl}
          alt=""
          width={1024}
          height={1024}
          loading="lazy"
          decoding="async"
          className="w-full rounded-lg mb-6 object-cover"
        />
      )}
      <SectionRenderer
        section={section}
        onExerciseCorrect={() => {
          markCompleted(unit.slug, validSectionKey);
        }}
        unitSlug={unit.slug}
        sectionKey={validSectionKey}
      />
      <SectionNav
        unitSlug={unit.slug}
        currentSection={validSectionKey}
        completed={progress.completed}
        onToggleComplete={() => toggleCompleted(unit.slug, validSectionKey)}
        isLastSection={isLastSection}
        nextUnit={nextUnit}
      />
      <UnitCompleteModal
        open={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        unitNumber={unit.number}
        unitTitle={(learnerLang && unit.translations[learnerLang]?.title) || unit.title}
        nextUnit={
          nextUnitData
            ? { slug: nextUnitData.slug, title: nextUnitTitle, number: nextUnitData.number }
            : undefined
        }
      />
    </div>
  );
}
