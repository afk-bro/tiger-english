import { useTranslation } from "react-i18next";
import type { ExampleItem } from "../../lesson.types";
import { getLearnerLanguage } from "../../utils/learnerLanguage";

type Props = { items: ExampleItem[] };

export default function ExamplesBlock({ items }: Props) {
  const { i18n } = useTranslation();
  const learnerLang = getLearnerLanguage(i18n.language);

  return (
    <div className="rounded-lg bg-semantic-surface-2 p-4 space-y-3">
      {items.map((item) => {
        const translation = learnerLang ? item.translations[learnerLang] : undefined;
        return (
          <div key={item.id} className="space-y-0.5">
            <p className="text-base text-semantic-text">{item.english}</p>
            {translation && (
              <p className="text-sm text-semantic-text-muted">{translation}</p>
            )}
            {item.note && (
              <p className="text-xs text-semantic-subtle italic">{item.note}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
