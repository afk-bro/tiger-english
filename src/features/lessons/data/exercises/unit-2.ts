// src/features/lessons/data/exercises/unit-2.ts
import type { McqExercise, FillBlankExercise } from "@/components/exercises/exercises.types";

// ----- Grammar exercises (in grammar.ts) -----

export const grammarMcqContractions: McqExercise = {
  id: "u2-grammar-mcq-1",
  question: "What is the contraction for \"She is\"?",
  questionTranslations: { vi: "Dạng rút gọn của \"She is\" là gì?" },
  options: [
    { id: "a", text: "She'r" },
    { id: "b", text: "She's" },
    { id: "c", text: "She'is" },
  ],
  correctOptionId: "b",
};

export const grammarMcqWhereWord: McqExercise = {
  id: "u2-grammar-mcq-2",
  question: "Choose the correct word: \"___ are they?\"",
  questionTranslations: { vi: "Chọn từ đúng: \"___ are they?\"" },
  options: [
    { id: "a", text: "What" },
    { id: "b", text: "When" },
    { id: "c", text: "Where" },
  ],
  correctOptionId: "c",
};

// ----- Activities: vocabulary recognition -----

export const activitiesVocabClassroomMcq: McqExercise = {
  id: "u2-activities-mcq-1",
  question: "Which one do you write on?",
  questionTranslations: { vi: "Bạn viết lên cái nào?" },
  options: [
    { id: "a", text: "board" },
    { id: "b", text: "chair" },
    { id: "c", text: "clock" },
  ],
  correctOptionId: "a",
};

export const activitiesVocabHomeMcq: McqExercise = {
  id: "u2-activities-mcq-2",
  question: "Where do you cook food?",
  questionTranslations: { vi: "Bạn nấu ăn ở đâu?" },
  options: [
    { id: "a", text: "garage" },
    { id: "b", text: "attic" },
    { id: "c", text: "kitchen" },
  ],
  correctOptionId: "c",
};

export const activitiesVocabTownMcq: McqExercise = {
  id: "u2-activities-mcq-3",
  question: "Where do you borrow books?",
  questionTranslations: { vi: "Bạn mượn sách ở đâu?" },
  options: [
    { id: "a", text: "zoo" },
    { id: "b", text: "library" },
    { id: "c", text: "post office" },
  ],
  correctOptionId: "b",
};

export const activitiesVocabMixedMcq: McqExercise = {
  id: "u2-activities-mcq-4",
  question: "Which one is in your home, not in your classroom?",
  questionTranslations: { vi: "Cái nào ở trong nhà bạn, không ở trong lớp học?" },
  options: [
    { id: "a", text: "bookshelf" },
    { id: "b", text: "dictionary" },
    { id: "c", text: "bedroom" },
  ],
  correctOptionId: "c",
};

// ----- Activities: 'Where' + pronouns -----

export const activitiesWhereResponseMariaMcq: McqExercise = {
  id: "u2-activities-mcq-5",
  question: "Choose the response to: \"Where is Maria?\"",
  questionTranslations: { vi: "Chọn câu trả lời đúng cho: \"Where is Maria?\"" },
  options: [
    { id: "a", text: "He's in the bedroom." },
    { id: "b", text: "I am Maria." },
    { id: "c", text: "She's in the kitchen." },
  ],
  correctOptionId: "c",
};

export const activitiesWhereAreFb: FillBlankExercise = {
  id: "u2-activities-fb-1",
  beforeBlank: "Where",
  afterBlank: "they?",
  correctAnswer: "are",
};

export const activitiesWhereResponseChildrenMcq: McqExercise = {
  id: "u2-activities-mcq-6",
  question: "Choose the response to: \"Where are the children?\"",
  questionTranslations: { vi: "Chọn câu trả lời đúng cho: \"Where are the children?\"" },
  options: [
    { id: "a", text: "They're in the yard." },
    { id: "b", text: "He's in the yard." },
    { id: "c", text: "It's in the yard." },
  ],
  correctOptionId: "a",
};

export const activitiesWhereDictionaryFb: FillBlankExercise = {
  id: "u2-activities-fb-2",
  beforeBlank: "",
  afterBlank: "is the dictionary?",
  correctAnswer: "Where",
};

// ----- Activities: contractions -----

export const activitiesContractionTheyMcq: McqExercise = {
  id: "u2-activities-mcq-7",
  question: "What is the contraction for \"They are\"?",
  questionTranslations: { vi: "Dạng rút gọn của \"They are\" là gì?" },
  options: [
    { id: "a", text: "They's" },
    { id: "b", text: "They're" },
    { id: "c", text: "They'r" },
  ],
  correctOptionId: "b",
};

export const activitiesContractionItMcq: McqExercise = {
  id: "u2-activities-mcq-8",
  question: "What is the contraction for \"It is\"?",
  questionTranslations: { vi: "Dạng rút gọn của \"It is\" là gì?" },
  options: [
    { id: "a", text: "It're" },
    { id: "b", text: "Its'" },
    { id: "c", text: "It's" },
  ],
  correctOptionId: "c",
};

export const activitiesContractionShortenFb: FillBlankExercise = {
  id: "u2-activities-fb-3",
  instruction: "Make this shorter (use a contraction): \"He is at home.\" →",
  instructionTranslations: {
    vi: "Rút gọn câu này: \"He is at home.\" →",
  },
  beforeBlank: "",
  afterBlank: "at home.",
  correctAnswer: "He's",
};

export const activitiesContractionCorrectMcq: McqExercise = {
  id: "u2-activities-mcq-9",
  question: "Which sentence is correct?",
  questionTranslations: { vi: "Câu nào đúng?" },
  options: [
    { id: "a", text: "We at the bank." },
    { id: "b", text: "We's at the bank." },
    { id: "c", text: "We're at the bank." },
  ],
  correctOptionId: "c",
};
