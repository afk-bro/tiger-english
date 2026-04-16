// src/components/exercises/exercises.types.ts

export type McqOption = {
  id: string;
  text: string;
};

export type McqExercise = {
  id: string;
  question: string;
  options: McqOption[];
  correctOptionId: string;
};

export type FillBlankExercise = {
  id: string;
  beforeBlank: string;
  afterBlank: string;
  correctAnswer: string;
  acceptableAnswers?: string[];
};
