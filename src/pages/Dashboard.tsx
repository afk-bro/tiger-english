// src/pages/Dashboard.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/useUserStore";
import { logoutUser } from "@/features/auth/logoutUser";
import { toast } from "sonner";
import { mockDashboardData, getXPProgressColor, getDifficultyColor } from "@/mocks/mockDashboardData";

import WelcomePanel from "@/components/dashboard/WelcomePanel";
import XPProgress from "@/components/dashboard/XPProgress";
import FlashcardGroups from "@/components/dashboard/FlashcardGroups";
import StudyStats from "@/components/dashboard/StudyStats";
import LogoutButton from "@/components/dashboard/LogoutButton";

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
        <WelcomePanel profile={profile} xp={xp} studyStats={studyStats} />
        <XPProgress xp={xp} progressColorClass={progressColorClass} />
        <FlashcardGroups flashcardGroups={flashcardGroups} getDifficultyColor={getDifficultyColor} />
        <StudyStats studyStats={studyStats} />
      </div>
      <LogoutButton onLogout={handleLogout} />
    </div>
  );
}
