import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { VocabItem } from "../../lesson.types";
import { getLearnerLanguage } from "../../utils/learnerLanguage";

function VocabCard({ item, learnerLang }: { item: VocabItem; learnerLang: ReturnType<typeof getLearnerLanguage> }) {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState(false);

  const nativeText = learnerLang ? item.translations[learnerLang] : null;
  const hasFront = nativeText !== null && nativeText !== undefined;

  const frontLabel = hasFront
    ? t("lessons.vocab.flipToRevealEnglishFor", { nativeText })
    : t("lessons.vocab.flipToRevealAnswer");
  const backLabel = t("lessons.vocab.flipBackToTranslation");

  return (
    <button
      type="button"
      onClick={() => setFlipped(!flipped)}
      aria-label={flipped ? backLabel : frontLabel}
      className="w-full text-left card card-interactive p-4 min-h-[100px] flex flex-col justify-center"
    >
      {!flipped ? (
        <>
          {hasFront ? (
            <p className="text-lg font-semibold text-semantic-text">{nativeText}</p>
          ) : learnerLang ? (
            <p className="text-lg font-semibold text-semantic-text opacity-50">{item.word}</p>
          ) : (
            <p className="text-lg font-semibold text-semantic-text">{item.word}</p>
          )}
          <p className="text-xs text-semantic-text-muted mt-2">{t("lessons.vocab.revealAnswer")}</p>
        </>
      ) : (
        <>
          <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">{item.word}</p>
          {item.phonetic && (
            <p className="text-xs text-semantic-subtle mt-1">/{item.phonetic}/</p>
          )}
        </>
      )}
    </button>
  );
}

type Props = { items: VocabItem[] };

export default function VocabListBlock({ items }: Props) {
  const { i18n } = useTranslation();
  const learnerLang = getLearnerLanguage(i18n.language);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <VocabCard key={item.id} item={item} learnerLang={learnerLang} />
      ))}
    </div>
  );
}
