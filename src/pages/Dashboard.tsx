import { useTranslation } from 'react-i18next';
import WelcomePanel from "@/components/dashboard/WelcomePanel";
import YourProgressCard from "@/components/dashboard/YourProgressCard";
import LogoutButton from "@/components/dashboard/LogoutButton";
import { useDashboard } from "@/features/dashboard/useDashboard";
import { useProgressSummary } from "@/features/dashboard/useProgressSummary";

export default function Dashboard() {
  const { t } = useTranslation();
  const { handleLogout, profile } = useDashboard();
  const { data: summary, isLoading, error } = useProgressSummary();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-semantic-bg dark:bg-semantic-bg flex items-center justify-center">
        <div className="text-xl text-text-light dark:text-text-dark">{t('dashboard.loading')}</div>
      </div>
    );
  }
  if (error || !summary) {
    return (
      <div className="min-h-screen bg-semantic-bg dark:bg-semantic-bg flex items-center justify-center">
        <div className="p-8 text-center text-red-600">{t('dashboard.error')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-semantic-bg dark:bg-semantic-bg">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <WelcomePanel
          name={profile?.first_name ?? ""}
          streak={summary.streak.current_days}
        />
        <YourProgressCard
          activity={summary.activity}
          lastActiveAt={summary.last_active_at}
          timezone={profile?.timezone ?? "UTC"}
          cefrEstimate={profile?.cefr_estimate ?? null}
        />
      </div>
      <LogoutButton onLogout={handleLogout} />
    </div>
  );
}
