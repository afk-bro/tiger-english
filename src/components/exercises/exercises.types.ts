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
