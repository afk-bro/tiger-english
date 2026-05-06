/**
 * ConversationDetailPage — /u/:username/conversations/:sessionId
 *
 * Shows the full transcript of a past conversation session in chat bubble
 * format, along with 6-criteria scores and "Try again" / "Next mission" CTAs.
 *
 * Phase 4: Until the backend stores session data, this shows a graceful
 * "not found" or empty state so the route is registered and navigable.
 */
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MessageSquare, RefreshCw, ArrowRight } from "lucide-react";

type CriterionScore = {
  key: string;
  label: string;
  score: number;
  max: number;
};

const CRITERIA: CriterionScore[] = [
  { key: "task_success", label: "Task success", score: 0, max: 5 },
  { key: "comprehension", label: "Comprehension", score: 0, max: 5 },
  { key: "response_relevance", label: "Response relevance", score: 0, max: 5 },
  { key: "language_control", label: "Language control", score: 0, max: 5 },
  { key: "repair_ability", label: "Repair ability", score: 0, max: 5 },
  { key: "independence", label: "Independence", score: 0, max: 5 },
];

export default function ConversationDetailPage() {
  const { username } = useParams<{ username: string; sessionId: string }>();
  const { t } = useTranslation();

  // In the future, fetch session data from /api/v1/me/conversations/:sessionId
  // For now, show an informative empty state
  const session = null; // stub

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Link
          to={`/u/${username}/conversations`}
          className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("conversations.history.title", { defaultValue: "My Conversations" })}
        </Link>

        <div className="card p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto">
            <MessageSquare className="w-7 h-7 text-gray-400" aria-hidden />
          </div>
          <h1 className="text-xl font-semibold text-semantic-text">
            {t("conversations.detail.notAvailable", {
              defaultValue: "Session details not yet available",
            })}
          </h1>
          <p className="text-sm text-semantic-text-muted max-w-sm mx-auto">
            {t("conversations.detail.notAvailableBody", {
              defaultValue:
                "Full session transcripts and scores will be stored once the AI conversation backend is connected.",
            })}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/conversations"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-semantic-text text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" aria-hidden />
              {t("conversations.detail.tryAgain", { defaultValue: "Try again" })}
            </Link>
            <Link
              to="/conversations"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              {t("conversations.detail.nextMission", { defaultValue: "Next mission" })}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
        </div>

        {/* 6-criteria scores placeholder */}
        <div className="card p-6 mt-6">
          <h2 className="text-base font-semibold text-semantic-text mb-4">
            {t("conversations.detail.scores", { defaultValue: "Mission scores" })}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {CRITERIA.map((c) => (
              <div key={c.key} className="flex flex-col gap-1">
                <p className="text-xs text-semantic-text-muted">{c.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-gray-300 dark:text-gray-600">–</span>
                  <span className="text-xs text-semantic-text-muted">/{c.max}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null; // will render real session data once backend is connected
}
