import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  PenLine,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  History,
  Clock,
} from "lucide-react";
import { aiTutorAPI } from "@/lib/api/aiTutor";
import { useUserStore } from "@/stores/useUserStore";
import { getLearnerLanguage } from "@/features/lessons/utils/learnerLanguage";
import type { WritingCoachResponse, InlineAnnotation } from "@/lib/api/aiTutor";

// ── Local-storage history ────────────────────────────────────────────────────

const HISTORY_KEY = "writing-coach-history";
const MAX_HISTORY = 20;

type HistoryEntry = {
  id: string; // ISO timestamp
  text: string;
  response: WritingCoachResponse;
};

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(-MAX_HISTORY)));
  } catch {
    // ignore storage errors (quota, private browsing)
  }
}

// ── AnnotatedText ─────────────────────────────────────────────────────────────

/**
 * Renders `text` with coloured wavy-underline spans at annotation offsets.
 * Hovering a span shows a tooltip with the issue and suggestion.
 */
function AnnotatedText({
  text,
  annotations,
}: {
  text: string;
  annotations: InlineAnnotation[];
}) {
  const [tooltip, setTooltip] = useState<{
    ann: InlineAnnotation;
    rect: DOMRect;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort annotations by offset (ascending) and remove overlapping ones
  const sorted = [...annotations]
    .sort((a, b) => a.offset - b.offset)
    .reduce<InlineAnnotation[]>((acc, ann) => {
      const prev = acc[acc.length - 1];
      if (prev && ann.offset < prev.offset + prev.length) return acc; // skip overlap
      return [...acc, ann];
    }, []);

  // Segment the text into plain / annotated pieces
  type Segment =
    | { kind: "text"; content: string }
    | { kind: "ann"; content: string; ann: InlineAnnotation };
  const segments: Segment[] = [];
  let cursor = 0;

  for (const ann of sorted) {
    const start = Math.max(ann.offset, cursor);
    const end = ann.offset + ann.length;
    if (start > cursor) {
      segments.push({ kind: "text", content: text.slice(cursor, start) });
    }
    if (end > start && start < text.length) {
      segments.push({
        kind: "ann",
        content: text.slice(start, Math.min(end, text.length)),
        ann,
      });
    }
    cursor = Math.min(end, text.length);
  }
  if (cursor < text.length) {
    segments.push({ kind: "text", content: text.slice(cursor) });
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="font-mono text-sm bg-semantic-surface-2 dark:bg-gray-800 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
        {segments.map((seg, i) =>
          seg.kind === "text" ? (
            <span key={i}>{seg.content}</span>
          ) : (
            <span
              key={i}
              role="mark"
              aria-label={`${seg.ann.issue}: ${seg.ann.suggestion}`}
              className="cursor-help underline decoration-wavy decoration-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded px-0.5 relative"
              onMouseEnter={(e) =>
                setTooltip({ ann: seg.ann, rect: e.currentTarget.getBoundingClientRect() })
              }
              onFocus={(e) =>
                setTooltip({ ann: seg.ann, rect: e.currentTarget.getBoundingClientRect() })
              }
              onMouseLeave={() => setTooltip(null)}
              onBlur={() => setTooltip(null)}
              tabIndex={0}
            >
              {seg.content}
            </span>
          )
        )}
      </div>

      {/* Tooltip rendered at a fixed position so it's never clipped */}
      {tooltip && (
        <div
          role="tooltip"
          className="fixed z-50 max-w-xs bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl p-3 pointer-events-none"
          style={{
            left: tooltip.rect.left,
            top: tooltip.rect.bottom + 6,
          }}
        >
          <p className="font-semibold mb-1 text-red-300">{tooltip.ann.issue}</p>
          <p className="text-gray-300">
            <span className="font-medium text-white">Suggestion: </span>
            {tooltip.ann.suggestion}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; data: WritingCoachResponse; originalText: string }
  | { status: "error" };

export default function WritingCoachTab() {
  const { t, i18n } = useTranslation();
  const profile = useUserStore((s) => s.profile);
  const [text, setText] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  const [exemplarExpanded, setExemplarExpanded] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const learnerLanguage = getLearnerLanguage(i18n.language) ?? "en";
  const cefrLevel = profile?.cefr_estimate ?? "A1";

  // Load history from localStorage on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 10) return;
    setState({ status: "loading" });
    setExemplarExpanded(false);

    const result = await aiTutorAPI.writingCoach({
      text: text.trim(),
      learner_language: learnerLanguage,
      cefr_level: cefrLevel,
    });

    if (!result) {
      setState({ status: "error" });
    } else if ("code" in result && result.code === "ai_disabled") {
      setState({ status: "error" }); // Should not happen with mock fallback
    } else if ("scores" in result) {
      setState({ status: "done", data: result, originalText: text.trim() });

      // Persist to history
      const entry: HistoryEntry = {
        id: new Date().toISOString(),
        text: text.trim(),
        response: result,
      };
      const updated = [...loadHistory(), entry];
      saveHistory(updated);
      setHistory(updated);
    }
  }

  function loadFromHistory(entry: HistoryEntry) {
    setText(entry.text);
    setState({ status: "done", data: entry.response, originalText: entry.text });
    setExemplarExpanded(false);
    setHistoryOpen(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor="writing-text" className="text-sm font-medium text-semantic-text">
          {t("aiTutor.writingCoach.label", { defaultValue: "Paste your writing for feedback" })}
        </label>
        <textarea
          id="writing-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("aiTutor.writingCoach.placeholder", {
            defaultValue: "e.g. Yesterday I go to market and buyed some food.",
          })}
          rows={5}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-semantic-text px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={state.status === "loading"}
        />
        <div className="flex items-center justify-between gap-2">
          {/* History toggle */}
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <History className="w-3.5 h-3.5" aria-hidden />
              {historyOpen ? "Hide history" : `History (${history.length})`}
            </button>
          )}
          <button
            type="submit"
            disabled={text.trim().length < 10 || state.status === "loading"}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state.status === "loading" ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            ) : (
              <PenLine className="w-4 h-4" aria-hidden />
            )}
            {t("aiTutor.writingCoach.submit", { defaultValue: "Get Feedback" })}
          </button>
        </div>
      </form>

      {/* Submission history */}
      {historyOpen && history.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Previous submissions
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {[...history].reverse().map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => loadFromHistory(entry)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" aria-hidden />
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(entry.id).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-semantic-text line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {entry.text}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback results */}
      {state.status === "done" && (
        <div className="flex flex-col gap-4 text-sm">
          {/* Annotated original text */}
          {state.data.inline_annotations.length > 0 && (
            <div>
              <p className="font-semibold text-semantic-text mb-2">
                {t("aiTutor.writingCoach.annotatedText", { defaultValue: "Your text (hover errors for tips)" })}
              </p>
              <AnnotatedText
                text={state.originalText}
                annotations={state.data.inline_annotations}
              />
            </div>
          )}

          {/* Scores */}
          {state.data.scores.length > 0 && (
            <div>
              <p className="font-semibold text-semantic-text mb-2">
                {t("aiTutor.writingCoach.scores", { defaultValue: "Skill scores" })}
              </p>
              <div className="flex flex-col gap-2">
                {state.data.scores.map((score, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg bg-semantic-surface-2 p-3">
                    <div className="flex-shrink-0 w-10 text-center">
                      <span
                        className={`text-xl font-bold ${
                          score.score >= 7
                            ? "text-green-600 dark:text-green-400"
                            : score.score >= 5
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {score.score}
                      </span>
                      <span className="text-xs text-semantic-text-muted">/10</span>
                    </div>
                    <div>
                      <p className="font-medium text-semantic-text">{score.skill}</p>
                      <p className="text-semantic-text-muted">{score.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rewritten exemplar — collapsed by default */}
          {state.data.rewritten_exemplar && (
            <div>
              <button
                type="button"
                onClick={() => setExemplarExpanded((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-semibold text-semantic-text hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                aria-expanded={exemplarExpanded}
              >
                {exemplarExpanded ? (
                  <ChevronDown className="w-4 h-4" aria-hidden />
                ) : (
                  <ChevronRight className="w-4 h-4" aria-hidden />
                )}
                {t("aiTutor.writingCoach.rewritten", { defaultValue: "Show stronger version" })}
              </button>
              {exemplarExpanded && (
                <div className="mt-2 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3 text-semantic-text whitespace-pre-wrap text-sm">
                  {state.data.rewritten_exemplar}
                </div>
              )}
            </div>
          )}

          {/* Annotation list (secondary, for accessibility) */}
          {state.data.inline_annotations.length > 0 && (
            <div>
              <p className="font-semibold text-semantic-text mb-2">
                {t("aiTutor.writingCoach.annotations", { defaultValue: "Corrections" })}
              </p>
              <ul className="flex flex-col gap-2" aria-label="writing annotations">
                {state.data.inline_annotations.map((ann, i) => (
                  <li key={i} className="rounded-lg bg-semantic-surface-2 p-3">
                    <p className="text-semantic-text-muted mb-0.5">{ann.issue}</p>
                    <p className="font-medium text-semantic-text">
                      {t("aiTutor.writingCoach.suggestion", { defaultValue: "Suggestion" })}:{" "}
                      <span className="text-green-700 dark:text-green-400">{ann.suggestion}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {state.status === "error" && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
          {t("aiTutor.error.network", { defaultValue: "Something went wrong. Please try again." })}
        </div>
      )}
    </div>
  );
}
