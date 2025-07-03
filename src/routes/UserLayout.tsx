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

  if (loading) return <div>Loading...</div>;

  // Optional: allow admin override later
  if (!profile || profile.username !== username) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default UserLayout;
