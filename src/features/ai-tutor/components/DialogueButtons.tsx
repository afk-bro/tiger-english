import { useTranslation } from 'react-i18next';

interface Props {
  onRepeat: () => void;
  onTranslate: () => void;
  onToggleHide: () => void;
  onFlag: () => void;
  textHidden?: boolean;
  isTranslated?: boolean;
}

export function DialogueButtons({
  onRepeat,
  onTranslate,
  onToggleHide,
  onFlag,
  textHidden = false,
  isTranslated = false,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="mt-3 flex gap-2 text-xs">
      <button
        type="button"
        onClick={onRepeat}
        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200"
      >
        🔁 {t('tutor.session.repeat', { defaultValue: 'Repeat' })}
      </button>
      <button
        type="button"
        onClick={onTranslate}
        className={`px-2 py-1 rounded ${
          isTranslated
            ? 'bg-primary-100 text-primary-700'
            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
        }`}
      >
        🌐 {t('tutor.session.translate', { defaultValue: 'Translate' })}
      </button>
      <button
        type="button"
        onClick={onToggleHide}
        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200"
      >
        {textHidden ? '👁' : '🙈'}{' '}
        {textHidden
          ? t('tutor.session.showText', { defaultValue: 'Show text' })
          : t('tutor.session.hideText', { defaultValue: 'Hide text' })}
      </button>
      <button
        type="button"
        onClick={onFlag}
        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200"
      >
        🚩 {t('tutor.session.flagForPractice', { defaultValue: 'Flag' })}
      </button>
    </div>
  );
}
