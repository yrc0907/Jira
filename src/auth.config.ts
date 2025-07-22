import type { NextAuthConfig } from 'next-auth';
import { db } from './lib/db';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        const userFromDb = await db.user.findUnique({ where: { id: token.sub } });
        if (userFromDb) {
          session.user.name = userFromDb.name ?? '';
          session.user.email = userFromDb.email ?? '';
          session.user.image = userFromDb.image ?? null;
          session.user.phone = userFromDb.phone;
          session.user.company = userFromDb.company;
          session.user.department = userFromDb.department;
        }
      }
      return session;
    },
    async jwt({ token }) {
      return token;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig; 