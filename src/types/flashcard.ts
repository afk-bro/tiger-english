// /types/flashcard.ts
// src/types/flashcard.ts

export interface Flashcard {
  id: string;                   // Unique identifier
  nativeWord: string;          // Word in the learner’s language (e.g., Thai)
  englishWord: string;         // The English translation (what they are learning)
  partOfSpeech?: string;       // Optional: noun, verb, adjective, etc.
  level?: "basic" | "intermediate" | "advanced";  // Optional difficulty
  exampleSentence?: string;    // Optional usage sentence
  imageUrl?: string;           // Optional image to reinforce learning
}

