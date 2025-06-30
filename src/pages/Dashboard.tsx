import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/useUserStore";
import { logoutUser } from "@/features/auth/logoutUser";
import { toast } from "sonner";
import { mockDashboardData, getXPProgressColor, getDifficultyColor } from "@/mocks/mockDashboardData";

export default function Dashboard() {
  const { profile, loading, clearProfile } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const error = await logoutUser();
    if (!error) {
      clearProfile();
      toast.success("Logged out");
      navigate("/login");
    }
  };

  useEffect(() => {
    if (!loading && !profile) {
      navigate("/login");
    }
  }, [loading, profile, navigate]);

  const { xp, flashcardGroups, studyStats } = mockDashboardData;
  const progressColorClass = getXPProgressColor(xp.progressPercentage);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-base-dark flex items-center justify-center">
        <div className="text-xl text-text-light dark:text-text-dark">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-base-dark">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Panel */}
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

        {/* XP Progress Section */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 sm:p-8 mb-8 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-text-light dark:text-text-dark">
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

          {/* Animated Progress Bar */}
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

          {/* XP Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">Beginner</div>
                  <div className="text-lg font-bold text-green-800 dark:text-green-200">
                    +{xp.xpBreakdown.beginner.totalXP} XP
                  </div>
                </div>
                <div className="text-green-600 dark:text-green-400 text-right">
                  <div className="text-xs">+{xp.xpBreakdown.beginner.xpPerWord} XP per word</div>
                  <div className="text-sm font-medium">{xp.xpBreakdown.beginner.wordsCompleted} words</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Intermediate</div>
                  <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                    +{xp.xpBreakdown.intermediate.totalXP} XP
                  </div>
                </div>
                <div className="text-blue-600 dark:text-blue-400 text-right">
                  <div className="text-xs">+{xp.xpBreakdown.intermediate.xpPerWord} XP per word</div>
                  <div className="text-sm font-medium">{xp.xpBreakdown.intermediate.wordsCompleted} words</div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Expert</div>
                  <div className="text-lg font-bold text-purple-800 dark:text-purple-200">
                    +{xp.xpBreakdown.expert.totalXP} XP
                  </div>
                </div>
                <div className="text-purple-600 dark:text-purple-400 text-right">
                  <div className="text-xs">+{xp.xpBreakdown.expert.xpPerWord} XP per word</div>
                  <div className="text-sm font-medium">{xp.xpBreakdown.expert.wordsCompleted} words</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Flashcard Groups */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 sm:p-8 mb-8 shadow-lg">
          <h2 className="text-xl sm:text-2xl font-bold text-text-light dark:text-text-dark mb-6">
            Your Flashcard Groups
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {flashcardGroups.slice(0, 5).map((group) => (
              <div
                key={group.id}
                className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group"
              >
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
                    <span>Progress</span>
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
                  <span>{group.completedCards}/{group.totalCards} cards</span>
                  <span>
                    {group.lastStudied === '2025-06-29' ? 'Today' : 
                     group.lastStudied === '2025-06-28' ? 'Yesterday' : 
                     new Date(group.lastStudied).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Study Stats */}
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
      </div>

      {/* Fixed Logout Button - Bottom Right */}
      <button
        onClick={handleLogout}
        className="fixed bottom-6 right-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-sm font-medium z-10"
      >
        Logout
      </button>
    </div>
  );
}
