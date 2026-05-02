import { useTranslation } from "react-i18next";
import type { LearnerLanguage } from "./learnerLanguage";
import { getLearnerLanguage } from "./learnerLanguage";

/**
 * Look up the learner-language translation for `content` and fall back to English.
 * Empty-string translations also fall back (treated as missing).
 */
export function useLocalizedContent(
  content: string,
  translations?: Partial<Record<LearnerLanguage, string>>,
): string {
  const { i18n } = useTranslation();
  const learnerLang = getLearnerLanguage(i18n.language);
  return (learnerLang && translations?.[learnerLang]) || content;
}
