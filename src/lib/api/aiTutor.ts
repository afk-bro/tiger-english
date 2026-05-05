/**
 * Frontend API client for the AI Tutor endpoints.
 * All methods return typed responses or throw on network/server error.
 * When the server returns { code: 'ai_disabled' }, the result is returned
 * as-is so callers can degrade gracefully.
 */
import { supabase } from "@/lib/supabase";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8000/api/v1";

// ── Response types ────────────────────────────────────────────────────────

export type AiDisabledResponse = { code: "ai_disabled"; message: string };

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
