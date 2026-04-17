import type { LearnerLanguage } from "../../utils/learnerLanguage";
import { useLocalizedContent } from "../../utils/useLocalizedContent";

type Props = {
  content: string;
  translations?: Partial<Record<LearnerLanguage, string>>;
};

export default function HeadingBlock({ content, translations }: Props) {
  const text = useLocalizedContent(content, translations);
  return <h2 className="text-xl font-semibold text-semantic-text mt-2">{text}</h2>;
}
