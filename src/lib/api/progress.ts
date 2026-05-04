import { supabase } from "@/lib/supabase";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000/api/v1";

export type CompletedSection = {
  unit_slug: string;
  section_key: string;
  completed_at: string;
};

export type ProgressSummary = {
  sections_completed: CompletedSection[];
  exercise_attempts: { total: number; correct: number };
  flashcards: { reviewed_total: number; currently_known: number };
  streak: { current_days: number };
  study_days_this_week: number;
  last_active_at: string | null;
  activity: {
    lessons_completed: number;
    exercises_attempted: number;
    exercises_correct: number;
    flashcards_reviewed: number;
    flashcards_mastered: number;
  };
};

class ProgressAPIClass {
  private async authedFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        // Caller headers are spread first so the auth token + JSON content
        // type below cannot be silently overridden by a malformed init.
        // For an authedFetch helper, those two headers are non-negotiable.
        ...init?.headers,
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Progress API ${path} returned ${res.status}`);
    }
    return res.json();
  }

  async completeSection(args: { unitSlug: string; sectionKey: string }) {
    try {
      return await this.authedFetch<CompletedSection>("/me/progress/complete-section", {
        method: "POST",
        body: JSON.stringify({
          unit_slug: args.unitSlug,
          section_key: args.sectionKey,
        }),
      });
    } catch (err) {
      console.error("ProgressAPI.completeSection failed", err);
      return null;
    }
  }

  async attemptExercise(args: {
    unitSlug: string;
    sectionKey: string;
    exerciseId: string;
    isCorrect: boolean;
  }) {
    try {
      return await this.authedFetch<{ id: number; attempted_at: string }>(
        "/me/progress/attempt-exercise",
        {
          method: "POST",
          body: JSON.stringify({
            unit_slug: args.unitSlug,
            section_key: args.sectionKey,
            exercise_id: args.exerciseId,
            is_correct: args.isCorrect,
          }),
        },
      );
    } catch (err) {
      console.error("ProgressAPI.attemptExercise failed", err);
      return null;
    }
  }

  async reviewFlashcard(args: { flashcardId: string; status: "known" | "unknown" }) {
    try {
      return await this.authedFetch<{ id: number; reviewed_at: string }>(
        "/me/progress/review-flashcard",
        {
          method: "POST",
          body: JSON.stringify({
            flashcard_id: args.flashcardId,
            status: args.status,
          }),
        },
      );
    } catch (err) {
      console.error("ProgressAPI.reviewFlashcard failed", err);
      return null;
    }
  }

  getSummary() {
    // Read method: throws on error so the hook can render an error state.
    return this.authedFetch<ProgressSummary>("/me/progress/summary");
  }
}

export const ProgressAPI = new ProgressAPIClass();
