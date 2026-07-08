import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/** Instância edge-safe (sem Prisma) — usada pelo middleware. */
export const { auth } = NextAuth(authConfig);
