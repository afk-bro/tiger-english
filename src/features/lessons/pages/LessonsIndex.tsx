import { useTranslation } from "react-i18next";
import { GraduationCap } from "lucide-react";
import { units } from "../data/units";
import UnitCard from "../components/UnitCard";

export default function LessonsIndex() {
  const { t } = useTranslation();
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-2">
        <GraduationCap className="w-7 h-7 text-primary-600 dark:text-primary-400" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-semantic-text">{t("lessons.title")}</h1>
      </div>
      <p className="text-semantic-text-muted mb-8">{t("lessons.subtitle")}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {units.map((unit) => <UnitCard key={unit.slug} unit={unit} />)}
      </div>
    </div>
  );
}
