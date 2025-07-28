// src/components/AppInitializer.tsx
import { useEffect } from "react";
import { useUserStore } from "@/stores/useUserStore";
import { supabase } from "@/lib/supabase";
export default function AppInitializer() {
    const fetchProfile = useUserStore((s) => s.fetchProfile);
    const clearProfile = useUserStore((s) => s.clearProfile);
    useEffect(() => {
        fetchProfile();
        const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
            if (!session) {
                clearProfile();
            }
            else {
                fetchProfile();
            }
        });
        return () => listener.subscription.unsubscribe();
    }, [fetchProfile, clearProfile]);
    return null;
}
