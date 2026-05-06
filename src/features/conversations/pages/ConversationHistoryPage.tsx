/**
 * ConversationHistoryPage — /u/:username/conversations
 *
 * Shows a list of past AI conversation sessions for the authenticated user.
 * Empty state: friendly "Start your first mission" CTA.
 * Populated: table/card list with scenario title, CEFR badge, score, date, status.
 */
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MessageSquare, ArrowRight, Calendar } from "lucide-react";
import CefrBadge from "@/components/CefrBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionStatus = "completed" | "abandoned";

interface PastSession {
  id: string;
  scenarioTitle: string;
  level: string;
  startedAt: string;
  status: SessionStatus;
  vocabUsed?: number;
  vocabTotal?: number;
}

// ─── Stub data (shown until real AI conversation backend is wired) ─────────────

const STUB_SESSIONS: PastSession[] = [];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConversationHistoryPage() {
  const { t } = useTranslation();

  // In the future, fetch from /api/v1/me/conversations
  const sessions: PastSession[] = STUB_SESSIONS;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-semantic-text">
            {t("conversations.history.title", { defaultValue: "My Conversations" })}
          </h1>
          <p className="text-sm text-semantic-text-muted mt-1">
            {t("conversations.history.subtitle", {
              defaultValue: "Your past AI conversation missions and results.",
            })}
          </p>
        </div>
        <Link
          to="/conversations"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <MessageSquare className="w-4 h-4" aria-hidden />
          {t("conversations.history.newMission", { defaultValue: "New mission" })}
        </Link>
      </div>

      {sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
        <MessageSquare className="w-8 h-8 text-primary-500" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold text-semantic-text">
        {t("conversations.history.empty.title", {
          defaultValue: "No conversations yet",
        })}
      </h2>
      <p className="text-sm text-semantic-text-muted max-w-xs">
        {t("conversations.history.empty.body", {
          defaultValue:
            "Try your first AI conversation mission! Practice real English in a guided scenario.",
        })}
      </p>
      <Link
        to="/conversations"
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
      >
        {t("conversations.history.empty.cta", { defaultValue: "Browse scenarios" })}
        <ArrowRight className="w-4 h-4" aria-hidden />
      </Link>
    </div>
  );
}

function SessionCard({ session }: { session: PastSession }) {
  const { t } = useTranslation();
  const date = new Date(session.startedAt);

  return (
    <div className="card p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" aria-hidden />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-semantic-text truncate">
              {session.scenarioTitle}
            </span>
            <CefrBadge level={session.level as "A1"} />
          </div>
          <div className="flex items-center gap-2 text-xs text-semantic-text-muted mt-0.5">
            <Calendar className="w-3 h-3" aria-hidden />
            <time dateTime={session.startedAt}>
              {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </time>
            {session.vocabTotal != null && (
              <span>
                · {t("conversations.history.vocabUsed", {
                  used: session.vocabUsed,
                  total: session.vocabTotal,
                  defaultValue: `${session.vocabUsed}/${session.vocabTotal} vocab`,
                })}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusBadge status={session.status} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const { t } = useTranslation();
  const styles: Record<SessionStatus, string> = {
    completed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    abandoned: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
  };
  const labels: Record<SessionStatus, string> = {
    completed: t("conversations.history.status.completed", { defaultValue: "Completed" }),
    abandoned: t("conversations.history.status.abandoned", { defaultValue: "Abandoned" }),
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
