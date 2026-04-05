import { useTranslation } from 'react-i18next';
import { mockDashboardData, getXPProgressColor, getDifficultyColor } from "@/mocks/mockDashboardData";
import { useDashboard } from "@/features/dashboard/useDashboard";
import WelcomePanel from "@/components/dashboard/WelcomePanel";
import XPProgress from "@/components/dashboard/XPProgress";
import FlashcardGroups from "@/components/dashboard/FlashcardGroups";
import StudyStats from "@/components/dashboard/StudyStats";
import LogoutButton from "@/components/dashboard/LogoutButton";

export default function Dashboard() {
  const { t } = useTranslation();
  const { handleLogout, loading, profile } = useDashboard();
  const { xp, flashcardGroups, studyStats } = mockDashboardData;
  const progressColorClass = getXPProgressColor(xp.progressPercentage);

  if (loading) {
    return (
      <div className="min-h-screen bg-semantic-bg dark:bg-semantic-bg flex items-center justify-center">
        <div className="text-xl text-text-light dark:text-text-dark">{t('dashboard.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-semantic-bg dark:bg-semantic-bg">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <WelcomePanel profile={profile} xp={xp} studyStats={studyStats} />
        <XPProgress xp={xp} progressColorClass={progressColorClass} />
        <FlashcardGroups flashcardGroups={flashcardGroups} getDifficultyColor={getDifficultyColor} />
        <StudyStats studyStats={studyStats} />
      </div>
      <LogoutButton onLogout={handleLogout} />
    </div>
  );
}
