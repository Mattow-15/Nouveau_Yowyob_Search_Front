import { httpClient } from './http-client';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';

export interface SocialAuthRequest {
  code: string;
  redirectUri: string;
}

export interface AuthResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role: string;
    emailVerified: boolean;
  };
}

export const authService = {
  async googleAuth(code: string): Promise<AuthResponse> {
    console.log('🔐 Google Auth - sending code to backend');

    const response = await httpClient.post<AuthResponse>(API_ENDPOINTS.AUTH_GOOGLE, {
      code,
      redirectUri: `${window.location.origin}/api/auth/callback/google`
    });

    if (response.success) {
      this.storeTokens(response);
    }

    return response;
  },

  storeTokens(data: AuthResponse) {
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Cookies pour SSR
    document.cookie = `access_token=${data.accessToken}; path=/; max-age=3600`;
    document.cookie = `user=${JSON.stringify(data.user)}; path=/; max-age=604800`;
  },

  clearTokens() {
    localStorage.clear();
    document.cookie = 'access_token=; path=/; max-age=0';
    document.cookie = 'user=; path=/; max-age=0';
  }
};
