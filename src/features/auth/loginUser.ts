import { supabase } from "@/lib/supabase";
import { LoginFormData } from "@/schemas/authSchema";

export const loginUser = async (data: LoginFormData): Promise<{
  success: boolean;
  message?: string;
}> => {
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
};
