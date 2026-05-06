// src/features/skills/skills.types.ts

export type SkillKey =
  | "vocabulary_range"
  | "vocabulary_accuracy"
  | "grammar_accuracy"
  | "grammar_range"
  | "pronunciation"
  | "fluency"
  | "listening_comprehension"
  | "reading_comprehension"
  | "writing_organization"
  | "task_completion"
  | "interaction_quality";

export const SKILL_KEYS: SkillKey[] = [
  "vocabulary_range",
  "vocabulary_accuracy",
  "grammar_accuracy",
  "grammar_range",
  "pronunciation",
  "fluency",
  "listening_comprehension",
  "reading_comprehension",
  "writing_organization",
  "task_completion",
  "interaction_quality",
];

export const SKILL_LABELS: Record<SkillKey, string> = {
  vocabulary_range:       "Vocabulary Range",
  vocabulary_accuracy:    "Vocabulary Accuracy",
  grammar_accuracy:       "Grammar Accuracy",
  grammar_range:          "Grammar Range",
  pronunciation:          "Pronunciation",
  fluency:                "Fluency",
  listening_comprehension: "Listening",
  reading_comprehension:  "Reading",
  writing_organization:   "Writing",
  task_completion:        "Task Completion",
  interaction_quality:    "Interaction Quality",
};

export type SkillScore = {
  skill: SkillKey;
  /** EWMA-smoothed score 0.0–5.0 */
  score: number;
  /** Number of data points in the smoothing window (capped at 30) */
  sample_size: number;
  last_updated_at: string | null;
};
