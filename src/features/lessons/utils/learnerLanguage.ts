export type LearnerLanguage = "th" | "vi" | "zh-CN";

export const SUPPORTED_LEARNER_LANGUAGES: LearnerLanguage[] = ["th", "vi", "zh-CN"];

export function getLearnerLanguage(appLanguage: string): LearnerLanguage | null {
  if (appLanguage === "th") return "th";
  if (appLanguage === "vi") return "vi";
  if (appLanguage === "zh-CN" || appLanguage === "zh") return "zh-CN";
  return null;
}
