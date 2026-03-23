// src/lib/api/auth.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface RegisterUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  username: string;
  native_language?: string | null;
}

export interface LoginUserData {
  email: string;
  password: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  field?: string;
  data?: T;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    native_language: string | null;
  };
}

export interface UsernameCheckResponse {
  available: boolean;
}

export interface UpdateProfileData {
  native_language: string | null;
}

export interface ProfileResponse {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  native_language: string | null;
}

class AuthAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail?.message || errorData.message || 'Request failed');
    }

    return response.json();
  }

  async registerUser(userData: RegisterUserData): Promise<ApiResponse> {
    try {
      const response = await this.makeRequest<ApiResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return response;
    } catch (error) {
      // Handle structured error responses from FastAPI
      if (error instanceof Error) {
        try {
          const errorResponse = JSON.parse(error.message);
          return {
            success: false,
            message: errorResponse.detail?.message || errorResponse.message || error.message,
            field: errorResponse.detail?.field,
          };
        } catch {
          return {
            success: false,
            message: error.message,
          };
        }
      }
      return {
        success: false,
        message: 'An unexpected error occurred',
      };
    }
  }

  async loginUser(loginData: LoginUserData): Promise<TokenResponse | ApiResponse> {
    try {
      const response = await this.makeRequest<TokenResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      });
      return response;
    } catch (error) {
      if (error instanceof Error) {
        try {
          const errorResponse = JSON.parse(error.message);
          return {
            success: false,
            message: errorResponse.detail?.message || errorResponse.message || error.message,
            field: errorResponse.detail?.field,
          };
        } catch {
          return {
            success: false,
            message: error.message,
          };
        }
      }
      return {
        success: false,
        message: 'An unexpected error occurred',
      };
    }
  }

  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const response = await this.makeRequest<UsernameCheckResponse>(
        `/auth/check-username/${encodeURIComponent(username)}`
      );
      return response.available;
    } catch (error) {
      console.error('Error checking username availability:', error);
      // For safety, assume unavailable if we can't check
      return false;
    }
  }

  async logoutUser(): Promise<ApiResponse> {
    try {
      const response = await this.makeRequest<ApiResponse>('/auth/logout', {
        method: 'POST',
      });
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }

  async updateProfile(
    data: UpdateProfileData,
    accessToken: string,
  ): Promise<ProfileResponse | ApiResponse> {
    try {
      const response = await this.makeRequest<ProfileResponse>('/auth/profile', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, message: error.message };
      }
      return { success: false, message: 'An unexpected error occurred' };
    }
  }
}

export const authAPI = new AuthAPI();
