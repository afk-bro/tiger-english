import { jsx as _jsx } from "react/jsx-runtime";
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
    if (loading)
        return _jsx("div", { children: "Loading..." });
    // Only redirect if we are sure profile is missing
    if (!profile)
        return _jsx(Navigate, { to: "/login", replace: true });
    // Optional: allow admin override later
    if (profile.username !== username) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return _jsx(Outlet, {});
};
export default UserLayout;
