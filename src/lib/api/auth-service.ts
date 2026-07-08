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
    // Tokens en localStorage uniquement — NextAuth gère la session côté serveur.
    // En production, migrer vers des cookies HttpOnly posés par le serveur.
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    // Ne pas stocker l'objet user complet (email, id) — utiliser la session NextAuth
  },

  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};
