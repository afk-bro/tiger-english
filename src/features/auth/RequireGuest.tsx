import { Navigate } from "react-router-dom";
import { useUserStore } from "@/stores/useUserStore";
import type { ReactNode } from "react";

export default function RequireGuest({ children }: { children: ReactNode }) {
  const session = useUserStore((s) => s.session);
  const sessionLoading = useUserStore((s) => s.sessionLoading);

  if (sessionLoading) {
    return (
      <div role="status" className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (session) return <Navigate to="/" replace />;

  return <>{children}</>;
}
