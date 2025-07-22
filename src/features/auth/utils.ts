// src/features/auth/utils.ts
import { supabase } from '@/lib/supabase';
import { 
  ERROR_MESSAGES, 
  ERROR_FIELD_MAPPING, 
  SUPABASE_ERROR_CODES, 
  ERROR_KEYWORDS 
} from './constants';

type ParsedError = {
  message: string;
  field?: keyof typeof ERROR_FIELD_MAPPING;
};

type SupabaseError = {
  message?: string;
  code?: string;
};

type AuthUser = {
  email_confirmed_at?: string;
};

type AuthData = {
  session?: unknown;
  user?: AuthUser;
};

// Helper function to check username availability
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single();

  // If no data found, username is available
  // If error and it's "PGRST116" (no rows), username is available
  if (error && error.code === SUPABASE_ERROR_CODES.NO_ROWS_FOUND) {
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
export async function cleanupAuthUser(userId: string): Promise<void> {
  try {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.error('Failed to cleanup auth user:', error);
    }
  } catch (cleanupError) {
    console.error('Error during auth user cleanup:', cleanupError);
  }
}

// Helper function to check if error message contains any of the keywords
function containsAnyKeyword(message: string, keywords: readonly string[]): boolean {
  return keywords.some(keyword => message.includes(keyword));
}

// Parse Supabase auth errors and return structured error information
export function parseAuthError(error: SupabaseError): ParsedError {
  const message = error.message || '';

  // Parse "user already exists" errors
  if (containsAnyKeyword(message, ERROR_KEYWORDS.USER_ALREADY_REGISTERED)) {
    return {
      message: ERROR_MESSAGES.EMAIL_REGISTERED,
      field: ERROR_FIELD_MAPPING.email,
    };
  }
  
  // Parse email-related errors
  if (containsAnyKeyword(message, ERROR_KEYWORDS.INVALID_EMAIL)) {
    return {
      message: message,
      field: ERROR_FIELD_MAPPING.email,
    };
  }
  
  // Parse password-related errors
  if (containsAnyKeyword(message, ERROR_KEYWORDS.PASSWORD_RELATED)) {
    return {
      message: message,
      field: ERROR_FIELD_MAPPING.password,
    };
  }

  return {
    message: `${ERROR_MESSAGES.SIGNUP_FAILED}: ${message}`,
  };
}

// Parse Supabase profile creation errors
export function parseProfileError(error: SupabaseError): ParsedError {
  const message = error.message || '';

  // Parse database constraint violations
  if (containsAnyKeyword(message, ERROR_KEYWORDS.DUPLICATE_KEY) || error.code === SUPABASE_ERROR_CODES.DUPLICATE_KEY) {
    // Check if it's a username constraint violation
    if (containsAnyKeyword(message, ERROR_KEYWORDS.USERNAME_CONSTRAINT)) {
      return {
        message: ERROR_MESSAGES.USERNAME_TAKEN,
        field: ERROR_FIELD_MAPPING.username,
      };
    }
    
    // Check if it's an email constraint violation
    if (containsAnyKeyword(message, ERROR_KEYWORDS.EMAIL_CONSTRAINT)) {
      return {
        message: ERROR_MESSAGES.EMAIL_REGISTERED,
        field: ERROR_FIELD_MAPPING.email,
      };
    }
  }

  // Parse other profile-related errors
  if (containsAnyKeyword(message, ERROR_KEYWORDS.FIRST_NAME_RELATED)) {
    return {
      message: ERROR_MESSAGES.FIRST_NAME_INVALID,
      field: ERROR_FIELD_MAPPING.firstName,
    };
  }

  if (containsAnyKeyword(message, ERROR_KEYWORDS.LAST_NAME_RELATED)) {
    return {
      message: ERROR_MESSAGES.LAST_NAME_INVALID,
      field: ERROR_FIELD_MAPPING.lastName,
    };
  }

  return {
    message: `${ERROR_MESSAGES.PROFILE_CREATION_FAILED}: ${message}`,
  };
}

// Check if user already exists but registration returned success
export function checkUserAlreadyExists(user: AuthUser, data: AuthData): ParsedError | null {
  if (user && !data.session && user.email_confirmed_at) {
    return {
      message: ERROR_MESSAGES.EMAIL_REGISTERED,
      field: ERROR_FIELD_MAPPING.email,
    };
  }
  return null;
}
