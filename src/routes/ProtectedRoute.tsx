import { Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useUserStore } from '@/stores/useUserStore';

const ProtectedRoute = () => {
  const { profile, loading, fetchProfile } = useUserStore();

  useEffect(() => {
    if (!profile && !loading) {
      fetchProfile();
    }
  }, [profile, loading, fetchProfile]);

  if (loading) return <div>Loading...</div>;
  if (!profile) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
