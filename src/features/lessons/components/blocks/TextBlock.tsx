import type { LearnerLanguage } from "../../utils/learnerLanguage";
import { useLocalizedContent } from "../../utils/useLocalizedContent";

type Props = {
  content: string;
  translations?: Partial<Record<LearnerLanguage, string>>;
};

export default function TextBlock({ content, translations }: Props) {
  const text = useLocalizedContent(content, translations);
  return <p className="text-base leading-relaxed text-semantic-text">{text}</p>;
}
