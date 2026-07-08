import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const KERNEL_URL = (process.env.AUTH_BACKEND_URL || 'http://kernel-core-kernel-layer-1:8080').replace(/\/$/, '');

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${KERNEL_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const data = await res.json();
          if (!data?.success || !data?.user) return null;

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name ?? data.user.email,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
  // AUTH_SECRET/NEXTAUTH_SECRET sont des vars serveur — jamais exposées au client
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-only',
});

export async function registerUser(
  email: string,
  password: string,
  name: string,
): Promise<{ success: boolean; error?: string; user?: any }> {
  try {
    const res = await fetch(`${KERNEL_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (res.ok && data?.success) return { success: true, user: data.user };
    return { success: false, error: data?.message || 'Erreur lors de la création du compte' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur réseau' };
  }
}
