// src/stores/useUserStore.ts
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
export const useUserStore = create((set) => ({
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
            .select("id, first_name, last_name, email, username")
            .eq("id", session.user.id)
            .single();
        if (error) {
            set({ error: error.message, profile: null, loading: false });
        }
        else {
            set({
                profile: {
                    id: data.id,
                    email: data.email,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    username: data.username,
                },
                error: null,
                loading: false,
            });
        }
    },
    clearProfile: () => set({ profile: null, error: null, loading: false }),
}));
