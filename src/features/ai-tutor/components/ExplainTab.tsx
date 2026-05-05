/**
 * ExplainTab — sends the learner's question to /me/ai-tutor/explain/stream
 * and displays the AI response token-by-token via SSE streaming.
 *
 * Falls back to the non-streaming /explain endpoint if the browser does
 * not support ReadableStream body iteration (very rare in modern browsers).
 */
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Send, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { aiTutorAPI } from "@/lib/api/aiTutor";
import { useUserStore } from "@/stores/useUserStore";
import { getLearnerLanguage } from "@/features/lessons/utils/learnerLanguage";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8000/api/v1";

type Status = "idle" | "streaming" | "done" | "disabled" | "error";

export default function ExplainTab() {
  const { t, i18n } = useTranslation();
  const profile = useUserStore((s) => s.profile);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [explanation, setExplanation] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const learnerLanguage = getLearnerLanguage(i18n.language) ?? "en";
  const cefrLevel = profile?.cefr_estimate ?? "A1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;

    // Cancel any previous request
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setExplanation("");
    setStatus("streaming");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setStatus("error");
        return;
      }

      const res = await fetch(`${API_BASE}/me/ai-tutor/explain/stream`, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: q,
          learner_language: learnerLanguage,
          cefr_level: cefrLevel,
        }),
      });

      // If endpoint not found, fall back to non-streaming
      if (res.status === 404 || res.status === 405) {
        const fallback = await aiTutorAPI.explain({
          question: q,
          learner_language: learnerLanguage,
          cefr_level: cefrLevel,
        });
        if (!fallback) { setStatus("error"); return; }
        if ("code" in fallback && fallback.code === "ai_disabled") { setStatus("disabled"); return; }
        if ("explanation" in fallback) {
          setExplanation(fallback.explanation);
          setStatus("done");
        }
        return;
      }

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 503 || body?.code === "ai_disabled") {
          setStatus("disabled");
        } else {
          setStatus("error");
        }
        return;
      }

      // Read SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;
          try {
            const event = JSON.parse(raw) as { type: string; text?: string; code?: string };
            if (event.type === "token" && event.text) {
              setExplanation((prev) => prev + event.text);
            } else if (event.type === "done") {
              setStatus("done");
            } else if (event.type === "error") {
              if (event.code === "ai_disabled") setStatus("disabled");
              else setStatus("error");
            }
          } catch {
            /* ignore malformed SSE line */
          }
        }
      }

      // If we reach here without a "done" event, still mark as done
      setStatus((s) => (s === "streaming" ? "done" : s));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor="explain-question" className="text-sm font-medium text-semantic-text">
          {t("aiTutor.explain.label", { defaultValue: "Ask a grammar or vocabulary question" })}
        </label>
        <textarea
          id="explain-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("aiTutor.explain.placeholder", {
            defaultValue: "e.g. What is present simple?",
          })}
          rows={3}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-semantic-text px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={status === "streaming"}
        />
        <button
          type="submit"
          disabled={!question.trim() || status === "streaming"}
          className="self-end flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === "streaming" ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Send className="w-4 h-4" aria-hidden />
          )}
          {t("aiTutor.explain.submit", { defaultValue: "Ask" })}
        </button>
      </form>

      {(status === "streaming" || status === "done") && explanation && (
        <div className="rounded-lg bg-semantic-surface-2 p-4 text-sm text-semantic-text whitespace-pre-wrap">
          {explanation}
          {status === "streaming" && (
            <span className="inline-block w-0.5 h-4 bg-primary-500 animate-pulse motion-reduce:animate-none ml-0.5 align-middle" aria-hidden />
          )}
        </div>
      )}

      {status === "streaming" && !explanation && (
        <div className="flex items-center gap-2 text-sm text-semantic-text-muted">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          {t("aiTutor.explain.thinking", { defaultValue: "Thinking…" })}
        </div>
      )}

      {status === "disabled" && (
        <div className="flex items-start gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
          {t("aiTutor.disabled", { defaultValue: "AI Tutor is not available on this server." })}
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
          {t("aiTutor.error.network", { defaultValue: "Something went wrong. Please try again." })}
        </div>
      )}
    </div>
  );
}
