import { auth } from "@/lib/auth";
import { isEmpresaUser } from "@/lib/authz";
import { redirect } from "next/navigation";
import { AppShell } from "./AppShell";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const isEmpresa = isEmpresaUser(session as never);

  return (
    <AppShell
      sidebar={<Sidebar user={session.user} />}
      topbar={<Topbar userName={session.user.name} showSearch={!isEmpresa} />}
    >
      {children}
    </AppShell>
  );
}
