// src/features/dashboard/useDashboard.ts
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/useUserStore";
import { logoutUser } from "@/features/auth/logoutUser";
import { toast } from "sonner";

export function useDashboard() {
  const { profile, profileLoading, clearProfile } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    const error = await logoutUser();
    if (!error) {
      clearProfile();
      toast.success("Logged out");
      navigate("/login");
    }
  }, [clearProfile, navigate]);

  return { handleLogout, loading: profileLoading, profile };
}
