import { useTranslation } from 'react-i18next';
import { FlashcardGroup } from "@/types/dashboard";

interface FlashcardGroupsProps {
  flashcardGroups: FlashcardGroup[];
  getDifficultyColor: (difficulty: string) => string;
}

export default function FlashcardGroups({ flashcardGroups, getDifficultyColor }: FlashcardGroupsProps) {
  const { t } = useTranslation();

  return (
    <div className="card mb-8">
      <h2 className="text-display heading-accent mb-6">
        {t('dashboard.groups.heading')}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashcardGroups.slice(0, 5).map((group) => (
          <div key={group.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-text-light dark:text-text-dark group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {group.name}
                </h3>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getDifficultyColor(group.difficulty)}`}>
                  {group.difficulty}
                </span>
              </div>
              <div className={`w-3 h-3 rounded-full ${group.color}`}></div>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-sm text-text-light/70 dark:text-text-dark/70 mb-1">
                <span>{t('dashboard.groups.progress')}</span>
                <span>{group.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 ${group.color} rounded-full transition-all duration-500`}
                  style={{ width: `${group.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex justify-between text-sm text-text-light/70 dark:text-text-dark/70">
              <span>
                {t('dashboard.groups.cards', { completed: group.completedCards, total: group.totalCards })}
              </span>
              <span>
                {group.lastStudied === "2025-06-29"
                  ? t('dashboard.groups.today')
                  : group.lastStudied === "2025-06-28"
                  ? t('dashboard.groups.yesterday')
                  : new Date(group.lastStudied).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
