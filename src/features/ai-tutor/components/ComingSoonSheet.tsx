import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface ComingSoonSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  body?: string;
}

/**
 * Minimal bottom-sheet/modal used by TutorFooterNav for the Review and
 * Challenge "coming soon" stubs.
 *
 * No project-wide modal primitive exists yet (each modal in the app is
 * hand-rolled — see CreateSetModal), so this implements the small surface we
 * need: backdrop click + Escape close + a single "Got it" affirmative button.
 */
export function ComingSoonSheet({ isOpen, onClose, title, body }: ComingSoonSheetProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      <button
        type="button"
        aria-label={t('common.close', { defaultValue: 'Close' })}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {body && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{body}</p>}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full inline-flex justify-center px-4 py-2 rounded-md bg-primary-500 text-white text-sm font-medium hover:bg-primary-600"
        >
          {t('tutor.comingSoon.gotIt', { defaultValue: 'Got it' })}
        </button>
      </div>
    </div>
  );
}

export default ComingSoonSheet;
