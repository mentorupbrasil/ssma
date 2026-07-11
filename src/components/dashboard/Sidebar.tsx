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
  Tags,
  ClipboardList,
} from "lucide-react";
import { signOut } from "next-auth/react";
import type { UserRole } from "@/types/roles";
import { DASHBOARD_NAV, hasPermission, getRoleLabel } from "@/lib/permissions";
import {
  EMPRESA_HIDDEN_NAV_HREFS,
  EMPRESA_NAV_SECTIONS,
  EMPRESA_NAV_LABEL_OVERRIDES,
  EMPRESA_NAV_ICON_OVERRIDES,
  EMPRESA_NAV_HREFS,
  isEmpresaPortalRole,
} from "@/lib/empresa-portal";
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
  Tags,
  ClipboardList,
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
    label: "Comercial e financeiro",
    hrefs: [
      "/dashboard/orcamentos",
      "/dashboard/tabela-precos",
      "/dashboard/fechamento-mensal",
      "/dashboard/financeiro",
    ],
  },
  {
    label: "Gestão interna",
    hrefs: [
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

function userInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function NavContent({ user, onNavigate }: { user: SidebarProps["user"]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isEmpresa = isEmpresaPortalRole(user.role);
  const items = DASHBOARD_NAV.filter((item) => {
    if (!hasPermission(user.role, item.permission)) return false;
    if (isEmpresa) {
      if (!EMPRESA_NAV_HREFS.includes(item.href)) return false;
      if (EMPRESA_HIDDEN_NAV_HREFS.includes(item.href)) return false;
    }
    return true;
  });
  const navSections = isEmpresa ? EMPRESA_NAV_SECTIONS : NAV_SECTIONS;
  const itemByHref = new Map(items.map((item) => [item.href, item]));
  const initials = userInitials(user.name);

  const renderNavLink = (item: (typeof items)[number]) => {
    const iconName =
      isEmpresa && EMPRESA_NAV_ICON_OVERRIDES[item.href]
        ? EMPRESA_NAV_ICON_OVERRIDES[item.href]
        : item.icon;
    const Icon = ICONS[iconName] ?? LayoutDashboard;
    const active = isEmpresa
      ? item.href === "/dashboard/encaminhamentos"
        ? pathname.startsWith("/dashboard/encaminhamentos") ||
          pathname.startsWith("/dashboard/agenda")
        : pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href))
      : pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(item.href));
    const label =
      isEmpresa && EMPRESA_NAV_LABEL_OVERRIDES[item.href]
        ? EMPRESA_NAV_LABEL_OVERRIDES[item.href]
        : item.label;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn("app-shell-nav-link", active && "app-shell-nav-link-active")}
      >
        <Icon className="h-4 w-4 shrink-0 [&_svg]:stroke-[2]" />
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  return (
    <div className={cn("app-shell-sidebar-inner", isEmpresa && "app-shell-sidebar-inner--empresa")}>
      <div className={cn("app-shell-sidebar-body", isEmpresa && "app-shell-sidebar-body--empresa")}>
        <div className="app-shell-sidebar-brand">
          <Link href="/dashboard" onClick={onNavigate} className="app-shell-sidebar-brand-link">
            <BrandLogo height={26} showLink={false} className="app-shell-sidebar-logo" />
            <div className="app-shell-sidebar-brand-copy">
              <p className="app-shell-sidebar-brand-title">Unimetra · Painel</p>
              <p className="app-shell-sidebar-brand-role">{getRoleLabel(user.role)}</p>
            </div>
          </Link>
        </div>

        <nav className={cn("app-shell-nav", isEmpresa && "app-shell-nav--empresa")}>
          {navSections.map((section) => {
            const sectionItems = section.hrefs
              .map((href) => itemByHref.get(href))
              .filter((item): item is (typeof items)[number] => Boolean(item));

            if (sectionItems.length === 0) return null;

            return (
              <div key={section.label} className="app-shell-nav-section">
                <p className="app-shell-nav-label">{section.label}</p>
                <div className="space-y-0.5">{sectionItems.map(renderNavLink)}</div>
              </div>
            );
          })}
        </nav>
      </div>

      <div className="app-shell-sidebar-footer">
        <div className="app-shell-user-card">
          <span className="app-shell-user-avatar" aria-hidden>
            {initials || "U"}
          </span>
          <div className="app-shell-user-meta">
            <p className="truncate text-sm font-semibold text-[var(--brand-navy)]">{user.name}</p>
            <p className="truncate text-xs text-[var(--dash-text-muted)]">{user.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start rounded-xl text-sm text-slate-600 hover:bg-red-50 hover:text-red-600"
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
  const isEmpresa = isEmpresaPortalRole(user.role);

  return (
    <>
      <aside
        className={cn(
          "app-shell-sidebar hidden lg:block",
          isEmpresa && "app-shell-sidebar--empresa"
        )}
      >
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
          <SheetContent side="left" className="w-[var(--dash-sidebar-w)] p-0">
            <NavContent user={user} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
