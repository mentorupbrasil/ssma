import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { AuthSession } from "@/lib/authz";

export async function requireAuthSession(): Promise<AuthSession> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session as AuthSession;
}

export async function requirePagePermission(permission: Permission): Promise<AuthSession> {
  const session = await requireAuthSession();
  if (!hasPermission(session.user.role, permission)) {
    notFound();
  }
  return session;
}

export function handleAccessError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message === "FORBIDDEN" || error.message === "NOT_FOUND") {
      notFound();
    }
  }
  throw error;
}
