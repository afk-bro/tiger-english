import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users, BookOpen, Activity, Plus } from "lucide-react";

const STAT_CARDS = [
  { label: "Total students", value: 0, icon: Users, color: "text-blue-500" },
  { label: "Active classes", value: 0, icon: BookOpen, color: "text-green-500" },
  { label: "This week", value: 0, icon: Activity, color: "text-purple-500", suffix: " activities" },
];

export default function TeacherOverviewPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-semantic-text">{t("teacher.portal")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your students, classes, and assignments
          </p>
        </div>
        <Link
          to="/teacher/classes/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("teacher.createClass")}
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, suffix }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-gray-100 dark:bg-gray-800 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-semantic-text">
                {value}{suffix ?? ""}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {[
          { label: t("teacher.overview"), to: "/teacher" },
          { label: t("teacher.classes"), to: "/teacher/classes" },
          { label: t("teacher.students"), to: "/teacher/students" },
        ].map(({ label, to }) => (
          <Link
            key={to}
            to={to}
            className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-semantic-text border-b-2 border-transparent hover:border-primary-500 transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Empty class list */}
      <div className="card p-12 text-center">
        <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-base font-medium text-semantic-text mb-2">
          {t("teacher.noClasses")}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Create your first class to get started managing students
        </p>
        <Link
          to="/teacher/classes/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("teacher.createClass")}
        </Link>
      </div>
    </div>
  );
}
