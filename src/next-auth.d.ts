import NextAuth, { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's postal address. */
      phone?: string | null
      company?: string | null
      department?: string | null
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    phone?: string | null;
    company?: string | null;
    department?: string | null;
  }
} 