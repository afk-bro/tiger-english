// src/features/auth/registerUser.ts
import { supabase } from '@/lib/supabase';
import { ERROR_MESSAGES, ERROR_FIELD_MAPPING, SUCCESS_MESSAGES } from './constants';
import { 
  checkUsernameAvailability, 
  cleanupAuthUser, 
  parseAuthError, 
  parseProfileError, 
  checkUserAlreadyExists 
} from './utils';

type RegisterArgs = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userName: string;
};

type RegisterResult =
  | { success: true; message: string }
  | { success: false; error: string; field?: string };

export async function registerUser({
  email,
  password,
  firstName,
  lastName,
  userName,
}: RegisterArgs): Promise<RegisterResult> {
  // Step 0: Pre-check username availability FIRST (before creating auth user)
  const isUsernameAvailable = await checkUsernameAvailability(userName);
  if (!isUsernameAvailable) {
    return {
      success: false,
      error: ERROR_MESSAGES.USERNAME_TAKEN,
      field: ERROR_FIELD_MAPPING.username,
    };
  }

  // Step 1: Sign up user with Supabase Auth (only after username is confirmed available)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    const parsedError = parseAuthError(error);
    return {
      success: false,
      error: parsedError.message,
      field: parsedError.field,
    };
  }

  // Check if user already exists (Supabase might return success but user already exists)
  const user = data.user;
  if (!user) {
    return {
      success: false,
      error: ERROR_MESSAGES.NO_USER_OBJECT,
    };
  }

  // If user exists but no confirmation email was sent, it might mean user already exists
  const existingUserError = checkUserAlreadyExists(user as any, data as any);
  if (existingUserError) {
    return {
      success: false,
      error: existingUserError.message,
      field: existingUserError.field,
    };
  }

  // Step 2: Insert profile info

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
    // Cleanup auth user since profile creation failed
    await cleanupAuthUser(user.id);

    const parsedError = parseProfileError(profileError);
    return {
      success: false,
      error: parsedError.message,
      field: parsedError.field,
    };
  }

  // Step 3: Clear the session to prevent automatic login
  // User should explicitly log in after registration
  await supabase.auth.signOut();

  return {
    success: true,
    message: SUCCESS_MESSAGES.ACCOUNT_CREATED,
  };
}
