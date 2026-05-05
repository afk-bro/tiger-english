import { useTranslation } from "react-i18next";
import { GraduationCap } from "lucide-react";
import { units } from "../data/units";
import UnitCard from "../components/UnitCard";
import { CEFR_LEVELS, CEFR_LEVEL_LABELS } from "../lesson.types";
import type { CefrLevel } from "../lesson.types";
import { getCefrColorClasses } from "@/components/CefrBadge";

export default function LessonsIndex() {
  const { t } = useTranslation();

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
      </div>
      <p className="text-semantic-text-muted mb-8">{t("lessons.subtitle")}</p>

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
