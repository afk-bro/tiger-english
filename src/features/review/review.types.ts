// src/features/review/review.types.ts

export type ItemType =
  | "word"
  | "phrase"
  | "grammar_pattern"
  | "common_error"
  | "dialogue_line";

export type DifficultyRating = "incorrect" | "difficult" | "got_it" | "easy";

export type ReviewItem = {
  id: string;
  item_type: ItemType;
  /** The question / prompt shown to the learner */
  prompt: string;
  /** The correct answer */
  answer: string;
  /** Optional L1 translation hint */
  translation?: string;
  /** Optional note / explanation shown after reveal */
  note?: string;
  /** SM-2 state */
  ease_factor: number;
  interval_days: number;
  streak_correct: number;
  next_review_at: string;
  /** Raw exercise ID — used by the frontend to enrich prompt/answer via exerciseLookup */
  exercise_id?: string | null;
};

export type ReviewSessionResult = {
  total: number;
  correct: number;
  incorrect: number;
  skipped: number;
};
