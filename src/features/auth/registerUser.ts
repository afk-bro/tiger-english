// src/features/auth/registerUser.ts
import { supabase } from '@/lib/supabase';

type RegisterArgs = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userName: string;
};

type RegisterResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function registerUser({
  email,
  password,
  firstName,
  lastName,
  userName,
}: RegisterArgs): Promise<RegisterResult> {
  // Step 1: Sign up user with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: `Sign-up failed: ${error.message}`,
    };
  }

  // Step 2: Insert profile info
  const user = data.user;
  if (!user) {
    return {
      success: false,
      error: 'No user object returned from Supabase.',
    };
  }

  const { error: profileError } = await supabase.from('profiles').insert([
  {
    id: user.id,
    first_name: firstName,
    last_name: lastName,
    email: user.email,
    username: userName,
  },
]);

  if (profileError) {
    return {
      success: false,
      error: `Profile creation failed: ${profileError.message}`,
    };
  }

  return {
    success: true,
    message: 'Account created successfully!',
  };
}
