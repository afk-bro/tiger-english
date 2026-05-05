import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Users, ClipboardList, X, Send } from "lucide-react";

type Tab = "roster" | "assignments";

export default function TeacherClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("roster");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  function handleSendInvite() {
    if (!inviteEmails.trim()) return;
    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setInviteEmails("");
      setShowInviteModal(false);
    }, 2000);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      {/* Back link */}
      <Link
        to="/teacher/classes"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-semantic-text mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to classes
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-semantic-text">
            Class {classId}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            0 students · 0 assignments
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
        {([
          { key: "roster" as Tab, label: "Roster", icon: Users },
          { key: "assignments" as Tab, label: "Assignments", icon: ClipboardList },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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

      {/* Roster tab */}
      {activeTab === "roster" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">0 students enrolled</p>
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
            >
              <Send className="w-4 h-4" />
              {t("teacher.inviteStudents")}
            </button>
          </div>
          <div className="card p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-base font-medium text-semantic-text mb-2">
              No students yet. Invite students to get started.
            </p>
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-semantic-text text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Send className="w-4 h-4" />
              {t("teacher.inviteStudents")}
            </button>
          </div>
        </div>
      )}

      {/* Assignments tab */}
      {activeTab === "assignments" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">0 assignments</p>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Assign lesson
            </button>
          </div>
          <div className="card p-12 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-base font-medium text-semantic-text mb-2">
              No assignments yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Assign lessons to track student progress
            </p>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowInviteModal(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-semantic-text">
                {t("teacher.inviteStudents")}
              </h2>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-semantic-text mb-1" htmlFor="invite-emails">
                Student email addresses
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Enter one email per line
              </p>
              <textarea
                id="invite-emails"
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                placeholder={"student1@example.com\nstudent2@example.com"}
                rows={5}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-semantic-text text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-semantic-text text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendInvite}
                disabled={!inviteEmails.trim() || inviteSent}
                className="flex-1 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {inviteSent ? "Sent!" : "Send invites"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
