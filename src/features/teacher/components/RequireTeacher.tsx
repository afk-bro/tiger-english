import { Navigate } from "react-router-dom";
import { useUserStore } from "@/stores/useUserStore";
import type { ReactNode } from "react";

type ProfileWithRole = {
  role?: string | null;
};

export default function RequireTeacher({ children }: { children: ReactNode }) {
  const rawProfile = useUserStore((s) => s.profile);
  const sessionLoading = useUserStore((s) => s.sessionLoading);

  if (sessionLoading) {
    return (
      <div role="status" className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const profile = rawProfile as (typeof rawProfile & ProfileWithRole) | null;
  const role = profile?.role;
  const isTeacher = role === "teacher" || role === "admin";

  if (!isTeacher) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
