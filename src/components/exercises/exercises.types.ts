// src/components/exercises/exercises.types.ts

import type { LearnerLanguage } from "@/features/lessons/utils/learnerLanguage";

export type McqOption = {
  id: string;
  text: string;
};

export type McqExercise = {
  id: string;
  question: string;
  questionTranslations?: Partial<Record<LearnerLanguage, string>>;
  options: McqOption[];
  correctOptionId: string;
};

export type FillBlankExercise = {
  id: string;
  instruction?: string;
  instructionTranslations?: Partial<Record<LearnerLanguage, string>>;
  beforeBlank: string;
  afterBlank: string;
  correctAnswer: string;
  acceptableAnswers?: string[];
};

/**
 * A single word ↔ image pair in a match-the-word-to-image exercise.
 *
 * `imageUrl` is normally populated by the lesson-images pipeline (same
 * shape used elsewhere) but may be hardcoded for non-pipeline authoring.
 * `fallback` is rendered when no imageUrl is set so the exercise still
 * works visually before pipeline images exist.
 *
 * Pair count should be 3–5 for mobile ergonomics — more than that
 * forces scrolling and weakens the spatial mapping that makes tap-
 * to-pair fast.
 */
export type MatchPair = {
  id: string;
  word: string;
  imageUrl?: string;
  imageAlt?: string;
  /** Presence signals the lesson-images pipeline to resolve an icon/photo
   *  for this pair; the search query itself is taken from `word`. */
  imagePrompt?: string;
  /** Visual fallback (emoji or 1–2 char glyph) shown when imageUrl is missing. */
  fallback?: string;
  translations?: Partial<Record<LearnerLanguage, string>>;
};

export type MatchExercise = {
  id: string;
  prompt: string;
  promptTranslations?: Partial<Record<LearnerLanguage, string>>;
  pairs: MatchPair[];
};
