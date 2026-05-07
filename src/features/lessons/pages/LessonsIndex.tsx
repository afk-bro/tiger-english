import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { GraduationCap, BookOpen, Calendar, Loader2 } from "lucide-react";
import { units as staticUnits } from "../data/units";
import UnitCard from "../components/UnitCard";
import { CEFR_LEVELS, CEFR_LEVEL_LABELS } from "../lesson.types";
import type { CefrLevel, Unit } from "../lesson.types";
import { CefrBadge } from "@/components/CefrBadge";
import { getCefrColorClasses } from "@/components/cefrBadge.utils";
import { Link } from "react-router-dom";
import { API_BASE } from "@/lib/api/config";

/** Stub teacher assignment — would come from API in production. */
const STUB_ASSIGNED_LESSONS: Array<{ unitSlug: string; title: string; level: CefrLevel; dueDate: string | null }> = [
  { unitSlug: "unit-1", title: "To Be: Introduction", level: "A1", dueDate: null },
];

/** Flag to toggle the teacher-assigned rail — flip to true to test Feature 70. */
const SHOW_ASSIGNED_RAIL = STUB_ASSIGNED_LESSONS.length > 0;

/**
 * Merge API unit metadata (slug, status, cefr_level) with the rich static
 * unit data (sections, translations) so UnitCard gets everything it needs.
 * API data takes precedence for status/cefr_level so the backend is the
 * authoritative source.
 */
function mergeWithStatic(apiUnits: Array<Record<string, unknown>>): Unit[] {
  const staticBySlug = new Map(staticUnits.map((u) => [u.slug, u]));
  return apiUnits.map((apiUnit): Unit => {
    const slug = String(apiUnit.slug);
    const base = staticBySlug.get(slug);
    return {
      slug,
      number: (apiUnit.number as number) ?? base?.number ?? 0,
      title: String(apiUnit.title ?? base?.title ?? slug),
      topic: String(apiUnit.topic ?? base?.topic ?? ""),
      grammarFocus: String(apiUnit.grammar_focus ?? base?.grammarFocus ?? ""),
      estimatedMinutes: (apiUnit.estimated_minutes as number) ?? base?.estimatedMinutes ?? 40,
      status: (apiUnit.status as Unit["status"]) ?? base?.status ?? "coming-soon",
      cefrLevel: (apiUnit.cefr_level as CefrLevel) ?? base?.cefrLevel ?? "A1",
      sections: base?.sections ?? [],
      translations: base?.translations ?? {},
    };
  });
}

export default function LessonsIndex() {
  const { t } = useTranslation();
  const [units, setUnits] = useState<Unit[]>(staticUnits);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"api" | "static">("static");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API_BASE}/units`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ units: Array<Record<string, unknown>> }>;
      })
      .then((data) => {
        if (cancelled) return;
        const merged = mergeWithStatic(data.units);
        setUnits(merged);
        setSource("api");
      })
      .catch(() => {
        if (cancelled) return;
        // Silently fall back to static data when backend is unavailable
        setUnits(staticUnits);
        setSource("static");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Group units by CEFR level; units without a level go into a fallback bucket
  const grouped = CEFR_LEVELS.reduce<Record<CefrLevel, typeof units>>(
    (acc, level) => {
      acc[level] = units.filter((u) => u.cefrLevel === level);
      return acc;
    },
    {} as Record<CefrLevel, typeof units>
  );
  const ungrouped = units.filter((u) => !u.cefrLevel);

  const levelsWithUnits = CEFR_LEVELS.filter((lvl) => grouped[lvl].length > 0);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-2">
        <GraduationCap className="w-7 h-7 text-primary-600 dark:text-primary-400" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-semantic-text">{t("lessons.title")}</h1>
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin text-semantic-text-muted ml-auto" aria-label="Loading lessons" />
        )}
        {!loading && source === "api" && (
          <span className="ml-auto text-xs text-semantic-text-muted opacity-60">
            {units.length} units
          </span>
        )}
      </div>
      <p className="text-semantic-text-muted mb-8">{t("lessons.subtitle")}</p>

      {/* Teacher-assigned rail (Feature 70) */}
      {SHOW_ASSIGNED_RAIL && (
        <section
          className="mb-8 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
          aria-label={t("lessons.assignedByTeacher", { defaultValue: "Assigned by your teacher" })}
        >
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              {t("lessons.assignedByTeacher", { defaultValue: "Assigned by your teacher" })}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {STUB_ASSIGNED_LESSONS.map((lesson) => (
              <Link
                key={lesson.unitSlug}
                to={`/lessons/${lesson.unitSlug}`}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 hover:border-primary-400 dark:hover:border-primary-500 transition-colors shadow-sm"
              >
                <CefrBadge level={lesson.level} size="sm" />
                <span className="text-sm font-medium text-semantic-text">{lesson.title}</span>
                {lesson.dueDate && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 ml-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(lesson.dueDate).toLocaleDateString()}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {levelsWithUnits.map((level) => (
        <section key={level} className="mb-10" aria-labelledby={`cefr-heading-${level}`}>
          <div className="flex items-center gap-3 mb-4">
            <span
              id={`cefr-heading-${level}`}
              className={`inline-flex items-center justify-center rounded-full h-7 px-3 text-sm font-semibold uppercase tracking-wide ${getCefrColorClasses(level)}`}
              aria-label={`CEFR level ${level}`}
            >
              {level}
            </span>
            <h2 className="text-lg font-semibold text-semantic-text">
              {CEFR_LEVEL_LABELS[level]}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grouped[level].map((unit) => (
              <UnitCard key={unit.slug} unit={unit} />
            ))}
          </div>
        </section>
      ))}

      {ungrouped.length > 0 && (
        <section className="mb-10" aria-label={t("lessons.otherUnits", { defaultValue: "Other Units" })}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ungrouped.map((unit) => (
              <UnitCard key={unit.slug} unit={unit} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
