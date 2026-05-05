/**
 * MissionRunnerPage — /conversations/:slug
 *
 * Two-column layout on desktop:
 *   Left (60%): AI chat bubbles + learner input
 *   Right (40%): Target vocab chips + grammar checklist + tips
 *
 * On mobile (<md): single column with vocab panel as bottom drawer.
 *
 * Phase 4 AI endpoints are behind a feature flag; when the backend is
 * not available this page shows a realistic demo/stub mode so the layout
 * and UX can be validated without live AI.
 */
import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  Circle,
  ChevronUp,
  Flag,
  Info,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import CefrBadge from "@/components/CefrBadge";
import type { ConversationScenario } from "../conversations.types";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8000/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string;
  role: "tutor" | "learner";
  text: string;
  timestamp: Date;
};

type VocabChip = {
  word: string;
  status: "unused" | "used" | "missed";
};

// ─── Hook: load scenario ──────────────────────────────────────────────────────

function useScenario(slug: string | undefined) {
  const [scenario, setScenario] = useState<ConversationScenario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`${API_BASE}/me/conversations/scenarios`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const found = (data.scenarios as ConversationScenario[]).find(
          (s) => s.slug === slug
        );
        setScenario(found ?? null);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  return { scenario, loading };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MissionRunnerPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { scenario, loading } = useScenario(slug);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [vocabChips, setVocabChips] = useState<VocabChip[]>([]);
  const [vocabDrawerOpen, setVocabDrawerOpen] = useState(false);
  const [missionEnded, setMissionEnded] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Seed opening line from scenario
  useEffect(() => {
    if (!scenario) return;
    setMessages([
      {
        id: "opening",
        role: "tutor",
        text: scenario.opening_line,
        timestamp: new Date(),
      },
    ]);
    setVocabChips(
      scenario.target_vocabulary.map((w) => ({ word: w, status: "unused" }))
    );
  }, [scenario]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = inputText.trim();
    if (!text || sending || missionEnded) return;

    const learnerMsg: ChatMessage = {
      id: `learner-${Date.now()}`,
      role: "learner",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, learnerMsg]);
    setInputText("");
    setSending(true);

    // Update vocab chip statuses client-side
    const lower = text.toLowerCase();
    setVocabChips((prev) =>
      prev.map((chip) => ({
        ...chip,
        status:
          chip.status === "unused" && lower.includes(chip.word.toLowerCase())
            ? "used"
            : chip.status,
      }))
    );

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      // Try real API first; fall back to stub if AI is disabled
      const res = await fetch(`${API_BASE}/me/conversations/turn`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenario_slug: slug,
          message: text,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      let replyText: string;
      if (res.ok) {
        const data = await res.json();
        replyText = data.reply ?? data.message ?? "...";
      } else {
        // Stub response when AI is disabled
        replyText = getStubReply(text, scenario);
      }

      const tutorMsg: ChatMessage = {
        id: `tutor-${Date.now()}`,
        role: "tutor",
        text: replyText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, tutorMsg]);
    } catch {
      // Stub fallback
      const tutorMsg: ChatMessage = {
        id: `tutor-${Date.now()}`,
        role: "tutor",
        text: getStubReply(text, scenario),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, tutorMsg]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleEndMission() {
    // Mark unused chips as missed
    setVocabChips((prev) =>
      prev.map((chip) =>
        chip.status === "unused" ? { ...chip, status: "missed" } : chip
      )
    );
    setMissionEnded(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <p className="text-semantic-text-muted mb-4">
          {t("conversations.mission.notFound", {
            defaultValue: "Mission not found.",
          })}
        </p>
        <Link to="/conversations" className="text-primary-600 hover:underline">
          ← {t("conversations.backToScenarios", { defaultValue: "Back to scenarios" })}
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/conversations"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label={t("common.back", { defaultValue: "Back" })}
          >
            <ArrowLeft className="w-4 h-4 text-semantic-text-muted" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-semantic-text truncate">
              {scenario.title}
            </h1>
            <p className="text-xs text-semantic-text-muted truncate">
              {t("conversations.mission.roles", {
                aiRole: scenario.ai_role,
                learnerRole: scenario.learner_role,
                defaultValue: `You: ${scenario.learner_role} · AI: ${scenario.ai_role}`,
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <CefrBadge level={scenario.level as "A1"} />
          {/* Mobile: vocab drawer toggle */}
          <button
            type="button"
            onClick={() => setVocabDrawerOpen((v) => !v)}
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={t("conversations.mission.toggleVocab", { defaultValue: "Toggle vocabulary panel" })}
          >
            <Info className="w-4 h-4 text-semantic-text-muted" />
          </button>
          {!missionEnded && (
            <button
              type="button"
              onClick={handleEndMission}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" aria-hidden />
              {t("conversations.mission.endMission", { defaultValue: "End mission" })}
            </button>
          )}
        </div>
      </div>

      {/* Mobile vocab drawer */}
      {vocabDrawerOpen && (
        <div className="md:hidden flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-semantic-surface p-3">
          <VocabPanel chips={vocabChips} grammarTargets={scenario.target_grammar} compact />
          <button
            type="button"
            onClick={() => setVocabDrawerOpen(false)}
            className="mt-2 flex items-center gap-1 text-xs text-semantic-text-muted hover:text-semantic-text"
          >
            <ChevronUp className="w-3.5 h-3.5" /> {t("common.close", { defaultValue: "Close" })}
          </button>
        </div>
      )}

      {/* Main content — two-column on desktop */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: Chat (60%) */}
        <div className="flex-1 flex flex-col min-h-0 md:w-3/5">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-semantic-text-muted text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("conversations.mission.thinking", { defaultValue: "Thinking…" })}</span>
              </div>
            )}
            {missionEnded && (
              <MissionEndedCard
                usedCount={vocabChips.filter((c) => c.status === "used").length}
                totalCount={vocabChips.length}
              />
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input bar */}
          {!missionEnded && (
            <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t("conversations.mission.inputPlaceholder", {
                    defaultValue: "Type your response…",
                  })}
                  disabled={sending}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-semantic-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="p-2.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label={t("conversations.mission.send", { defaultValue: "Send" })}
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right: Vocab panel (40%) — hidden on mobile */}
        <div className="hidden md:flex md:w-2/5 flex-col border-l border-gray-200 dark:border-gray-700 overflow-y-auto p-4 bg-semantic-surface">
          <VocabPanel chips={vocabChips} grammarTargets={scenario.target_grammar} />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: ChatMessage }) {
  const isTutor = message.role === "tutor";
  return (
    <div className={`flex ${isTutor ? "justify-start" : "justify-end"}`}>
      <div
        className={[
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isTutor
            ? "bg-semantic-surface-2 text-semantic-text rounded-tl-sm"
            : "bg-primary-600 text-white rounded-tr-sm",
        ].join(" ")}
      >
        {message.text}
      </div>
    </div>
  );
}

type VocabPanelProps = {
  chips: VocabChip[];
  grammarTargets: string[];
  compact?: boolean;
};

function VocabPanel({ chips, grammarTargets, compact }: VocabPanelProps) {
  const { t } = useTranslation();
  return (
    <div className={compact ? "space-y-3" : "space-y-6"}>
      {/* Target vocabulary */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-semantic-text-muted mb-2">
          {t("conversations.mission.targetVocab", { defaultValue: "Target vocabulary" })}
        </h2>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <VocabChipBadge key={chip.word} chip={chip} />
          ))}
        </div>
      </div>

      {/* Grammar checklist */}
      {grammarTargets.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-semantic-text-muted mb-2">
            {t("conversations.mission.grammarFocus", { defaultValue: "Grammar focus" })}
          </h2>
          <ul className="space-y-1.5">
            {grammarTargets.map((g) => (
              <li key={g} className="flex items-start gap-2 text-sm text-semantic-text">
                <Circle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-300 dark:text-gray-600" aria-hidden />
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tips */}
      {!compact && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
            {t("conversations.mission.tipHeading", { defaultValue: "💡 Tip" })}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {t("conversations.mission.tipBody", {
              defaultValue:
                "Try to use at least 3 vocabulary words. Don't worry about perfect grammar — focus on communication!",
            })}
          </p>
        </div>
      )}
    </div>
  );
}

function VocabChipBadge({ chip }: { chip: VocabChip }) {
  const base = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors";
  const styles = {
    unused: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    used: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700",
    missed: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700",
  };

  return (
    <span className={`${base} ${styles[chip.status]}`}>
      {chip.status === "used" && <CheckCircle2 className="w-3 h-3" aria-hidden />}
      {chip.status === "missed" && <span aria-hidden>!</span>}
      {chip.word}
    </span>
  );
}

function MissionEndedCard({ usedCount, totalCount }: { usedCount: number; totalCount: number }) {
  const { t } = useTranslation();
  const pct = totalCount > 0 ? Math.round((usedCount / totalCount) * 100) : 0;

  return (
    <div className="rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-5 text-center space-y-2">
      <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto" aria-hidden />
      <h3 className="font-semibold text-semantic-text">
        {t("conversations.mission.endedTitle", { defaultValue: "Mission complete!" })}
      </h3>
      <p className="text-sm text-semantic-text-muted">
        {t("conversations.mission.vocabScore", {
          used: usedCount,
          total: totalCount,
          pct,
          defaultValue: `You used ${usedCount}/${totalCount} target words (${pct}%)`,
        })}
      </p>
      <Link
        to="/conversations"
        className="inline-block mt-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        {t("conversations.mission.tryAnother", { defaultValue: "Try another mission" })}
      </Link>
    </div>
  );
}

// ─── Stub AI replies ──────────────────────────────────────────────────────────

function getStubReply(learnerText: string, scenario: ConversationScenario | null): string {
  const lower = learnerText.toLowerCase();
  if (!scenario) return "That's great! Keep going.";

  // Generic encouraging stubs based on message length
  if (lower.length < 10) {
    return "Can you say a bit more? I'd love to hear more from you!";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("name")) {
    return `Nice to meet you! I'm ${scenario.ai_role}. How are you today?`;
  }
  if (lower.includes("from") || lower.includes("country")) {
    return "That's wonderful! I've always wanted to visit. What's it like there?";
  }
  if (lower.includes("work") || lower.includes("study") || lower.includes("job")) {
    return "Interesting! That sounds like meaningful work. How long have you been doing that?";
  }
  return "Great! That's really good English. Can you tell me more?";
}
