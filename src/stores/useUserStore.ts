// src/stores/useUserStore.ts
import { create } from "zustand";
import { supabase } from "@/lib/supabase";

type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
};

type UserStore = {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  clearProfile: () => void;
};

export const useUserStore = create<UserStore>((set) => ({
  profile: null,
  loading: true,
  error: null,

  fetchProfile: async () => {
    set({ loading: true, error: null });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      set({ profile: null, loading: false });
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("id", session.user.id)
      .single();

    if (error) {
      set({ error: error.message, profile: null, loading: false });
    } else {
      set({ profile: data, error: null, loading: false });
    }
  },

  clearProfile: () => set({ profile: null, error: null, loading: false }),
}));
