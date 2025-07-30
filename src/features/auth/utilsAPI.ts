// src/features/auth/utilsAPI.ts
import { authAPI } from '@/lib/api/auth';

// Helper function to check username availability using backend API
export async function checkUsernameAvailabilityAPI(username: string): Promise<boolean> {
  try {
    return await authAPI.checkUsernameAvailability(username);
  } catch (error) {
    console.error('Error checking username availability:', error);
    // For safety, assume unavailable if we can't check
    return false;
  }
}

// Note: Other utility functions (parseAuthError, parseProfileError, etc.) 
// are no longer needed since the backend handles all error parsing and cleanup
