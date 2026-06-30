/**
 * NextAuth setup with backend API communication
 * @author Matteo Owona, Rouchda Yampen
 * @date 2024-12-07
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { httpClient } from '@/lib/api/http-client';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import { verifyUser } from './users-db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        console.log("🔍 [AUTH] Attempting login for:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.warn("⚠️ [AUTH] Missing email or password");
          return null;
        }

        // IP réelle de l'utilisateur (NextAuth appelle le backend en server-to-server,
        // on transmet donc l'IP du navigateur pour que la géoloc backend soit correcte).
        const forwardedFor = (request as any)?.headers?.get?.('x-forwarded-for') || '';
        const clientIp = forwardedFor.split(',')[0].trim();

        try {
          const response = await httpClient.post<any>(API_ENDPOINTS.AUTH_LOGIN, {
            email: credentials.email,
            password: credentials.password,
          }, clientIp ? { headers: { 'x-forwarded-for': clientIp } } : undefined);

          console.log("✅ [AUTH] Backend response success:", response?.success);

          if (response && response.success && response.user) {
            return {
              id: response.user.id,
              email: response.user.email,
              name: response.user.name,
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              location: response.location ?? null,
            };
          }
          console.warn("⚠️ [AUTH] Login failed: Success is false or user missing");
          return null;
        } catch (error: any) {
          const errorCode = error?.code || '';
          const errorMessage = error?.message || 'Erreur inconnue';
          console.error(`❌ [AUTH] Error during login: ${errorMessage} (Code: ${errorCode})`);

          // Si le backend retourne 401 (mauvais mot de passe) pour un vrai compte → refus direct
          if (errorCode === 'HTTP_401') {
            const isTestAccount = ['admin@yowyob.com', 'user@yowyob.com'].includes(credentials.email as string);
            if (!isTestAccount) {
              console.error("❌ Refus du backend (Identifiants invalides - 401):", errorMessage);
              return null;
            }
            console.warn("⚠️ Compte test: fallback local malgré 401");
          }

          // Pour HTTP 400 (user not found), on laisse le fallback agir pour tous les comptes
          // Pour les erreurs réseau/serveur (5xx, timeout), on tente aussi le fallback
          console.warn(`⚠️ Backend inaccessible ou erreur (${errorMessage}). Tentative fallback local...`);

          // Fallback: Tentative avec la base de données locale (comptes de démo)
          const localUser = verifyUser(credentials.email as string, credentials.password as string);
          if (localUser) {
            console.log('✅ [AUTH] Fallback local réussi pour:', localUser.email);
            return {
              id: localUser.id,
              email: localUser.email,
              name: localUser.name,
              accessToken: 'mock_access_token_' + localUser.id,
              refreshToken: 'mock_refresh_token_' + localUser.id,
              role: localUser.role
            };
          }

          console.warn("❌ [AUTH] Fallback local échoué. Aucun utilisateur trouvé.");
          return null;
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      checks: ['none']
    }),
  ],
  pages: {
    signIn: '/auth',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // 1. Connexion via Credentials (Backend direct)
      if (user && account?.type === 'credentials') {
        console.log("🔐 [JWT Callback] Initial login (Credentials). User ID:", user.id);
        token.id = user.id;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.location = (user as any).location ?? null;
      }

      // 2. Connexion via Google (Token Exchange)
      if (account?.provider === 'google' && account.id_token) {
        try {
          console.log("🌐 [JWT Callback] Google Login detected. Exchanging token with Backend...");

          const response = await httpClient.post<any>(API_ENDPOINTS.AUTH_GOOGLE, {
            token: account.id_token
          });

          if (response && response.success && response.user) {
            token.id = response.user.id;
            token.accessToken = response.accessToken;
            token.refreshToken = response.refreshToken;
            token.name = response.user.name;
            token.email = response.user.email;
            token.location = response.location ?? null;
            console.log("✅ [JWT Callback] Token exchanged successfully!");
          }
        } catch (error: any) {
          console.error("❌ Token exchange failed:", error);
          if (error.response) {
            console.error("❌ Response Status:", error.response.status);
            console.error("❌ Response Data:", await error.response.json().catch(() => "No JSON"));
          }
        }
      }

      // Log pour vérifier la persistance
      // console.log("🎫 [JWT Callback] Token state:", { hasAccessToken: !!token.accessToken, sub: token.sub });

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).accessToken = token.accessToken as string;
        (session.user as any).location = (token as any).location ?? null;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        // console.log("📦 [Session Callback] Session built for:", session.user.email, "Has Token:", !!token.accessToken);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-changez-moi',
});

/**
 * Register a new user via the backend API
 */
export async function registerUser(email: string, password: string, name: string): Promise<{ success: boolean; error?: string; user?: any }> {
  console.log('🚀 INSIDE registerUser - httpClient baseUrl:', (httpClient as any).baseUrl);
  try {
    const response = await httpClient.post<any>(API_ENDPOINTS.AUTH_REGISTER, {
      email,
      password,
      name,
    });

    if (response && response.success) {
      return { success: true, user: response.user };
    }

    return {
      success: false,
      error: response?.message || 'Erreur lors de la création du compte'
    };
  } catch (error: any) {
    console.error('❌ Erreur registerUser:', error);
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la communication avec le serveur'
    };
  }
}