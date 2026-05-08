import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { getUnit, getNextAvailableUnit } from "../data/getUnit";
import SectionCard from "../components/SectionCard";
import UnitCompleteModal from "../components/UnitCompleteModal";
import { hasUnitBeenCelebrated, markUnitAsCelebrated } from "../unitCelebration";
import { useLessonProgressStore } from "../useLessonProgressStore";
import { getLearnerLanguage } from "../utils/learnerLanguage";
import type { SectionKey } from "../lesson.types";

export default function UnitHub() {
  const { t, i18n } = useTranslation();
  const learnerLang = getLearnerLanguage(i18n.language);
  const { unitSlug } = useParams<{ unitSlug: string }>();
  const navigate = useNavigate();
  const unit = unitSlug ? getUnit(unitSlug) : undefined;
  const getSectionProgress = useLessonProgressStore((s) => s.getSectionProgress);
  const lastVisitedMap = useLessonProgressStore((s) => s.lastVisitedSectionKey);

  // Compute completion state up front so we can hold the modal trigger
  // hooks above the early-return guards below — Rules of Hooks require
  // every hook to be called on every render. `getUnit` returns a fresh
  // hydrated object each render, so depending on `unit` directly here
  // would re-run this effect on unrelated re-renders; pin to the
  // primitive `unitSlug` instead.
  const allCompleted = Boolean(
    unit &&
      unit.status === "available" &&
      unit.sections.every((s) => getSectionProgress(unit.slug, s.key).completed),
  );
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  useEffect(() => {
    // Fires on the hub for two cases:
    //   1. User completed sections elsewhere (e.g. via SectionPage on
    //      another tab/device, or the SectionPage modal was dismissed
    //      without firing — currently impossible since we mark
    //      celebrated when opening, but kept as a safety net for
    //      future trigger-logic changes).
    //   2. The localStorage flag was reset / never written (e.g. the
    //      user cleared site data) and they revisit a finished unit.
    if (!unitSlug || !allCompleted) return;
    if (hasUnitBeenCelebrated(unitSlug)) return;
    setShowCompletionModal(true);
    markUnitAsCelebrated(unitSlug);
  }, [allCompleted, unitSlug]);

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

  const localized = learnerLang ? unit.translations[learnerLang] : undefined;
  const title = localized?.title || unit.title;
  const topic = localized?.topic || unit.topic;
  const grammarFocus = localized?.grammarFocus || unit.grammarFocus;

  const hasAnyVisited = unit.sections.some((s) => getSectionProgress(unit.slug, s.key).visited);

  const nextUnitData = getNextAvailableUnit(unit.slug);
  const nextUnitTitle = nextUnitData
    ? (learnerLang && nextUnitData.translations?.[learnerLang]?.title) || nextUnitData.title
    : "";

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
      ctaTarget = unit.sections.find((s) => !getSectionProgress(unit.slug, s.key).completed)?.key ?? "overview";
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
      {unit.imageUrl && (
        <img
          src={unit.imageUrl}
          alt={title}
          width={1024}
          height={1024}
          loading="lazy"
          decoding="async"
          className="w-full rounded-lg mb-4 object-cover"
        />
      )}
      <h1 className="text-2xl font-bold text-semantic-text mb-1">
        {t("lessons.unitShort", { number: unit.number })} — {title}
      </h1>
      <p className="text-semantic-text-muted mb-1">{topic}</p>
      <p className="text-sm text-semantic-subtle mb-6">{grammarFocus}</p>
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
      <UnitCompleteModal
        open={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        unitNumber={unit.number}
        unitTitle={title}
        nextUnit={
          nextUnitData
            ? { slug: nextUnitData.slug, title: nextUnitTitle, number: nextUnitData.number }
            : undefined
        }
      />
    </div>
  );
}
