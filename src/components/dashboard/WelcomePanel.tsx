import type { Profile, XPData, StudyStats as StudyStatsType } from "@/types/dashboard";

interface WelcomePanelProps {
  profile: Profile | null;
  xp: XPData;
  studyStats: StudyStatsType;
}

export default function WelcomePanel({ profile, xp, studyStats }: WelcomePanelProps) {
  return (
    <div className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-2xl p-6 sm:p-8 mb-8 text-white shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Welcome back, {profile?.first_name || "Student"}! 👋
          </h1>
          <p className="text-primary-100 text-sm sm:text-base">
            Ready to continue your English learning journey?
          </p>
        </div>
        <div className="mt-4 sm:mt-0 text-right">
          <div className="text-2xl sm:text-3xl font-bold">Level {xp.currentLevel}</div>
          <div className="text-primary-200 text-sm">
            {studyStats.currentStreak} day streak 🔥
          </div>
        </div>
      </div>
    </div>
  );
}
