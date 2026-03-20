// src/components/dashboard/XPProgress.tsx
import { XPData } from "@/types/dashboard";

interface XPProgressProps {
  xp: XPData;
  progressColorClass: string;
}

export default function XPProgress({ xp, progressColorClass }: XPProgressProps) {
  return (
    <div className="card mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-display heading-accent">
          XP Progress
        </h2>
        <div className="text-right">
          <div className="text-lg sm:text-xl font-semibold text-text-light dark:text-text-dark">
            {xp.currentXP.toLocaleString()} / {xp.totalXPForNextLevel.toLocaleString()} XP
          </div>
          <div className="text-sm text-text-light/70 dark:text-text-dark/70">
            {Math.round(xp.progressPercentage)}% to next level
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
        {Object.entries(xp.xpBreakdown).map(([tier, data]) => {
          const colors = {
            beginner: "green",
            intermediate: "blue",
            expert: "purple",
          };
          const color = colors[tier as keyof typeof colors];

          return (
            <div
              key={tier}
              className={`bg-${color}-50 dark:bg-${color}-900/20 rounded-xl p-4 border border-${color}-200 dark:border-${color}-800`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-sm font-medium text-${color}-700 dark:text-${color}-300`}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</div>
                  <div className={`text-lg font-bold text-${color}-800 dark:text-${color}-200`}>+{data.totalXP} XP</div>
                </div>
                <div className={`text-${color}-600 dark:text-${color}-400 text-right`}>
                  <div className="text-xs">+{data.xpPerWord} XP per word</div>
                  <div className="text-sm font-medium">{data.wordsCompleted} words</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
