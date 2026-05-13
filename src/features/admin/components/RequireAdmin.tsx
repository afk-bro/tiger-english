import { Navigate } from "react-router-dom";
import { useUserStore } from "@/stores/useUserStore";
import type { ReactNode } from "react";

// Defense-in-depth route guard for /admin/* paths. The backend is the
// authoritative gate (SUPER_ADMIN_USER_IDS env list on the FastAPI side
// — see backend/app/api/v1/admin.py); this wrapper just prevents
// non-admin users from mounting the admin shell and firing privileged
// XHRs in the browser. Mirrors RequireTeacher.
export default function RequireAdmin({ children }: { children: ReactNode }) {
  const profile = useUserStore((s) => s.profile);
  const sessionLoading = useUserStore((s) => s.sessionLoading);
  const profileLoading = useUserStore((s) => s.profileLoading);

  // Hold the spinner while EITHER the session or profile is still loading
  // — AppInitializer flips sessionLoading→false before fetchProfile()
  // resolves, so without the profileLoading gate the guard could briefly
  // redirect a real admin to /home on first load.
  if (sessionLoading || profileLoading) {
    return (
      <div role="status" className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
