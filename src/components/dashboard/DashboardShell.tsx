import { auth } from "@/lib/auth";
import { isEmpresaUser } from "@/lib/authz";
import { loadRolePermissionOverrides } from "@/lib/role-permissions";
import { redirect } from "next/navigation";
import { AppShell } from "./AppShell";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BreadcrumbLabelProvider } from "./BreadcrumbLabelProvider";

export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const isEmpresa = isEmpresaUser(session as never);
  const permissionOverrides = await loadRolePermissionOverrides(session.user.clinicId);

  return (
    <BreadcrumbLabelProvider>
      <AppShell
        sidebar={<Sidebar user={session.user} permissionOverrides={permissionOverrides} />}
        topbar={<Topbar userName={session.user.name} showSearch={!isEmpresa} />}
      >
        {children}
      </AppShell>
    </BreadcrumbLabelProvider>
  );
}
