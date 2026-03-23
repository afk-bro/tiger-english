// src/features/auth/registerUserAPI.ts
import { authAPI, type RegisterUserData } from '@/lib/api/auth';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from './constants';

type RegisterArgs = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userName: string;
  nativeLanguage: string | null;
};

type RegisterResult =
  | { success: true; message: string }
  | { success: false; error: string; field?: string };

export async function registerUserAPI({
  email,
  password,
  firstName,
  lastName,
  userName,
  nativeLanguage,
}: RegisterArgs): Promise<RegisterResult> {
  try {
    // Transform the data to match the backend API format
    const userData: RegisterUserData = {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      username: userName,
      native_language: nativeLanguage,
    };

    // Call the backend API
    const response = await authAPI.registerUser(userData);

    if (response.success) {
      return {
        success: true,
        message: response.message || SUCCESS_MESSAGES.ACCOUNT_CREATED,
      };
    } else {
      return {
        success: false,
        error: response.message || ERROR_MESSAGES.SIGNUP_FAILED,
        field: response.field,
      };
    }
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : ERROR_MESSAGES.SIGNUP_FAILED,
    };
  }
}
