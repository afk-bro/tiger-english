/**
 * AiTutorPanel — right slide-out panel with 4 tabs:
 * Explain | Correct | Practice | Writing Coach
 *
 * Opened/closed via useAiTutorStore. Mount it once inside AuthLayout
 * so it persists across route changes.
 */
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, MessageCircleQuestion, CheckCircle, Dumbbell, PenLine } from "lucide-react";
import { useAiTutorStore } from "@/stores/useAiTutorStore";
import type { AiTutorTab } from "@/stores/useAiTutorStore";
import ExplainTab from "./ExplainTab";
import CorrectTab from "./CorrectTab";
import PracticeTab from "./PracticeTab";
import WritingCoachTab from "./WritingCoachTab";

const TABS: { key: AiTutorTab; labelKey: string; defaultLabel: string; Icon: React.ElementType }[] = [
  { key: "explain",       labelKey: "aiTutor.tabs.explain",       defaultLabel: "Explain",       Icon: MessageCircleQuestion },
  { key: "correct",       labelKey: "aiTutor.tabs.correct",       defaultLabel: "Correct",       Icon: CheckCircle },
  { key: "practice",      labelKey: "aiTutor.tabs.practice",      defaultLabel: "Practice",      Icon: Dumbbell },
  { key: "writing-coach", labelKey: "aiTutor.tabs.writingCoach",  defaultLabel: "Writing Coach", Icon: PenLine },
];

export default function AiTutorPanel() {
  const { t } = useTranslation();
  const { isOpen, activeTab, close, setTab } = useAiTutorStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Move focus to the close button when the panel opens. This is not a true
  // focus trap — Tab can still escape into the underlying page. Switch to
  // Headless UI Dialog or focus-lock if a real trap is needed.
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={close}
        className={[
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("aiTutor.panel.title", { defaultValue: "AI Tutor" })}
        className={[
          "fixed right-0 top-0 h-full z-50 flex flex-col",
          "w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl",
          "transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-base font-semibold text-semantic-text flex items-center gap-2">
            <MessageCircleQuestion className="w-5 h-5 text-primary-600 dark:text-primary-400" aria-hidden />
            {t("aiTutor.panel.title", { defaultValue: "AI Tutor" })}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={close}
            aria-label={t("common.close", { defaultValue: "Close" })}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 text-semantic-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab strip */}
        <div
          role="tablist"
          aria-label={t("aiTutor.panel.tabs", { defaultValue: "AI Tutor sections" })}
          className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0"
        >
          {TABS.map(({ key, labelKey, defaultLabel, Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={isActive}
                aria-controls={`ai-tutor-tab-panel-${key}`}
                id={`ai-tutor-tab-${key}`}
                onClick={() => setTab(key)}
                className={[
                  "flex-1 flex flex-col items-center gap-0.5 px-2 py-2 text-xs font-medium transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500",
                  isActive
                    ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400"
                    : "text-semantic-text-muted hover:text-semantic-text hover:bg-gray-50 dark:hover:bg-gray-800",
                ].join(" ")}
              >
                <Icon className="w-4 h-4" aria-hidden />
                <span className="leading-tight text-center">
                  {t(labelKey, { defaultValue: defaultLabel })}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          {TABS.map(({ key }) => (
            <div
              key={key}
              id={`ai-tutor-tab-panel-${key}`}
              role="tabpanel"
              aria-labelledby={`ai-tutor-tab-${key}`}
              hidden={activeTab !== key}
            >
              {activeTab === key && <TabContent tab={key} />}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

function TabContent({ tab }: { tab: AiTutorTab }) {
  switch (tab) {
    case "explain":
      return <ExplainTab />;
    case "correct":
      return <CorrectTab />;
    case "practice":
      return <PracticeTab />;
    case "writing-coach":
      return <WritingCoachTab />;
  }
}
