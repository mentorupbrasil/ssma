import { config as loadEnv } from "dotenv";
import path from "path";

// Garante que o .env local prevaleça sobre DATABASE_URL vazia no ambiente do sistema (Windows/CI)
loadEnv({ path: path.join(process.cwd(), ".env"), override: true });

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
