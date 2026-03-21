// src/routes/UserLayout.tsx
import { Navigate, Outlet, useParams } from "react-router-dom";
import { useUserStore } from "@/stores/useUserStore";
import { useEffect } from "react";

const UserLayout = () => {
  const { username } = useParams();
  const { profile, profileLoading, fetchProfile } = useUserStore();

  useEffect(() => {
    if (!profile && !profileLoading) {
      fetchProfile();
    }
  }, [profile, profileLoading, fetchProfile]);

  // Show nothing until loading completes
  if (profileLoading) return <div>Loading...</div>;

  // Only redirect if we are sure profile is missing
  if (!profile) return <Navigate to="/login" replace />;

  // Optional: allow admin override later
  if (profile.username !== username) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default UserLayout;
