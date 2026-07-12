import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import type { UserRole } from "@/types/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      companyId?: string | null;
      clinicId?: string | null;
    };
  }

  interface User {
    role: UserRole;
    companyId?: string | null;
    clinicId?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    companyId?: string | null;
    clinicId?: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const email = String(credentials.email).toLowerCase().trim();
          const password = String(credentials.password);

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || user.status !== "ACTIVE") return null;

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;

          // Atualiza último acesso sem bloquear o login
          void prisma.user
            .update({
              where: { id: user.id },
              data: { lastAccessAt: new Date() },
            })
            .catch(() => undefined);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
            companyId: user.companyId,
            clinicId: user.clinicId,
          };
        } catch (error) {
          console.error("authorize error:", error);
          return null;
        }
      },
    }),
  ],
});
