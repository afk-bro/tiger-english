/**
 * PracticeHub — /practice
 *
 * Landing page for AI-powered practice features. Currently surfaces:
 *   - AI Conversation (gated behind VITE_AI_CONVERSATION_ENABLED — set
 *     to "true" in Vercel env vars when ANTHROPIC_API_KEY is provisioned
 *     on the backend; until then the card is shown as "Coming soon")
 *   - Guided Writing (always coming soon for now)
 *
 * Pronunciation and other AI features will land here in future phases.
 */
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles, MessageSquare, PenLine } from "lucide-react";

const AI_CONVERSATION_ENABLED =
  import.meta.env.VITE_AI_CONVERSATION_ENABLED === "true";

export default function PracticeHub() {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles
            className="w-6 h-6 text-primary-600 dark:text-primary-400"
            aria-hidden
          />
          <h1 className="text-2xl font-bold text-semantic-text">
            {t("practice.title")}
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("practice.subtitle")}
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* AI Conversation */}
        {AI_CONVERSATION_ENABLED ? (
          <Link
            to="/conversations"
            className="group flex flex-col p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
                <MessageSquare
                  className="w-5 h-5 text-primary-600 dark:text-primary-400"
                  aria-hidden
                />
              </div>
              <h2 className="text-lg font-semibold text-semantic-text">
                {t("practice.conversation.title")}
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("practice.conversation.description")}
            </p>
          </Link>
        ) : (
          <div
            aria-disabled="true"
            className="flex flex-col p-5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 opacity-70 cursor-not-allowed"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <MessageSquare
                  className="w-5 h-5 text-gray-400 dark:text-gray-500"
                  aria-hidden
                />
              </div>
              <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                {t("practice.conversation.title")}
              </h2>
              <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300">
                {t("practice.writing.comingSoon")}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {t("practice.conversation.description")}
            </p>
          </div>
        )}

        {/* Guided Writing — disabled / coming soon */}
        <div
          aria-disabled="true"
          className="flex flex-col p-5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 opacity-70 cursor-not-allowed"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <PenLine
                className="w-5 h-5 text-gray-400 dark:text-gray-500"
                aria-hidden
              />
            </div>
            <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400">
              {t("practice.writing.title")}
            </h2>
            <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300">
              {t("practice.writing.comingSoon")}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {t("practice.writing.description")}
          </p>
        </div>
      </div>
    </div>
  );
}
