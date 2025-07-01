// src/components/dashboard/StudyStats.tsx
import { StudyStats as StudyStatsType } from "@/types/dashboard";

interface StudyStatsProps {
  studyStats: StudyStatsType;
}

export default function StudyStats({ studyStats }: StudyStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow-lg">
        <div className="flex items-center">
          <div className="p-3 bg-success-100 dark:bg-success-900/30 rounded-lg">
            <span className="text-2xl">📚</span>
          </div>
          <div className="ml-4">
            <div className="text-2xl font-bold text-text-light dark:text-text-dark">
              {studyStats.totalWordsLearned}
            </div>
            <div className="text-sm text-text-light/70 dark:text-text-dark/70">Words Learned</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow-lg">
        <div className="flex items-center">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <span className="text-2xl">⏱️</span>
          </div>
          <div className="ml-4">
            <div className="text-2xl font-bold text-text-light dark:text-text-dark">
              {studyStats.studyTimeToday}m
            </div>
            <div className="text-sm text-text-light/70 dark:text-text-dark/70">Today</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow-lg">
        <div className="flex items-center">
          <div className="p-3 bg-accent-100 dark:bg-accent-900/30 rounded-lg">
            <span className="text-2xl">🎯</span>
          </div>
          <div className="ml-4">
            <div className="text-2xl font-bold text-text-light dark:text-text-dark">
              {studyStats.accuracyRate}%
            </div>
            <div className="text-sm text-text-light/70 dark:text-text-dark/70">Accuracy</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow-lg">
        <div className="flex items-center">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <span className="text-2xl">🔥</span>
          </div>
          <div className="ml-4">
            <div className="text-2xl font-bold text-text-light dark:text-text-dark">
              {studyStats.currentStreak}
            </div>
            <div className="text-sm text-text-light/70 dark:text-text-dark/70">Day Streak</div>
          </div>
        </div>
      </div>
    </div>
  );
}
