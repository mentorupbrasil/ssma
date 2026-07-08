"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  Stethoscope,
  DollarSign,
  FolderOpen,
  UserCog,
  Settings,
  Shield,
  LogOut,
  Menu,
  Inbox,
  Calculator,
  Wallet,
  CheckSquare,
  LifeBuoy,
  Sparkles,
  CalendarDays,
  Newspaper,
} from "lucide-react";
import { signOut } from "next-auth/react";
import type { UserRole } from "@/types/roles";
import { DASHBOARD_NAV, hasPermission, getRoleLabel } from "@/lib/permissions";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  Stethoscope,
  DollarSign,
  FolderOpen,
  UserCog,
  Settings,
  Shield,
  Inbox,
  Calculator,
  Wallet,
  CheckSquare,
  LifeBuoy,
  Sparkles,
  CalendarDays,
  Newspaper,
};

const NAV_SECTIONS = [
  {
    label: "Geral",
    hrefs: ["/dashboard"],
  },
  {
    label: "Operação",
    hrefs: [
      "/dashboard/empresas",
      "/dashboard/colaboradores",
      "/dashboard/pre-encaminhamentos",
      "/dashboard/encaminhamentos",
      "/dashboard/agenda",
      "/dashboard/documentos",
      "/dashboard/exames",
    ],
  },
  {
    label: "Gestão",
    hrefs: [
      "/dashboard/fechamento-mensal",
      "/dashboard/financeiro",
      "/dashboard/orcamentos",
      "/dashboard/tarefas",
      "/dashboard/chamados",
      "/dashboard/assistente-sst",
    ],
  },
  {
    label: "Sistema",
    hrefs: ["/dashboard/usuarios", "/dashboard/configuracoes", "/dashboard/conteudo", "/dashboard/auditoria"],
  },
] as const;

type SidebarProps = {
  user: { name: string; email: string; role: UserRole };
};

function NavContent({ user, onNavigate }: { user: SidebarProps["user"]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = DASHBOARD_NAV.filter((item) => hasPermission(user.role, item.permission));
  const itemByHref = new Map(items.map((item) => [item.href, item]));

  return (
    <div className="app-shell-sidebar-inner">
      <div className="app-shell-sidebar-brand">
        <Link href="/dashboard" onClick={onNavigate} className="app-shell-sidebar-brand-link">
          <BrandLogo height={26} showLink={false} className="app-shell-sidebar-logo" />
          <div className="app-shell-sidebar-brand-copy">
            <p className="app-shell-sidebar-brand-title">Painel</p>
            <p className="app-shell-sidebar-brand-role">{getRoleLabel(user.role)}</p>
          </div>
        </Link>
      </div>

      <nav className="app-shell-nav">
        {NAV_SECTIONS.map((section) => {
          const sectionItems = section.hrefs
            .map((href) => itemByHref.get(href))
            .filter((item): item is (typeof items)[number] => Boolean(item));

          if (sectionItems.length === 0) return null;

          return (
            <div key={section.label} className="app-shell-nav-section">
              <p className="app-shell-nav-label">{section.label}</p>
              <div className="space-y-1">
                {sectionItems.map((item) => {
                  const Icon = ICONS[item.icon] ?? LayoutDashboard;
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn("app-shell-nav-link", active && "app-shell-nav-link-active")}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="app-shell-sidebar-footer">
        <div className="app-shell-user-card">
          <p className="truncate text-sm font-medium text-slate-700">{user.name}</p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start rounded-xl text-slate-600 hover:text-red-600"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="app-shell-sidebar hidden lg:block">
        <NavContent user={user} />
      </aside>

      <div className="fixed bottom-5 left-5 z-40 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                size="icon"
                variant="navy"
                className="h-14 w-14 rounded-2xl shadow-[var(--shadow-elevated)]"
              >
                <Menu className="h-5 w-5" />
              </Button>
            }
          />
          <SheetContent side="left" className="w-72 p-0">
            <NavContent user={user} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
