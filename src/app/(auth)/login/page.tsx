import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginPageClient } from "@/components/forms/LoginForm";

export const metadata = { title: "Login" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return <LoginPageClient />;
}
