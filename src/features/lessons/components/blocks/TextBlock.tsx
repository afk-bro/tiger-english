import { useTranslation } from "react-i18next";
import type { LearnerLanguage } from "../../utils/learnerLanguage";
import { getLearnerLanguage } from "../../utils/learnerLanguage";

type Props = {
  content: string;
  translations?: Partial<Record<LearnerLanguage, string>>;
};

export default function TextBlock({ content, translations }: Props) {
  const { i18n } = useTranslation();
  const learnerLang = getLearnerLanguage(i18n.language);
  const text = (learnerLang && translations?.[learnerLang]) ?? content;
  return <p className="text-base leading-relaxed text-semantic-text">{text}</p>;
}
