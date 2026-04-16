export type LearnerLanguage = "th" | "vi" | "zh-CN";

export const SUPPORTED_LEARNER_LANGUAGES: LearnerLanguage[] = ["th", "vi", "zh-CN"];

export function getLearnerLanguage(appLanguage: string): LearnerLanguage | null {
  const base = appLanguage.trim().toLowerCase().split("-")[0];
  if (base === "th") return "th";
  if (base === "vi") return "vi";
  if (base === "zh") return "zh-CN";
  return null;
}
