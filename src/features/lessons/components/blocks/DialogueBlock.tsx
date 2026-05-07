import { useTranslation } from "react-i18next";
import { clsx } from "clsx";
import type { DialogueLine } from "../../lesson.types";
import { getLearnerLanguage } from "../../utils/learnerLanguage";

type Props = { lines: DialogueLine[]; imageUrl?: string; imageAlt?: string };

export default function DialogueBlock({ lines, imageUrl, imageAlt }: Props) {
  const { i18n } = useTranslation();
  const learnerLang = getLearnerLanguage(i18n.language);

  return (
    <div className="space-y-3">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={imageAlt ?? ""}
          width={1024}
          height={1024}
          loading="lazy"
          decoding="async"
          className="w-full rounded-lg mb-4 object-cover"
        />
      )}
      {lines.map((line, i) => {
        const translation = learnerLang ? line.translations[learnerLang] : undefined;
        return (
          <div
            key={line.id}
            className={clsx(
              "max-w-[85%] rounded-lg p-3",
              i % 2 === 0 ? "bg-primary-500/10 mr-auto" : "bg-semantic-surface-2 ml-auto",
            )}
          >
            <p className="text-xs font-semibold text-semantic-text-muted mb-1">{line.speaker}</p>
            <p className="text-base text-semantic-text">{line.text}</p>
            {translation && (
              <p className="text-sm text-semantic-text-muted mt-1">{translation}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
