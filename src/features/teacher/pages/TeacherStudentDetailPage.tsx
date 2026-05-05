import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MessageSquare, FileText, AlertCircle, Activity } from "lucide-react";
import CefrBadge from "@/components/CefrBadge";
import type { CefrLevel } from "@/features/lessons/lesson.types";

type Tab = "activity" | "conversations" | "writing" | "errors";

const SKILL_SCORES = [
  { label: "Grammar", score: 3.2 },
  { label: "Vocab", score: 3.8 },
  { label: "Fluency", score: 2.5 },
  { label: "Listening", score: 4.0 },
  { label: "Reading", score: 3.6 },
  { label: "Writing", score: 3.1 },
];

export default function TeacherStudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("activity");
  const [showingAction, setShowingAction] = useState(false);

  // Stub student data
  const studentName = studentId === "s1"
    ? "Napat Suwannakorn"
    : studentId === "s2"
    ? "Wanjiku Kamau"
    : "Supakorn Thanakit";
  const level: CefrLevel = studentId === "s2" ? "B1" : studentId === "s1" ? "A2" : "A1";

  const TABS: { key: Tab; label: string; icon: typeof Activity }[] = [
    { key: "activity", label: "Activity", icon: Activity },
    { key: "conversations", label: "Conversations", icon: MessageSquare },
    { key: "writing", label: "Writing", icon: FileText },
    { key: "errors", label: "Errors", icon: AlertCircle },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <Link
        to="/teacher/students"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-semantic-text mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to students
      </Link>

      {/* Student header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-semantic-text">{studentName}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Student ID: {studentId}
            </p>
          </div>
          <CefrBadge level={level} size="md" />
        </div>

        {/* Skill breakdown row */}
        <div className="flex flex-wrap gap-3 mb-4">
          {SKILL_SCORES.map((skill) => (
            <div
              key={skill.label}
              className="flex flex-col items-center gap-1"
              title={`${skill.label}: ${skill.score.toFixed(1)}/5`}
            >
              <div className="w-10 h-10 rounded-full border-4 border-gray-200 dark:border-gray-700 flex items-center justify-center relative">
                <span className="text-xs font-bold text-semantic-text">{skill.score.toFixed(1)}</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{skill.label}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowingAction(!showingAction)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-500 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
        >
          {t("teacher.recommendedAction")}
        </button>
        {showingAction && (
          <div className="mt-3 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-sm text-primary-700 dark:text-primary-300">
            Focus on speaking fluency — assign 2 conversation missions per week targeting vocabulary from Unit 3.
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === key
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-semantic-text"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content — all stubs */}
      <div className="card p-12 text-center">
        {activeTab === "activity" && (
          <div>
            <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-base font-medium text-semantic-text">No activity recorded yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Activity will appear here once the student starts using the platform
            </p>
          </div>
        )}
        {activeTab === "conversations" && (
          <div>
            <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-base font-medium text-semantic-text">No conversations yet</p>
          </div>
        )}
        {activeTab === "writing" && (
          <div>
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-base font-medium text-semantic-text">No writing submissions yet</p>
          </div>
        )}
        {activeTab === "errors" && (
          <div>
            <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-base font-medium text-semantic-text">No common errors tracked yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
