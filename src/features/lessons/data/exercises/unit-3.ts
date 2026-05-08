// src/features/lessons/data/exercises/unit-3.ts
import type { McqExercise, FillBlankExercise } from "@/components/exercises/exercises.types";

export const grammarMcqTimeOfDay: McqExercise = {
  id: "u3-grammar-mcq-1",
  question: "It's 9 a.m. Choose the correct greeting:",
  questionTranslations: { vi: "Bây giờ là 9 giờ sáng. Chọn lời chào đúng:" },
  options: [
    { id: "a", text: "Good evening" },
    { id: "b", text: "Good night" },
    { id: "c", text: "Good morning" },
  ],
  correctOptionId: "c",
};

export const activitiesHowAreYouMcq: McqExercise = {
  id: "u3-activities-mcq-1",
  question: "Choose the correct response to: \"How are you?\"",
  questionTranslations: { vi: "Chọn câu trả lời đúng cho: \"How are you?\"" },
  options: [
    { id: "a", text: "I'm fine, thanks. And you?" },
    { id: "b", text: "My name is Anna." },
    { id: "c", text: "Good morning." },
  ],
  correctOptionId: "a",
};

export const activitiesEveningGreetingMcq: McqExercise = {
  id: "u3-activities-mcq-2",
  question: "It's 7 p.m. and you arrive at a dinner. Choose the correct greeting:",
  questionTranslations: { vi: "Bây giờ là 7 giờ tối và bạn đến dự bữa tối. Chọn lời chào đúng:" },
  options: [
    { id: "a", text: "Good morning" },
    { id: "b", text: "Good evening" },
    { id: "c", text: "Good night" },
  ],
  correctOptionId: "b",
};

export const activitiesGoodNightMcq: McqExercise = {
  id: "u3-activities-mcq-3",
  question: "When do you say \"Good night\"?",
  questionTranslations: { vi: "Khi nào bạn nói \"Good night\"?" },
  options: [
    { id: "a", text: "When you arrive in the morning." },
    { id: "b", text: "When you meet a friend at lunch." },
    { id: "c", text: "When you say goodbye at the end of the day." },
  ],
  correctOptionId: "c",
};

export const activitiesSeeYouFb: FillBlankExercise = {
  id: "u3-activities-fb-1",
  instruction: "You'll meet your friend again the next day. Complete the farewell:",
  instructionTranslations: { vi: "Bạn sẽ gặp lại bạn của mình vào ngày hôm sau. Hoàn thành lời tạm biệt:" },
  beforeBlank: "See you",
  afterBlank: "!",
  correctAnswer: "tomorrow",
  acceptableAnswers: ["Tomorrow"],
};

export const activitiesGoodFb: FillBlankExercise = {
  id: "u3-activities-fb-2",
  instruction: "It's 8 a.m. and you greet your class:",
  instructionTranslations: { vi: "Bây giờ là 8 giờ sáng và bạn chào cả lớp:" },
  beforeBlank: "Good",
  afterBlank: ", everyone.",
  correctAnswer: "morning",
  acceptableAnswers: ["Morning"],
};

export const activitiesAndYouMcq: McqExercise = {
  id: "u3-activities-mcq-4",
  question: "After someone says \"I'm fine, thanks. And you?\", what do they want?",
  questionTranslations: { vi: "Sau khi ai đó nói \"I'm fine, thanks. And you?\", họ muốn gì?" },
  options: [
    { id: "a", text: "They want to know your name." },
    { id: "b", text: "They want to know how you are." },
    { id: "c", text: "They want to say goodbye." },
  ],
  correctOptionId: "b",
};

export const activitiesByeMcq: McqExercise = {
  id: "u3-activities-mcq-5",
  question: "Choose the correct response to: \"Bye! Take care.\"",
  questionTranslations: { vi: "Chọn câu trả lời đúng cho: \"Bye! Take care.\"" },
  options: [
    { id: "a", text: "Good morning!" },
    { id: "b", text: "How are you?" },
    { id: "c", text: "Bye! See you later." },
  ],
  correctOptionId: "c",
};
