// src/features/lessons/lesson.types.ts
import type { LearnerLanguage } from "./utils/learnerLanguage";

export type { LearnerLanguage } from "./utils/learnerLanguage";

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
  translations: Partial<Record<LearnerLanguage, {
    title: string;
    topic: string;
    grammarFocus: string;
  }>>;
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
  | { id: string; type: "heading"; content: string; translations?: Partial<Record<LearnerLanguage, string>> }
  | { id: string; type: "text"; content: string; translations?: Partial<Record<LearnerLanguage, string>> }
  | { id: string; type: "examples"; items: ExampleItem[] }
  | { id: string; type: "vocab-list"; items: VocabItem[] }
  | { id: string; type: "dialogue"; lines: DialogueLine[] }
  | { id: string; type: "exercise"; exerciseType: ExerciseType; exerciseId: string }
  | { id: string; type: "callout"; variant: "tip" | "note" | "warning"; content: string; translations?: Partial<Record<LearnerLanguage, string>> };

export type ExampleItem = {
  id: string;
  english: string;
  translations: Partial<Record<LearnerLanguage, string>>;
  note?: string;
};

export type VocabItem = {
  id: string;
  word: string;
  phonetic?: string;
  translations: Partial<Record<LearnerLanguage, string>>;
  audioUrl?: string;
};

export type DialogueLine = {
  id: string;
  speaker: string;
  text: string;
  translations: Partial<Record<LearnerLanguage, string>>;
  audioUrl?: string;
};

export type ExerciseType = "multiple-choice" | "fill-blank" | "match";
