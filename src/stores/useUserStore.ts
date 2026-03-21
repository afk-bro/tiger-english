// src/stores/useUserStore.ts
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  username: string;
};

type UserStore = {
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

    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, username")
      .eq("id", session.user.id)
      .single();

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
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          username: data.username,
        },
        error: null,
        profileLoading: false,
      });
    }
  },

  clearProfile: () => set({ profile: null, error: null, profileLoading: false }),
}));
