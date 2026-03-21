// src/components/AppInitializer.tsx
import { useEffect } from "react";
import { useUserStore } from "@/stores/useUserStore";
import { supabase } from "@/lib/supabase";

export default function AppInitializer() {
  const setSession = useUserStore((s) => s.setSession);
  const setSessionLoading = useUserStore((s) => s.setSessionLoading);
  const fetchProfile = useUserStore((s) => s.fetchProfile);
  const clearProfile = useUserStore((s) => s.clearProfile);

  useEffect(() => {
    // Subscribe first — skip INITIAL_SESSION to avoid double-firing with getSession()
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      setSession(session);
      if (session) {
        fetchProfile();
      } else {
        clearProfile();
      }
    });

    // Initial hydration — getSession() is the single source of truth on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
      if (session) {
        fetchProfile();
      } else {
        clearProfile();
      }
    }).catch(() => {
      setSessionLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, [setSession, setSessionLoading, fetchProfile, clearProfile]);

  return null;
}
