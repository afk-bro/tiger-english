// src/features/lessons/data/exercises/unit-1.ts
import type { McqExercise, FillBlankExercise } from "@/components/exercises/exercises.types";

export const grammarMcq1: McqExercise = {
  id: "u1-grammar-mcq-1",
  question: "Choose the correct form: 'She ___ a student.'",
  options: [
    { id: "a", text: "am" },
    { id: "b", text: "is" },
    { id: "c", text: "are" },
  ],
  correctOptionId: "b",
};

export const activitiesFillBlank1: FillBlankExercise = {
  id: "u1-activities-fb-1",
  beforeBlank: "They",
  afterBlank: "from Thailand.",
  correctAnswer: "are",
  acceptableAnswers: ["are", "'re", "they're"],
};
