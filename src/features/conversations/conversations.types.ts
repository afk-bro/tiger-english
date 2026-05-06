export type LevelBand =
  | "A0–A1"
  | "A1–A2"
  | "A2–B1"
  | "B1–B1+"
  | "B1+–B2"
  | "B2–C1";

export interface ConversationScenario {
  id: string;
  slug: string;
  title: string;
  level: string;
  level_band: LevelBand;
  description: string;
  ai_role: string;
  learner_role: string;
  opening_line: string;
  target_vocabulary: string[];
  target_grammar: string[];
  estimated_minutes: number;
}

export interface ScenariosResponse {
  scenarios: ConversationScenario[];
  total: number;
  level_bands: LevelBand[];
}
