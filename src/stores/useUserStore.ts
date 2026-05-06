// src/stores/useUserStore.ts
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import type { CefrLevel } from "@/features/lessons/lesson.types";

type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  username: string;
  native_language: string | null;
  timezone?: string | null;
  /** Learner's estimated CEFR proficiency level — populated once the DB migration adds the column */
  cefr_estimate?: CefrLevel | null;
  /** Learner's self-set target CEFR level — e.g. 'B1' */
  target_cefr_level?: CefrLevel | null;
};

export type UserStore = {
  // Auth slice
  session: Session | null;
  sessionLoading: boolean;
  setSession: (session: Session | null) => void;
  setSessionLoading: (loading: boolean) => void;
  // Profile slice
  profile: UserProfile | null;
  profileLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  clearProfile: () => void;
  setNativeLanguage: (code: string | null) => void;
  setTargetCefrLevel: (level: CefrLevel | null) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  // Auth slice
  session: null,
  sessionLoading: true,
  setSession: (session) => set({ session }),
  setSessionLoading: (sessionLoading) => set({ sessionLoading }),

  // Profile slice
  profile: null,
  profileLoading: true,
  error: null,

  fetchProfile: async () => {
    set({ profileLoading: true, error: null });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      set({ profile: null, profileLoading: false });
      return;
    }

    // cefr_estimate / target_cefr_level columns aren't in the auto-generated
    // Supabase types yet, so widen the row type at the boundary.
    type ProfileRow = {
      id: string;
      first_name: string;
      last_name: string;
      email: string | null;
      username: string;
      native_language: string | null;
      timezone: string | null;
      cefr_estimate: CefrLevel | null;
      target_cefr_level: CefrLevel | null;
    };

    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, username, native_language, timezone, cefr_estimate, target_cefr_level")
      .eq("id", session.user.id)
      .single<ProfileRow>();

    if (error) {
      if (error.code === 'PGRST116') {
        set({ profile: null, error: null, profileLoading: false });
      } else {
        set({ error: error.message, profile: null, profileLoading: false });
      }
    } else {
      set({
        profile: {
          id: data.id,
          email: data.email ?? undefined,
          first_name: data.first_name,
          last_name: data.last_name,
          username: data.username,
          native_language: data.native_language ?? null,
          timezone: data.timezone ?? null,
          cefr_estimate: data.cefr_estimate ?? null,
          target_cefr_level: data.target_cefr_level ?? null,
        },
        error: null,
        profileLoading: false,
      });
    }
  },

  clearProfile: () => set({ profile: null, error: null, profileLoading: false }),

  setNativeLanguage: (code) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, native_language: code } : null,
    })),

  setTargetCefrLevel: (level) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, target_cefr_level: level } : null,
    })),
}));
