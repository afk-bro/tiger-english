import { useTranslation } from "react-i18next";
import type { LearnerLanguage } from "../../utils/learnerLanguage";
import { getLearnerLanguage } from "../../utils/learnerLanguage";

type Props = {
  content: string;
  translations?: Partial<Record<LearnerLanguage, string>>;
};

export default function HeadingBlock({ content, translations }: Props) {
  const { i18n } = useTranslation();
  const learnerLang = getLearnerLanguage(i18n.language);
  const text = (learnerLang && translations?.[learnerLang]) || content;
  return <h2 className="text-xl font-semibold text-semantic-text mt-2">{text}</h2>;
}
