import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { getUnit } from "../data/getUnit";
import { getSection } from "../data/getSection";
import { useLessonProgressStore } from "../useLessonProgressStore";
import { SECTION_ORDER, type SectionKey } from "../lesson.types";
import { getLearnerLanguage } from "../utils/learnerLanguage";
import SectionRenderer from "../components/SectionRenderer";
import SectionNav from "../components/SectionNav";

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

  const progressKey = unitSlug && validSectionKey ? `${unitSlug}:${validSectionKey}` : "";
  const progress = useLessonProgressStore(
    (s) => progressKey ? (s.progress[progressKey] ?? DEFAULT_PROGRESS) : DEFAULT_PROGRESS,
  );

  const shouldTrack = unit?.status === "available" && validSectionKey && section;

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

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="sticky top-0 z-10 bg-semantic-bg pb-3 mb-6 border-b border-semantic-border -mx-4 px-4 pt-2">
        <Link to={`/lessons/${unitSlug}`} className="inline-flex items-center gap-2 text-sm text-semantic-text-muted hover:text-primary-600 dark:hover:text-primary-400">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t("lessons.backToUnit")}
        </Link>
        <h1 className="text-2xl font-bold text-semantic-text mt-1">{t(`lessons.detail.sections.${validSectionKey}`)}</h1>
      </div>
      <SectionRenderer
        section={section}
        onExerciseCorrect={() => {
          markCompleted(unit.slug, validSectionKey);
        }}
      />
      <SectionNav
        unitSlug={unit.slug}
        currentSection={validSectionKey}
        completed={progress.completed}
        onToggleComplete={() => toggleCompleted(unit.slug, validSectionKey)}
      />
    </div>
  );
}
