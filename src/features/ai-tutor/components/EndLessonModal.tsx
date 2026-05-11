import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  tasksDone: number;
  tasksTotal: number;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function EndLessonModal({
  isOpen,
  tasksDone,
  tasksTotal,
  onConfirm,
  onDismiss,
}: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <button
        aria-label="Close"
        type="button"
        onClick={onDismiss}
        className="absolute inset-0 bg-black/50"
      />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('tutor.endLesson.title', { defaultValue: 'Finish lesson?' })}
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {t('tutor.endLesson.body', {
            defaultValue: "You've completed {{done}} of {{total}} tasks.",
            done: tasksDone,
            total: tasksTotal,
          })}
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm font-medium"
          >
            {t('tutor.endLesson.dismiss', {
              defaultValue: 'Continue practicing',
            })}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-md bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600"
          >
            {t('tutor.endLesson.confirm', { defaultValue: 'End lesson' })}
          </button>
        </div>
      </div>
    </div>
  );
}
