/**
 * Frontend API client for the AI Tutor endpoints.
 *
 * Methods return the typed response on success, or `null` when there is no
 * authenticated session or a real network/server error occurred (errors are
 * caught and logged so callers can render a degraded UI without try/catch).
 *
 * When AI features are disabled (no ANTHROPIC_API_KEY on the backend), the
 * server returns 503 with { code: 'ai_disabled', detail: '...' }. authedFetch
 * recognizes that specific shape and returns the payload as a normal value
 * so callers can branch on `result.code === 'ai_disabled'` instead of seeing
 * a generic error.
 */
import { supabase } from "@/lib/supabase";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8000/api/v1";

// ── Response types ────────────────────────────────────────────────────────

/**
 * Shape returned by the backend when AI features are disabled. The `detail`
 * field is FastAPI's default key for the body of an HTTPException; older
 * docs/types referred to it as `message`, kept as an alias to avoid breaking
 * any caller that still reads it.
 */
export type AiDisabledResponse = {
  code: "ai_disabled";
  detail?: string;
  message?: string;
};

export type ExplainResponse = { explanation: string };

export type CorrectionResponse = {
  original: string;
  corrected: string;
  explanation: string;
  explanation_l1: string;
  try_again_prompt: string;
  try_again_answer: string;
};

export type PracticeItem = { question: string; answer: string; hint?: string };
export type PracticeResponse = { items: PracticeItem[] };

export type WritingScore = { skill: string; score: number; comment: string };
export type InlineAnnotation = {
  offset: number;
  length: number;
  issue: string;
  suggestion: string;
};
export type WritingCoachResponse = {
  scores: WritingScore[];
  inline_annotations: InlineAnnotation[];
  rewritten_exemplar: string;
};

// ── Client ───────────────────────────────────────────────────────────────

class AiTutorAPIClass {
  private async authedFetch<T>(path: string, body: unknown): Promise<T | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;

    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    // 503 with {code: "ai_disabled"} is a documented graceful-degrade signal,
    // not an error — surface it as a normal value so the tab UIs can render
    // the "AI is disabled" state instead of a generic failure.
    if (res.status === 503) {
      const body = await res.json().catch(() => null);
      if (body && typeof body === "object" && (body as { code?: string }).code === "ai_disabled") {
        return body as T;
      }
      console.error(`[aiTutorApi] ${path} → 503 (no ai_disabled payload)`, body);
      throw new Error(`AI tutor request failed: 503`);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[aiTutorApi] ${path} → ${res.status}`, text);
      throw new Error(`AI tutor request failed: ${res.status}`);
    }

    return (await res.json()) as T;
  }

  async explain(params: {
    question: string;
    context?: string;
    learner_language?: string;
    cefr_level?: string;
  }): Promise<ExplainResponse | AiDisabledResponse | null> {
    try {
      return await this.authedFetch<ExplainResponse | AiDisabledResponse>(
        "/me/ai-tutor/explain",
        params
      );
    } catch (err) {
      console.error("[aiTutorApi] explain error:", err);
      return null;
    }
  }

  async correct(params: {
    sentence: string;
    learner_language?: string;
    cefr_level?: string;
  }): Promise<CorrectionResponse | AiDisabledResponse | null> {
    try {
      return await this.authedFetch<CorrectionResponse | AiDisabledResponse>(
        "/me/ai-tutor/correct",
        params
      );
    } catch (err) {
      console.error("[aiTutorApi] correct error:", err);
      return null;
    }
  }

  async practice(params: {
    skill?: string;
    topic?: string;
    cefr_level?: string;
    learner_language?: string;
    count?: number;
  }): Promise<PracticeResponse | AiDisabledResponse | null> {
    try {
      return await this.authedFetch<PracticeResponse | AiDisabledResponse>(
        "/me/ai-tutor/practice",
        params
      );
    } catch (err) {
      console.error("[aiTutorApi] practice error:", err);
      return null;
    }
  }

  async writingCoach(params: {
    text: string;
    learner_language?: string;
    cefr_level?: string;
  }): Promise<WritingCoachResponse | AiDisabledResponse | null> {
    try {
      return await this.authedFetch<WritingCoachResponse | AiDisabledResponse>(
        "/me/ai-tutor/writing-coach",
        params
      );
    } catch (err) {
      console.error("[aiTutorApi] writing-coach error:", err);
      return null;
    }
  }
}

export const aiTutorAPI = new AiTutorAPIClass();
