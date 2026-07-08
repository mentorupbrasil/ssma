import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/types/roles";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isDashboard = nextUrl.pathname.startsWith("/dashboard");

      if (isDashboard) {
        return !!auth?.user;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; role: UserRole; companyId?: string | null };
        token.sub = u.id;
        token.id = u.id;
        token.role = u.role;
        token.companyId = u.companyId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.companyId = token.companyId as string | null | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
