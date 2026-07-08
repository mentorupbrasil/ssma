import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { normalizeRole } from "@/lib/tenant";
import { SUPER_ADMIN_NAV } from "@/lib/permissions";
import {
  LayoutDashboard,
  Building2,
  LifeBuoy,
  Settings,
  LogOut,
} from "lucide-react";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Building2,
  LifeBuoy,
  Settings,
};

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || normalizeRole(session.user.role) !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="border-b border-slate-100 p-5">
          <p className="text-sm font-bold text-[var(--brand-navy)]">Unimetra SaaS</p>
          <p className="text-xs text-slate-500">Super Admin</p>
        </div>
        <nav className="space-y-1 p-3">
          {SUPER_ADMIN_NAV.map((item) => {
            const Icon = ICONS[item.icon] ?? LayoutDashboard;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="ghost" className="w-full justify-start">
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
