import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, X, BookOpen, Users, ClipboardList } from "lucide-react";

type ClassItem = {
  id: string;
  name: string;
  level: string;
  studentCount: number;
  assignmentCount: number;
};

const LEVEL_OPTIONS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function TeacherClassesPage() {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formLevel, setFormLevel] = useState("A1");
  const [toast, setToast] = useState<string | null>(null);

  function handleCreate() {
    if (!formName.trim()) return;
    const newClass: ClassItem = {
      id: `class-${Date.now()}`,
      name: formName.trim(),
      level: formLevel,
      studentCount: 0,
      assignmentCount: 0,
    };
    setClasses((prev) => [...prev, newClass]);
    setFormName("");
    setFormLevel("A1");
    setShowModal(false);
    setToast(`Class "${newClass.name}" created successfully`);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg bg-green-600 text-white text-sm font-medium shadow-lg animate-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-semantic-text">{t("teacher.classes")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {classes.length} {classes.length === 1 ? "class" : "classes"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("teacher.createClass")}
        </button>
      </div>

      {/* Class list */}
      {classes.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-base font-medium text-semantic-text mb-2">
            {t("teacher.noClasses")}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Create your first class to start managing students
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("teacher.createClass")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              to={`/teacher/classes/${cls.id}`}
              className="card p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-semantic-text group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {cls.name}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
                  {cls.level}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {cls.studentCount} students
                </span>
                <span className="flex items-center gap-1">
                  <ClipboardList className="w-3.5 h-3.5" />
                  {cls.assignmentCount} assignments
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-semantic-text">
                {t("teacher.createClass")}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-semantic-text mb-1" htmlFor="class-name">
                  Class name
                </label>
                <input
                  id="class-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Morning A1 Group"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-semantic-text text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-semantic-text mb-1" htmlFor="class-level">
                  Level
                </label>
                <select
                  id="class-level"
                  value={formLevel}
                  onChange={(e) => setFormLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-semantic-text text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {LEVEL_OPTIONS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-semantic-text text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!formName.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
