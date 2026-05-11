import { useTranslation } from 'react-i18next';
import type { TutorPhrase } from '../types';
import { useTutorTTS } from '../audio/useTutorTTS';

interface Props {
  phrase: TutorPhrase;
}

export function PhraseCard({ phrase }: Props) {
  const { t } = useTranslation();
  const tts = useTutorTTS();

  return (
    <article className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{phrase.phrase_en}</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{phrase.translation_vi}</p>
      <button
        type="button"
        onClick={() => tts.play({ text: phrase.phrase_en, audioUrl: phrase.audio_url })}
        className="mt-3 inline-flex items-center px-3 py-1.5 rounded-md bg-primary-50 text-primary-700 text-xs font-medium hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-200"
      >
        🔊 {t('tutor.session.listen', { defaultValue: 'Listen' })}
      </button>
    </article>
  );
}
