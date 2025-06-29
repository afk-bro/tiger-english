// src/features/auth/logoutUser.ts
import { supabase } from "../../lib/supabase";

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  return error;
};
