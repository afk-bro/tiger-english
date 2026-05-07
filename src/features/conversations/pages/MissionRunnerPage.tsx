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
  PartyPopper,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { API_BASE } from "@/lib/api/config";
import { authedGet, authedPostJson } from "@/lib/api/authedFetch";
import CefrBadge from "@/components/CefrBadge";
import type { ConversationScenario } from "../conversations.types";

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

type ConversationScores = {
  task_success: number;
  comprehension: number;
  response_relevance: number;
  language_control: number;
  repair_ability: number;
  independence: number;
};

type EndSessionResult = {
  scores: ConversationScores;
  feedback_summary: string;
  review_items_added: string[];
  target_vocab_hits: string[];
  target_vocab_misses: string[];
};

// ─── Hook: load scenario ──────────────────────────────────────────────────────

function useScenario(slug: string | undefined) {
  const [scenario, setScenario] = useState<ConversationScenario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await authedGet<{ scenarios: ConversationScenario[] }>(
          "/me/conversations/scenarios",
        );
        if (cancelled) return;
        const found = data?.scenarios.find((s) => s.slug === slug);
        setScenario(found ?? null);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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
  const [endResults, setEndResults] = useState<EndSessionResult | null>(null);
  const [endingMission, setEndingMission] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [rateLimitToast, setRateLimitToast] = useState<{ message: string; retryAfter: number } | null>(null);
  const rateLimitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reconnectToast, setReconnectToast] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // True once every target word has flipped to "used". Drives the
  // success banner that surfaces a "Finish & see results" CTA so the
  // user doesn't have to find the small red abort button to wrap up.
  const allTargetsHit =
    vocabChips.length > 0 && vocabChips.every((c) => c.status === "used");

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

  // NOTE: this path doesn't go through the shared authedFetch helper because:
  // - Retry semantics: we retry only on network failures (fetch throws), not on
  //   HTTP errors. authedFetch throws on any non-2xx, which would cause this
  //   loop to retry rate-limit (429) responses — wrong.
  // - 429 handling: we read `retry_after_seconds` from the body and surface a
  //   toast. Easier to keep that branch inline alongside the retry logic.
  // If the helper grows a "raw response" mode in the future, this can migrate.
  async function fetchWithRetry(
    url: string,
    options: RequestInit,
    retryDelays = [200, 800, 3200]
  ): Promise<Response> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
      if (cancelledRef.current) throw new Error("cancelled");
      try {
        const res = await fetch(url, options);
        return res;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < retryDelays.length && !cancelledRef.current) {
          const delay = retryDelays[attempt];
          if (attempt === 0) {
            setReconnectToast(t("conversations.mission.reconnecting", {
              defaultValue: "Tutor disconnected — retrying...",
            }));
          }
          await new Promise<void>((res) => setTimeout(res, delay));
        }
      }
    }
    setReconnectToast(t("conversations.mission.connectionFailed", {
      defaultValue: "Connection failed. Please try again.",
    }));
    setTimeout(() => setReconnectToast(null), 4000);
    throw lastError ?? new Error("fetch failed");
  }

  async function handleSend() {
    const text = inputText.trim();
    if (!text || sending || missionEnded) return;
    cancelledRef.current = false;

    const learnerMsg: ChatMessage = {
      id: `learner-${Date.now()}`,
      role: "learner",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, learnerMsg]);
    setInputText("");
    setSending(true);

    // Update vocab chip statuses client-side. Compute the next state
    // synchronously so we can also derive `remaining_targets` from the
    // same snapshot for this turn's request body — setVocabChips is
    // async and would lag a turn behind.
    const lower = text.toLowerCase();
    const updatedChips = vocabChips.map((chip) => ({
      ...chip,
      status:
        chip.status === "unused" && lower.includes(chip.word.toLowerCase())
          ? ("used" as const)
          : chip.status,
    }));
    setVocabChips(updatedChips);

    const remainingTargets = updatedChips
      .filter((c) => c.status === "unused")
      .map((c) => c.word);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetchWithRetry(`${API_BASE}/me/conversations/turn`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenario_slug: slug,
          message: text,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
          remaining_targets: remainingTargets,
        }),
      });
      // Clear reconnect toast on success
      setReconnectToast(null);

      let replyText: string;
      if (res.ok) {
        const data = await res.json();
        replyText = data.reply ?? data.message ?? "...";
      } else if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        const retryAfter = data.retry_after_seconds ?? 30;
        setRateLimitToast({
          message: t("conversations.mission.rateLimited", {
            seconds: retryAfter,
            defaultValue: `Slow down — try again in ${retryAfter} seconds`,
          }),
          retryAfter,
        });
        // Remove the learner's message from display (it won't be processed)
        setMessages((prev) => prev.filter((m) => m.id !== learnerMsg.id));
        if (rateLimitTimerRef.current) clearTimeout(rateLimitTimerRef.current);
        rateLimitTimerRef.current = setTimeout(() => setRateLimitToast(null), retryAfter * 1000);
        return;
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
    } catch (err) {
      // Don't add stub reply if user cancelled or after repeated network failures
      if (err instanceof Error && err.message === "cancelled") {
        return;
      }
      // Stub fallback for non-network errors
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

  function handleEndMissionClick() {
    const unusedCount = vocabChips.filter((c) => c.status === "unused").length;
    // Show confirm modal if any success criteria not met (unused vocab words)
    if (unusedCount > 0 && messages.length < 4) {
      setShowEndConfirm(true);
    } else {
      doEndMission();
    }
  }

  async function doEndMission() {
    setShowEndConfirm(false);
    cancelledRef.current = true;
    setEndingMission(true);

    // Mark unused chips as missed
    const finalChips = vocabChips.map((chip) =>
      chip.status === "unused" ? { ...chip, status: "missed" as const } : chip
    );
    setVocabChips(finalChips);

    const vocabHits = finalChips.filter((c) => c.status === "used").map((c) => c.word);
    const vocabMisses = finalChips.filter((c) => c.status === "missed").map((c) => c.word);
    const learnerTurns = messages.filter((m) => m.role === "learner").length;

    try {
      const data = await authedPostJson<EndSessionResult>(
        "/me/conversations/end",
        {
          scenario_slug: slug,
          turn_count: learnerTurns,
          vocab_hits: vocabHits,
          vocab_misses: vocabMisses,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
        },
      );
      if (data) setEndResults(data);
    } catch {
      // Fallback: show basic results without backend data
    } finally {
      setEndingMission(false);
      setMissionEnded(true);
    }
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
      {/* Reconnect toast */}
      {reconnectToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" aria-hidden="true" />
          {reconnectToast}
        </div>
      )}
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
              onClick={handleEndMissionClick}
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
              endResults ? (
                <MissionResultsCard results={endResults} />
              ) : endingMission ? (
                <div className="flex items-center gap-2 text-semantic-text-muted text-sm p-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scoring your session…</span>
                </div>
              ) : (
                <MissionEndedCard
                  usedCount={vocabChips.filter((c) => c.status === "used").length}
                  totalCount={vocabChips.length}
                />
              )
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Mission complete banner — auto-shown when every target word
              has been used. The 'End mission' button in the top bar is
              styled as an abort affordance (red, Flag icon); this banner
              is the success path so finishing feels intentional rather
              than like termination. Input stays available so the user
              can keep practicing past the minimum bar if they want. */}
          {allTargetsHit && !missionEnded && (
            <div className="flex-shrink-0 px-3 pt-3">
              <div className="flex items-center gap-3 rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-3">
                <PartyPopper
                  className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0"
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                    {t("conversations.mission.allTargetsHit.title", {
                      defaultValue: "All target words used!",
                    })}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {t("conversations.mission.allTargetsHit.subtitle", {
                      defaultValue:
                        "Wrap up to see your scores, or keep practicing.",
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={doEndMission}
                  disabled={endingMission}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {endingMission ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden />
                  )}
                  {t("conversations.mission.allTargetsHit.cta", {
                    defaultValue: "Finish & see results",
                  })}
                </button>
              </div>
            </div>
          )}

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

      {/* Rate limit toast */}
      {rateLimitToast && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-orange-600 text-white text-sm font-medium shadow-lg"
        >
          <span>⏱</span>
          <span>{rateLimitToast.message}</span>
        </div>
      )}

      {/* End mission confirm modal */}
      {showEndConfirm && (
        <EndMissionModal
          unusedChips={vocabChips.filter((c) => c.status === "unused")}
          onConfirm={doEndMission}
          onCancel={() => setShowEndConfirm(false)}
        />
      )}
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

// ─── Full results card (shown when backend /end returns scores) ───────────────

const SCORE_LABELS: Record<keyof ConversationScores, string> = {
  task_success: "Task success",
  comprehension: "Comprehension",
  response_relevance: "Response relevance",
  language_control: "Language control",
  repair_ability: "Repair ability",
  independence: "Independence",
};

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = (score / 5) * 100;
  const color =
    score >= 4 ? "bg-green-500" : score >= 2.5 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-semantic-text-muted">{label}</span>
        <span className="text-xs font-semibold text-semantic-text">{score.toFixed(1)}<span className="text-gray-400">/5</span></span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MissionResultsCard({ results }: { results: EndSessionResult }) {
  const { t } = useTranslation();
  const avgScore =
    Object.values(results.scores).reduce((a, b) => a + b, 0) / 6;

  return (
    <div className="rounded-xl border-2 border-primary-200 dark:border-primary-800 bg-white dark:bg-gray-900 p-5 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0" aria-hidden />
        <div>
          <h3 className="font-semibold text-semantic-text text-base">
            {t("conversations.mission.endedTitle", { defaultValue: "Mission complete!" })}
          </h3>
          <p className="text-xs text-semantic-text-muted">
            Average score: {avgScore.toFixed(1)}/5
          </p>
        </div>
      </div>

      {/* 6 score criteria */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-semantic-text-muted">
          Scores
        </h4>
        {(Object.keys(SCORE_LABELS) as (keyof ConversationScores)[]).map((key) => (
          <ScoreBar key={key} label={SCORE_LABELS[key]} score={results.scores[key]} />
        ))}
      </div>

      {/* Feedback summary */}
      {results.feedback_summary && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Feedback</p>
          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
            {results.feedback_summary}
          </p>
        </div>
      )}

      {/* Review items added */}
      {results.review_items_added.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-semantic-text-muted mb-2">
            Review items added ({results.review_items_added.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {results.review_items_added.map((word) => (
              <span
                key={word}
                className="px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex items-center gap-2 pt-1">
        <Link
          to="/conversations"
          className="flex-1 text-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          {t("conversations.mission.tryAnother", { defaultValue: "Try another mission" })}
        </Link>
        <Link
          to="/review"
          className="flex-1 text-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-semantic-text text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Go to review
        </Link>
      </div>
    </div>
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

// ─── End mission confirm modal ───────────────────────────────────────────────

type EndMissionModalProps = {
  unusedChips: VocabChip[];
  onConfirm: () => void;
  onCancel: () => void;
};

function EndMissionModal({ unusedChips, onConfirm, onCancel }: EndMissionModalProps) {
  const { t } = useTranslation();
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-mission-title"
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} aria-hidden />
      {/* Modal card */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
        <h2 id="end-mission-title" className="text-base font-semibold text-semantic-text">
          {t("conversations.mission.confirmEnd.title", {
            defaultValue: "End mission early?",
          })}
        </h2>
        <p className="text-sm text-semantic-text-muted">
          {t("conversations.mission.confirmEnd.body", {
            defaultValue: "You haven't met all the success criteria yet:",
          })}
        </p>
        {unusedChips.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-semantic-text-muted mb-2 uppercase tracking-wide">
              {t("conversations.mission.confirmEnd.unused", {
                defaultValue: "Unused vocabulary:",
              })}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {unusedChips.map((c) => (
                <span
                  key={c.word}
                  className="px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700"
                >
                  {c.word}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-semantic-text text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t("conversations.mission.confirmEnd.cancel", { defaultValue: "Keep going" })}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            {t("conversations.mission.confirmEnd.confirm", { defaultValue: "End anyway" })}
          </button>
        </div>
      </div>
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
