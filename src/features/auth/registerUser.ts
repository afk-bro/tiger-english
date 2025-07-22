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
  | { success: false; error: string; field?: string };

// Helper function to check username availability
async function checkUsernameAvailability(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single();

  // If no data found, username is available
  // If error and it's "PGRST116" (no rows), username is available
  if (error && error.code === 'PGRST116') {
    return true; // Username available
  }
  
  if (error) {
    // Other database errors - assume unavailable for safety
    console.error('Error checking username availability:', error);
    return false;
  }

  // If data exists, username is taken
  return !data;
}

// Helper function to cleanup auth user if profile creation fails
async function cleanupAuthUser(userId: string): Promise<void> {
  try {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.error('Failed to cleanup auth user:', error);
    }
  } catch (cleanupError) {
    console.error('Error during auth user cleanup:', cleanupError);
  }
}

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
      error: 'This username is already taken. Please choose a different username.',
      field: 'username',
    };
  }

  // Step 1: Sign up user with Supabase Auth (only after username is confirmed available)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    // Parse "user already exists" errors
    if (error.message.includes('User already registered') || 
        error.message.includes('already registered') ||
        error.message.includes('already exists') ||
        error.message.includes('email address is already registered')) {
      return {
        success: false,
        error: 'This email is already registered. Please use a different email or try logging in.',
        field: 'email',
      };
    }
    
    // Parse email-related errors
    if (error.message.includes('Invalid email') || error.message.includes('email')) {
      return {
        success: false,
        error: error.message,
        field: 'email',
      };
    }
    
    // Parse password-related errors
    if (error.message.includes('Password') || error.message.includes('password')) {
      return {
        success: false,
        error: error.message,
        field: 'password',
      };
    }

    return {
      success: false,
      error: `Sign-up failed: ${error.message}`,
    };
  }

  // Check if user already exists (Supabase might return success but user already exists)
  const user = data.user;
  if (!user) {
    return {
      success: false,
      error: 'No user object returned from Supabase.',
    };
  }

  // If user exists but no confirmation email was sent, it might mean user already exists
  if (user && !data.session && user.email_confirmed_at) {
    return {
      success: false,
      error: 'This email is already registered. Please use a different email or try logging in.',
      field: 'email',
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

    // Parse database constraint violations
    if (profileError.message.includes('duplicate key') || profileError.code === '23505') {
      // Check if it's a username constraint violation
      if (profileError.message.includes('username') || profileError.message.includes('profiles_username_key')) {
        return {
          success: false,
          error: 'This username is already taken. Please choose a different username.',
          field: 'username',
        };
      }
      
      // Check if it's an email constraint violation
      if (profileError.message.includes('email') || profileError.message.includes('profiles_email_key')) {
        return {
          success: false,
          error: 'This email is already registered. Please use a different email or try logging in.',
          field: 'email',
        };
      }
    }

    // Parse other profile-related errors
    if (profileError.message.includes('first_name')) {
      return {
        success: false,
        error: 'Invalid first name provided.',
        field: 'firstName',
      };
    }

    if (profileError.message.includes('last_name')) {
      return {
        success: false,
        error: 'Invalid last name provided.',
        field: 'lastName',
      };
    }

    return {
      success: false,
      error: `Profile creation failed: ${profileError.message}`,
    };
  }

  // Step 3: Clear the session to prevent automatic login
  // User should explicitly log in after registration
  await supabase.auth.signOut();

  return {
    success: true,
    message: 'Account created successfully!',
  };
}
