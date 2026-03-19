// src/features/dashboard/useDashboard.ts
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/useUserStore";
import { logoutUser } from "@/features/auth/logoutUser";
import { toast } from "sonner";

export function useDashboard() {
  const { profile, loading, clearProfile } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !profile) {
      navigate("/login");
    }
  }, [loading, profile, navigate]);

  const handleLogout = useCallback(async () => {
    const error = await logoutUser();
    if (!error) {
      clearProfile();
      toast.success("Logged out");
      navigate("/login");
    }
  }, [clearProfile, navigate]);

  return { handleLogout, loading, profile };
}
