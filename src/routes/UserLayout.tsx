// src/routes/UserLayout.tsx
import { Navigate, Outlet, useParams } from "react-router-dom";
import { useUserStore } from "@/stores/useUserStore";
import { useEffect } from "react";

const UserLayout = () => {
  const { username } = useParams();
  const { profile, loading, fetchProfile } = useUserStore();

  useEffect(() => {
    if (!profile && !loading) {
      fetchProfile();
    }
  }, [profile, loading, fetchProfile]);

  // Show nothing until loading completes
  if (loading) return <div>Loading...</div>;

  // Only redirect if we are sure profile is missing
  if (!profile) return <Navigate to="/login" replace />;

  // Optional: allow admin override later
  if (profile.username !== username) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default UserLayout;
