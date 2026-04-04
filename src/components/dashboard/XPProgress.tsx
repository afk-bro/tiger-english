import { useTranslation } from 'react-i18next';
import { XPData } from "@/types/dashboard";

type TierKey = keyof XPData["xpBreakdown"];

const tierStyles: Record<TierKey, { card: string; label: string; xp: string; meta: string }> = {
  beginner: {
    card: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    label: "text-green-700 dark:text-green-300",
    xp: "text-green-800 dark:text-green-200",
    meta: "text-green-600 dark:text-green-400",
  },
  intermediate: {
    card: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    label: "text-blue-700 dark:text-blue-300",
    xp: "text-blue-800 dark:text-blue-200",
    meta: "text-blue-600 dark:text-blue-400",
  },
  expert: {
    card: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    label: "text-purple-700 dark:text-purple-300",
    xp: "text-purple-800 dark:text-purple-200",
    meta: "text-purple-600 dark:text-purple-400",
  },
};

interface XPProgressProps {
  xp: XPData;
  progressColorClass: string;
}

export default function XPProgress({ xp, progressColorClass }: XPProgressProps) {
  const { t } = useTranslation();

  return (
    <div className="card mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-display heading-accent">
          {t('dashboard.xp.heading')}
        </h2>
        <div className="text-right">
          <div className="text-lg sm:text-xl font-semibold text-text-light dark:text-text-dark">
            {xp.currentXP.toLocaleString()} / {xp.totalXPForNextLevel.toLocaleString()} XP
          </div>
          <div className="text-sm text-text-light/70 dark:text-text-dark/70">
            {t('dashboard.xp.to_next_level', { percent: Math.round(xp.progressPercentage) })}
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${progressColorClass} rounded-full transition-all duration-1000 ease-out shadow-sm`}
            style={{ width: `${xp.progressPercentage}%` }}
          >
            <div className="h-full bg-white/20 animate-pulse"></div>
          </div>
        </div>
        <div
          className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2"
          style={{ left: `${xp.progressPercentage}%` }}
        >
          <div className="w-6 h-6 bg-white dark:bg-gray-800 rounded-full shadow-lg border-2 border-primary-500"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.entries(xp.xpBreakdown) as [TierKey, (typeof xp.xpBreakdown)[TierKey]][]).map(([tier, data]) => {
          const styles = tierStyles[tier];
          return (
            <div key={tier} className={`${styles.card} rounded-xl p-4 border`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-sm font-medium ${styles.label}`}>
                    {t(`dashboard.xp.tiers.${tier}`)}
                  </div>
                  <div className={`text-lg font-bold ${styles.xp}`}>
                    {t('dashboard.xp.total_xp', { xp: data.totalXP })}
                  </div>
                </div>
                <div className={`${styles.meta} text-right`}>
                  <div className="text-xs">
                    {t('dashboard.xp.xp_per_word', { xp: data.xpPerWord })}
                  </div>
                  <div className="text-sm font-medium">
                    {t('dashboard.xp.words', { count: data.wordsCompleted })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
