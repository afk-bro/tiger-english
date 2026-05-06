import { authedGet, authedPostJson } from "@/lib/api/authedFetch";

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
  async completeSection(args: { unitSlug: string; sectionKey: string }) {
    try {
      return await authedPostJson<CompletedSection>(
        "/me/progress/complete-section",
        { unit_slug: args.unitSlug, section_key: args.sectionKey },
      );
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
      return await authedPostJson<{ id: number; attempted_at: string }>(
        "/me/progress/attempt-exercise",
        {
          unit_slug: args.unitSlug,
          section_key: args.sectionKey,
          exercise_id: args.exerciseId,
          is_correct: args.isCorrect,
        },
      );
    } catch (err) {
      console.error("ProgressAPI.attemptExercise failed", err);
      return null;
    }
  }

  async reviewFlashcard(args: { flashcardId: string; status: "known" | "unknown" }) {
    try {
      return await authedPostJson<{ id: number; reviewed_at: string }>(
        "/me/progress/review-flashcard",
        { flashcard_id: args.flashcardId, status: args.status },
      );
    } catch (err) {
      console.error("ProgressAPI.reviewFlashcard failed", err);
      return null;
    }
  }

  getSummary() {
    // Read method: lets errors propagate so the hook can render an error state.
    return authedGet<ProgressSummary>("/me/progress/summary");
  }
}

export const ProgressAPI = new ProgressAPIClass();
