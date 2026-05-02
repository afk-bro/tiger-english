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

export const activitiesNameMcq: McqExercise = {
  id: "u1-activities-mcq-1",
  question: "Choose the correct response to: \"What is your name?\"",
  options: [
    { id: "a", text: "I am from Germany." },
    { id: "b", text: "My name is Anna." },
    { id: "c", text: "Hello!" },
  ],
  correctOptionId: "b",
};

export const activitiesAddressFillBlank: FillBlankExercise = {
  id: "u1-activities-fb-1",
  beforeBlank: "",
  afterBlank: "is your address?",
  correctAnswer: "What",
};

export const activitiesPhoneFillBlank: FillBlankExercise = {
  id: "u1-activities-fb-2",
  beforeBlank: "What is your",
  afterBlank: "number?",
  correctAnswer: "phone",
};

export const activitiesThanksMcq: McqExercise = {
  id: "u1-activities-mcq-2",
  question: "Choose the correct response to: \"Thank you!\"",
  options: [
    { id: "a", text: "Hello!" },
    { id: "b", text: "I am Anna." },
    { id: "c", text: "You're welcome." },
  ],
  correctOptionId: "c",
};

export const activitiesThirdPersonMcq: McqExercise = {
  id: "u1-activities-mcq-3",
  question: "Choose the correct response to: \"What is her name?\"",
  options: [
    { id: "a", text: "Her name is Maria." },
    { id: "b", text: "My name is Maria." },
    { id: "c", text: "I am from Germany." },
  ],
  correctOptionId: "a",
};

export const activitiesWhereMcq: McqExercise = {
  id: "u1-activities-mcq-4",
  question: "Choose the correct word: \"___ are you from?\"",
  options: [
    { id: "a", text: "What" },
    { id: "b", text: "Where" },
    { id: "c", text: "When" },
  ],
  correctOptionId: "b",
};

export const activitiesFirstNameMcq: McqExercise = {
  id: "u1-activities-mcq-5",
  question: "Choose the correct response to: \"What is your first name?\"",
  options: [
    { id: "a", text: "My last name is Schmidt." },
    { id: "b", text: "My first name is Anna." },
    { id: "c", text: "My address is 12 Main Street." },
  ],
  correctOptionId: "b",
};

export const activitiesLastNameMcq: McqExercise = {
  id: "u1-activities-mcq-6",
  question: "Choose the correct response to: \"What is your last name?\"",
  options: [
    { id: "a", text: "My phone number is 555-1234." },
    { id: "b", text: "My first name is Anna." },
    { id: "c", text: "My last name is Schmidt." },
  ],
  correctOptionId: "c",
};
