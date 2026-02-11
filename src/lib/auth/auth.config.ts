/**
 * NextAuth configuration
 * @author Matteo Owona, Rouchda Yampen
 * @date 2024-12-07
 */

import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/auth',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const isOnDashboard = pathname.startsWith('/profile');
      const isOnAdmin = pathname.startsWith('/admin');
      const isOnHistory = pathname === '/history';

      // Rediriger les utilisateurs non connectés loin de l'historique
      if (isOnHistory && !isLoggedIn) {
        return false; // Redirect to login
      }

      // Rediriger les utilisateurs non connectés loin du dashboard et admin
      if ((isOnDashboard || isOnAdmin) && !isLoggedIn) {
        return false; // Redirect to login
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  providers: [], // Providers ajoutés après
};