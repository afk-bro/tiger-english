// src/components/AppInitializer.tsx
import { useEffect } from "react";
import { useUserStore } from "@/stores/useUserStore";
import { supabase } from "@/lib/supabase";
import { authAPI } from "@/lib/api/auth";
import {
  hydrateLessonProgressFromBackend,
  resetLessonProgress,
} from "@/features/lessons/useLessonProgressStore";

async function captureTimezoneIfMissing() {
  const { profile, session } = useUserStore.getState();
  if (!profile || !session) return;
  if (profile.timezone) return; // already captured
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!browserTz) return;
  try {
    const result = await authAPI.updateProfile({ timezone: browserTz }, session.access_token);
    // updateProfile returns ProfileResponse on success, ApiResponse with success=false on logical failure
    if ("success" in result && result.success === false) {
      console.error("Failed to capture user timezone (server)", result.message);
      return;
    }
    // Re-fetch profile so the in-memory store gets the new timezone.
    await useUserStore.getState().fetchProfile();
  } catch (err) {
    console.error("Failed to capture user timezone (network)", err);
  }
}

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
        fetchProfile().then(() => captureTimezoneIfMissing());
        void hydrateLessonProgressFromBackend();
      } else {
        clearProfile();
        resetLessonProgress();
      }
    });

    // Initial hydration — getSession() is the single source of truth on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
      if (session) {
        fetchProfile().then(() => captureTimezoneIfMissing());
        void hydrateLessonProgressFromBackend();
      } else {
        clearProfile();
        resetLessonProgress();
      }
    }).catch(() => {
      setSessionLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, [setSession, setSessionLoading, fetchProfile, clearProfile]);

  return null;
}
