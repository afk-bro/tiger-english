import { Navigate } from "react-router-dom";
import { useUserStore } from "@/stores/useUserStore";
import type { ReactNode } from "react";

export default function RequireTeacher({ children }: { children: ReactNode }) {
  const profile = useUserStore((s) => s.profile);
  const sessionLoading = useUserStore((s) => s.sessionLoading);
  const profileLoading = useUserStore((s) => s.profileLoading);

  // Hold the spinner while EITHER the session or the profile is still
  // loading. AppInitializer flips sessionLoading→false before awaiting
  // fetchProfile() resolves, so without the profileLoading gate the guard
  // would briefly see a null profile and redirect real teachers to /home.
  if (sessionLoading || profileLoading) {
    return (
      <div role="status" className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isTeacher = profile?.role === "teacher" || profile?.role === "admin";

  if (!isTeacher) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
