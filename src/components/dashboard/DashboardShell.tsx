import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "./AppShell";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell
      sidebar={<Sidebar user={session.user} />}
      topbar={<Topbar userName={session.user.name} />}
    >
      {children}
    </AppShell>
  );
}
