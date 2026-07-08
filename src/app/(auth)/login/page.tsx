import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { normalizeRole } from "@/lib/tenant";
import { LoginPageClient } from "@/components/forms/LoginForm";

export const metadata = { title: "Login" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    const role = normalizeRole(session.user.role);
    redirect(role === "SUPER_ADMIN" ? "/super-admin" : "/dashboard");
  }

  return <LoginPageClient />;
}
