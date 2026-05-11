import { useTranslation } from 'react-i18next';
import type { TurnCorrection } from '../types';

interface Props {
  correction: TurnCorrection;
  originalTranscript?: string;
}

export function CorrectionCard({ correction, originalTranscript }: Props) {
  const { t } = useTranslation();
  return (
    <aside className="rounded-xl border-2 border-green-500 bg-green-50/70 dark:bg-green-950/30 p-4 text-sm">
      {originalTranscript && (
        <div className="mb-2">
          <p className="text-xs font-semibold text-green-800 dark:text-green-300 uppercase">
            {t('tutor.correction.youSaid', { defaultValue: 'You said' })}
          </p>
          <p className="text-gray-700 dark:text-gray-300 italic">
            {originalTranscript}
          </p>
        </div>
      )}
      <div>
        <p className="text-xs font-semibold text-green-800 dark:text-green-300 uppercase">
          {t('tutor.correction.better', { defaultValue: 'Better' })}
        </p>
        <p className="font-medium text-gray-900 dark:text-gray-100">
          {correction.corrected_en}
        </p>
      </div>
      <div className="mt-2">
        <p className="text-xs font-semibold text-green-800 dark:text-green-300 uppercase">
          {t('tutor.correction.explanation', {
            defaultValue: 'Vietnamese explanation',
          })}
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          {correction.explanation_vi}
        </p>
      </div>
      {correction.translation_vi && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {correction.translation_vi}
        </p>
      )}
    </aside>
  );
}
