import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/stores/useUserStore";
import { LoginFormData } from "@/schemas/authSchema";

export const loginUser = async (data: LoginFormData): Promise<{
  success: boolean;
  message?: string;
}> => {
  const { fetchProfile } = useUserStore.getState();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  await fetchProfile(); // pull user info into Zustand store
  return { success: true };
};
