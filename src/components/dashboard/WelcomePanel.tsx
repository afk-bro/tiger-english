import { useTranslation } from 'react-i18next';
import type { Profile, XPData, StudyStats as StudyStatsType } from "@/types/dashboard";

interface WelcomePanelProps {
  profile: Profile | null;
  xp: XPData;
  studyStats: StudyStatsType;
}

export default function WelcomePanel({ profile, xp, studyStats }: WelcomePanelProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-2xl p-6 sm:p-8 mb-8 text-white shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            {t('dashboard.welcome.greeting', { name: profile?.first_name || 'Student' })} 👋
          </h1>
          <p className="text-primary-100 text-sm sm:text-base">
            {t('dashboard.welcome.journey')}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 text-right">
          <div className="text-2xl sm:text-3xl font-bold">
            {t('dashboard.welcome.level', { level: xp.currentLevel })}
          </div>
          <div className="text-primary-200 text-sm">
            {t('dashboard.welcome.streak', { streak: studyStats.currentStreak })} 🔥
          </div>
        </div>
      </div>
    </div>
  );
}
