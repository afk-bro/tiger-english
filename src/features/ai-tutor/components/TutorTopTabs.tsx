import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Sticky top tab strip for the /ai-tutor shell.
 *
 * - "Home" links back to /ai-tutor and is active for any /ai-tutor/* route.
 * - "Course" links to /lessons; it intentionally never shows as active because
 *   following it exits the tutor shell entirely.
 */
export function TutorTopTabs() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const homeActive = pathname.startsWith('/ai-tutor');

  return (
    <nav className="sticky top-0 z-20 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4">
      <div className="max-w-2xl mx-auto flex gap-6">
        <NavLink
          to="/ai-tutor"
          aria-current={homeActive ? 'page' : undefined}
          className={`py-3 text-sm font-medium border-b-2 ${
            homeActive
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('tutor.tabs.home', { defaultValue: 'Home' })}
        </NavLink>
        <NavLink
          to="/lessons"
          className="py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
        >
          {t('tutor.tabs.course', { defaultValue: 'Course' })}
        </NavLink>
      </div>
    </nav>
  );
}

export default TutorTopTabs;
