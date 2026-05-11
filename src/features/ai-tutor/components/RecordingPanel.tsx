import { useTranslation } from 'react-i18next';
import { useWaveform } from '../audio/useWaveform';

type Mode = 'idle' | 'recording' | 'processing';

interface Props {
  mode: Mode;
  stream: MediaStream | null;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function RecordingPanel({
  mode,
  stream,
  onStart,
  onStop,
  onCancel,
  disabled = false,
}: Props) {
  const { t } = useTranslation();
  const { canvasRef } = useWaveform({ stream, isActive: mode === 'recording' });

  if (mode === 'idle') {
    return (
      <div className="fixed bottom-20 inset-x-0 z-20 pointer-events-none">
        <div className="mx-auto max-w-2xl px-4 flex justify-center pointer-events-auto">
          <button
            type="button"
            disabled={disabled}
            onClick={onStart}
            className="px-6 py-3 rounded-full bg-primary-500 text-white text-sm font-semibold shadow-lg hover:bg-primary-600 disabled:opacity-50"
          >
            🎤 {t('tutor.session.speakNow', { defaultValue: 'Speak now' })}
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'processing') {
    return (
      <div className="fixed bottom-20 inset-x-0 z-20">
        <div className="mx-auto max-w-2xl px-4 flex justify-center">
          <p className="text-sm text-gray-500">…</p>
        </div>
      </div>
    );
  }

  // recording
  return (
    <div className="fixed bottom-20 inset-x-0 z-20 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 px-4 py-3">
      <div className="mx-auto max-w-2xl">
        <canvas
          ref={canvasRef}
          width={600}
          height={50}
          className="w-full h-12 rounded bg-gray-50 dark:bg-gray-900"
        />
        <div className="mt-3 flex gap-2 justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm"
          >
            ✕ {t('tutor.session.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button
            type="button"
            onClick={onStop}
            className="px-6 py-2 rounded-md bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600"
          >
            {t('tutor.session.submit', { defaultValue: 'Submit' })}
          </button>
        </div>
      </div>
    </div>
  );
}
