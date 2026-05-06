/**
 * Frontend API client for the AI Tutor endpoints.
 *
 * Methods return the typed response on success, or `null` when there is no
 * authenticated session or a real network/server error occurred (errors are
 * caught and logged so callers can render a degraded UI without try/catch).
 *
 * When AI features are disabled (no ANTHROPIC_API_KEY on the backend), the
 * server returns 503 with { code: 'ai_disabled', detail: '...' }. The shared
 * authedFetch helper recognizes that specific shape and surfaces the payload
 * as a normal value (instead of throwing). This module then normalizes the
 * body so both `detail` (the canonical backend field) and `message` (the
 * historical alias kept for any older readers) are populated.
 */
import { authedPostJson } from "@/lib/api/authedFetch";

// ── Response types ────────────────────────────────────────────────────────

/**
 * Shape returned by the backend when AI features are disabled. `detail` is
 * FastAPI's default key for an HTTPException body and is always present.
 * `message` is a normalized alias populated by `normalizeIfDisabled` so any
 * caller still reading the older field name keeps working.
 */
export type AiDisabledResponse = {
  code: "ai_disabled";
  detail: string;
  message: string;
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

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * If the result is the ai_disabled graceful-degrade body, return a copy
 * with both `detail` and `message` populated (older callers may still
 * read either). Pass-through for any other shape.
 */
function normalizeIfDisabled<T>(result: T | null): T | null {
  if (!result || typeof result !== "object" || !("code" in result)) return result;
  const r = result as { code?: string; detail?: string; message?: string };
  if (r.code !== "ai_disabled") return result;
  const detail = r.detail ?? r.message ?? "";
  return {
    code: "ai_disabled",
    detail,
    message: r.message ?? detail,
  } as T;
}

async function postWithDisableNormalization<T>(
  path: string,
  params: unknown,
  label: string,
): Promise<T | AiDisabledResponse | null> {
  try {
    const result = await authedPostJson<T | AiDisabledResponse>(path, params);
    return normalizeIfDisabled(result);
  } catch (err) {
    console.error(`[aiTutorApi] ${label} error:`, err);
    return null;
  }
}

// ── Client ───────────────────────────────────────────────────────────────

class AiTutorAPIClass {
  async explain(params: {
    question: string;
    context?: string;
    learner_language?: string;
    cefr_level?: string;
  }): Promise<ExplainResponse | AiDisabledResponse | null> {
    return postWithDisableNormalization<ExplainResponse>(
      "/me/ai-tutor/explain",
      params,
      "explain",
    );
  }

  async correct(params: {
    sentence: string;
    learner_language?: string;
    cefr_level?: string;
  }): Promise<CorrectionResponse | AiDisabledResponse | null> {
    return postWithDisableNormalization<CorrectionResponse>(
      "/me/ai-tutor/correct",
      params,
      "correct",
    );
  }

  async practice(params: {
    skill?: string;
    topic?: string;
    cefr_level?: string;
    learner_language?: string;
    count?: number;
  }): Promise<PracticeResponse | AiDisabledResponse | null> {
    return postWithDisableNormalization<PracticeResponse>(
      "/me/ai-tutor/practice",
      params,
      "practice",
    );
  }

  async writingCoach(params: {
    text: string;
    learner_language?: string;
    cefr_level?: string;
  }): Promise<WritingCoachResponse | AiDisabledResponse | null> {
    return postWithDisableNormalization<WritingCoachResponse>(
      "/me/ai-tutor/writing-coach",
      params,
      "writing-coach",
    );
  }
}

export const aiTutorAPI = new AiTutorAPIClass();
