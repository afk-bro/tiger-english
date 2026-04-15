import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GraduationCap, Clock, Lock } from "lucide-react";
import { units, type Unit } from "@/data/units";

function UnitCard({ unit }: { unit: Unit }) {
  const { t } = useTranslation();
  const isAvailable = unit.status === "available";

  // Shared .card classes handle bg/border/radius/padding/shadow plus dark
  // mode via semantic tokens. .card-interactive adds hover lift + the
  // focus-visible ring so the available cards are keyboard-accessible.
  // Coming-soon cards stay on the plain .card with an opacity dim — no
  // hover affordance because they aren't clickable.
  const className = `block ${isAvailable ? "card card-interactive" : "card opacity-60 cursor-not-allowed"}`;

  const content = (
    <>
      <div className="flex items-start justify-between mb-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold">
          {unit.number}
        </span>
        <span
          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
            isAvailable
              ? "bg-semantic-success/10 text-semantic-success"
              : "bg-semantic-surface-2 text-semantic-text-muted"
          }`}
        >
          {!isAvailable && <Lock className="w-3 h-3" aria-hidden="true" />}
          {isAvailable
            ? t("lessons.status.available")
            : t("lessons.status.comingSoon")}
        </span>
      </div>
      <h2 className="text-lg font-semibold text-semantic-text mb-1">
        {unit.title}
      </h2>
      <p className="text-sm text-semantic-text-muted mb-2">
        {unit.topic}
      </p>
      <p className="text-xs text-semantic-subtle mb-4">
        {unit.grammarFocus}
      </p>
      <div className="flex items-center gap-1 text-xs text-semantic-subtle">
        <Clock className="w-3 h-3" aria-hidden="true" />
        {t("lessons.card.estMinutes", { count: unit.estimatedMinutes })}
      </div>
    </>
  );

  if (isAvailable) {
    return (
      <Link to={`/lessons/${unit.slug}`} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <div className={className} aria-disabled="true">
      {content}
    </div>
  );
}

export default function Lessons() {
  const { t } = useTranslation();
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-2">
        <GraduationCap
          className="w-7 h-7 text-primary-600 dark:text-primary-400"
          aria-hidden="true"
        />
        <h1 className="text-2xl font-bold text-semantic-text">
          {t("lessons.title")}
        </h1>
      </div>
      <p className="text-semantic-text-muted mb-8">{t("lessons.subtitle")}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {units.map((unit) => (
          <UnitCard key={unit.slug} unit={unit} />
        ))}
      </div>
    </div>
  );
}
