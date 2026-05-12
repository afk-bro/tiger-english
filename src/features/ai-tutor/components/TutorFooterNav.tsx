import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ComingSoonSheet } from './ComingSoonSheet';

type SheetKind = null | 'review' | 'challenge';

/**
 * Sticky bottom nav for the /ai-tutor shell. Five entries:
 *  - Home     → /ai-tutor (active when end-matched)
 *  - Free Talk → /ai-tutor#free-talk (anchor on the home page)
 *  - Review   → opens ComingSoonSheet (not yet built)
 *  - Challenge → opens ComingSoonSheet (not yet built)
 *  - Profile  → /settings
 */
export function TutorFooterNav() {
  const { t } = useTranslation();
  const [sheet, setSheet] = useState<SheetKind>(null);

  const itemBase = 'flex flex-col items-center py-2';

  return (
    <>
      <nav
        aria-label={t('tutor.footer.label', { defaultValue: 'Tutor navigation' })}
        className="fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-2xl mx-auto grid grid-cols-5 text-xs">
          <NavLink
            end
            to="/ai-tutor"
            className={({ isActive }) =>
              `${itemBase} ${isActive ? 'text-primary-600' : 'text-gray-500'}`
            }
          >
            <span aria-hidden>🏠</span>
            <span>{t('tutor.footer.home', { defaultValue: 'Home' })}</span>
          </NavLink>

          <Link to="/ai-tutor#free-talk" className={`${itemBase} text-gray-500`}>
            <span aria-hidden>💬</span>
            <span>{t('tutor.footer.freeTalk', { defaultValue: 'Free Talk' })}</span>
          </Link>

          <button
            type="button"
            onClick={() => setSheet('review')}
            className={`${itemBase} text-gray-500`}
          >
            <span aria-hidden>📚</span>
            <span>{t('tutor.footer.review', { defaultValue: 'Review' })}</span>
          </button>

          <button
            type="button"
            onClick={() => setSheet('challenge')}
            className={`${itemBase} text-gray-500`}
          >
            <span aria-hidden>⚡</span>
            <span>{t('tutor.footer.challenge', { defaultValue: 'Challenge' })}</span>
          </button>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `${itemBase} ${isActive ? 'text-primary-600' : 'text-gray-500'}`
            }
          >
            <span aria-hidden>👤</span>
            <span>{t('tutor.footer.profile', { defaultValue: 'Profile' })}</span>
          </NavLink>
        </div>
      </nav>

      <ComingSoonSheet
        isOpen={sheet === 'review'}
        onClose={() => setSheet(null)}
        title={t('tutor.comingSoon.review', { defaultValue: 'Speech review coming soon' })}
      />
      <ComingSoonSheet
        isOpen={sheet === 'challenge'}
        onClose={() => setSheet(null)}
        title={t('tutor.comingSoon.challenge', { defaultValue: 'Challenge mode coming soon' })}
      />
    </>
  );
}

export default TutorFooterNav;
