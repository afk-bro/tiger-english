import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GraduationCap, Clock, Lock } from "lucide-react";
import { units, type Unit } from "@/data/units";

function UnitCard({ unit }: { unit: Unit }) {
  const { t } = useTranslation();
  const isAvailable = unit.status === "available";

  const baseClasses =
    "block rounded-xl border p-6 transition-colors";
  const variantClasses = isAvailable
    ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:shadow-md"
    : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-60 cursor-not-allowed";

  const content = (
    <>
      <div className="flex items-start justify-between mb-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold">
          {unit.number}
        </span>
        <span
          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
            isAvailable
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {!isAvailable && <Lock className="w-3 h-3" aria-hidden="true" />}
          {isAvailable
            ? t("lessons.status.available")
            : t("lessons.status.comingSoon")}
        </span>
      </div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
        {unit.title}
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        {unit.topic}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
        {unit.grammarFocus}
      </p>
      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
        <Clock className="w-3 h-3" aria-hidden="true" />
        {t("lessons.card.estMinutes", { count: unit.estimatedMinutes })}
      </div>
    </>
  );

  if (isAvailable) {
    return (
      <Link to={`/lessons/${unit.slug}`} className={`${baseClasses} ${variantClasses}`}>
        {content}
      </Link>
    );
  }
  return (
    <div className={`${baseClasses} ${variantClasses}`} aria-disabled="true">
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {t("lessons.title")}
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        {t("lessons.subtitle")}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {units.map((unit) => (
          <UnitCard key={unit.slug} unit={unit} />
        ))}
      </div>
    </div>
  );
}
