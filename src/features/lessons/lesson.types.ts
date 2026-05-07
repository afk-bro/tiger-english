// src/features/lessons/lesson.types.ts
import type { LearnerLanguage } from "./utils/learnerLanguage";

export type { LearnerLanguage } from "./utils/learnerLanguage";

export type CefrLevel = "A0" | "A1" | "A2" | "B1" | "B1+" | "B2" | "C1";

export const CEFR_LEVELS: CefrLevel[] = ["A0", "A1", "A2", "B1", "B1+", "B2", "C1"];

export const CEFR_LEVEL_LABELS: Record<CefrLevel, string> = {
  A0: "A0 – Absolute Beginner",
  A1: "A1 – Beginner",
  A2: "A2 – Elementary",
  B1: "B1 – Intermediate",
  "B1+": "B1+ – Upper Intermediate (Early)",
  B2: "B2 – Upper Intermediate",
  C1: "C1 – Advanced",
};

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
  cefrLevel?: CefrLevel;
  sections: SectionMeta[];
  translations: Partial<Record<LearnerLanguage, {
    title: string;
    topic: string;
    grammarFocus: string;
  }>>;
  imagePrompt?: string;
  imageUrl?: string;
};

export type SectionMeta = {
  key: SectionKey;
  estimatedMinutes: number;
};

export type Section = {
  id: string;
  unitSlug: string;
  key: SectionKey;
  blocks: SectionBlock[];
  imagePrompt?: string;
  imageUrl?: string;
};

export type SectionBlock =
  | { id: string; type: "heading"; content: string; translations?: Partial<Record<LearnerLanguage, string>> }
  | { id: string; type: "text"; content: string; translations?: Partial<Record<LearnerLanguage, string>> }
  | { id: string; type: "examples"; items: ExampleItem[] }
  | { id: string; type: "vocab-list"; items: VocabItem[] }
  // imageAlt convention: omit / empty string → image is decorative
  // (rendered as `alt=""` so screen readers skip it). Provide a
  // non-empty string when the image carries information the learner
  // needs to answer correctly — e.g. image-prompt exercises ("choose
  // what's in the picture") or scenes that anchor a dialogue's setting.
  | { id: string; type: "dialogue"; lines: DialogueLine[]; imagePrompt?: string; imageUrl?: string; imageAlt?: string }
  | { id: string; type: "exercise"; exerciseType: ExerciseType; exerciseId: string; imagePrompt?: string; imageUrl?: string; imageAlt?: string }
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
  imagePrompt?: string;
  imageUrl?: string;
};

export type DialogueLine = {
  id: string;
  speaker: string;
  text: string;
  translations: Partial<Record<LearnerLanguage, string>>;
  audioUrl?: string;
};

export type ExerciseType = "multiple-choice" | "fill-blank" | "match";
