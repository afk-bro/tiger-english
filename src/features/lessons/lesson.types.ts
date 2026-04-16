// src/features/lessons/lesson.types.ts

export type UnitStatus = "available" | "coming-soon" | "locked";

export type SectionKey =
  | "overview"
  | "grammar"
  | "vocabulary"
  | "dialogues"
  | "activities";

export const SECTION_ORDER: SectionKey[] = [
  "overview",
  "grammar",
  "vocabulary",
  "dialogues",
  "activities",
];

export type Unit = {
  slug: string;
  number: number;
  title: string;
  topic: string;
  grammarFocus: string;
  estimatedMinutes: number;
  status: UnitStatus;
  sections: SectionMeta[];
};

export type SectionMeta = {
  key: SectionKey;
  title: string;
  estimatedMinutes: number;
};

export type Section = {
  id: string;
  unitSlug: string;
  key: SectionKey;
  title: string;
  blocks: SectionBlock[];
};

export type SectionBlock =
  | { id: string; type: "heading"; content: string }
  | { id: string; type: "text"; content: string }
  | { id: string; type: "examples"; items: ExampleItem[] }
  | { id: string; type: "vocab-list"; items: VocabItem[] }
  | { id: string; type: "dialogue"; lines: DialogueLine[] }
  | { id: string; type: "exercise"; exerciseType: ExerciseType; exerciseId: string }
  | { id: string; type: "callout"; variant: "tip" | "note" | "warning"; content: string };

export type ExampleItem = {
  english: string;
  translation: string;
  note?: string;
};

export type VocabItem = {
  word: string;
  translation: string;
  phonetic?: string;
  audioUrl?: string;
  example?: string;
};

export type DialogueLine = {
  speaker: string;
  text: string;
  translation: string;
  audioUrl?: string;
};

export type ExerciseType = "multiple-choice" | "fill-blank" | "match";
