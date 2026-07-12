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
  Calculator,
  Wallet,
  CheckSquare,
  LifeBuoy,
  Sparkles,
  CalendarDays,
  Newspaper,
  Tags,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useId, useState } from "react";
import type { UserRole } from "@/types/roles";
import { DASHBOARD_NAV, hasPermission, getRoleLabel, type RolePermissionMap } from "@/lib/permissions";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const ICONS: Record<string, LucideIcon> = {
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

const SISTEMA_HREFS = [
  "/dashboard/usuarios",
  "/dashboard/configuracoes",
  "/dashboard/conteudo",
  "/dashboard/auditoria",
] as const;

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
      "/dashboard/encaminhamentos",
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
] as const;

type NavItem = (typeof DASHBOARD_NAV)[number];

type SidebarProps = {
  user: { name: string; email: string; role: UserRole };
  permissionOverrides?: RolePermissionMap | null;
};

function userInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function isNavActive(pathname: string, href: string, isEmpresa: boolean) {
  if (isEmpresa && href === "/dashboard/encaminhamentos") {
    return (
      pathname.startsWith("/dashboard/encaminhamentos") ||
      pathname.startsWith("/dashboard/agenda")
    );
  }
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

function NavLink({
  item,
  pathname,
  isEmpresa,
  onNavigate,
  sub,
}: {
  item: NavItem;
  pathname: string;
  isEmpresa: boolean;
  onNavigate?: () => void;
  sub?: boolean;
}) {
  const iconName =
    isEmpresa && EMPRESA_NAV_ICON_OVERRIDES[item.href]
      ? EMPRESA_NAV_ICON_OVERRIDES[item.href]
      : item.icon;
  const Icon = ICONS[iconName] ?? LayoutDashboard;
  const active = isNavActive(pathname, item.href, isEmpresa);
  const label =
    isEmpresa && EMPRESA_NAV_LABEL_OVERRIDES[item.href]
      ? EMPRESA_NAV_LABEL_OVERRIDES[item.href]
      : item.label;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "app-shell-nav-link",
        sub && "app-shell-nav-link--sub",
        active && "app-shell-nav-link-active"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={cn("app-shell-nav-icon", sub && "app-shell-nav-icon--sub")} aria-hidden />
      <span className="app-shell-nav-text truncate">{label}</span>
    </Link>
  );
}

function NavContent({
  user,
  permissionOverrides,
  onNavigate,
}: {
  user: SidebarProps["user"];
  permissionOverrides?: RolePermissionMap | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isEmpresa = isEmpresaPortalRole(user.role);
  const sistemaPanelId = useId();
  const initials = userInitials(user.name);

  const items = DASHBOARD_NAV.filter((item) => {
    if (!hasPermission(user.role, item.permission, permissionOverrides)) return false;
    if (isEmpresa) {
      if (!EMPRESA_NAV_HREFS.includes(item.href)) return false;
      if (EMPRESA_HIDDEN_NAV_HREFS.includes(item.href)) return false;
    }
    return true;
  });
  const itemByHref = new Map(items.map((item) => [item.href, item]));
  const navSections = isEmpresa ? EMPRESA_NAV_SECTIONS : NAV_SECTIONS;

  const sistemaItems = SISTEMA_HREFS.map((href) => itemByHref.get(href)).filter(
    (item): item is NavItem => Boolean(item)
  );
  const sistemaChildActive = sistemaItems.some((item) =>
    isNavActive(pathname, item.href, false)
  );

  const [sistemaOpen, setSistemaOpen] = useState(sistemaChildActive);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (sistemaChildActive) setSistemaOpen(true);
  }, [sistemaChildActive]);

  return (
    <div className={cn("app-shell-sidebar-inner", isEmpresa && "app-shell-sidebar-inner--empresa")}>
      <div className="app-shell-sidebar-brand">
        <Link href="/dashboard" onClick={onNavigate} className="app-shell-sidebar-brand-link">
          <BrandLogo height={26} showLink={false} className="app-shell-sidebar-logo" />
          <div className="app-shell-sidebar-brand-copy">
            <p className="app-shell-sidebar-brand-title">Unimetra · Painel</p>
            <p className="app-shell-sidebar-brand-role">{getRoleLabel(user.role)}</p>
          </div>
        </Link>
      </div>

      <nav className={cn("app-shell-nav", isEmpresa && "app-shell-nav--empresa")} aria-label="Menu principal">
        {navSections.map((section) => {
          const sectionItems = section.hrefs
            .map((href) => itemByHref.get(href))
            .filter((item): item is NavItem => Boolean(item));

          if (sectionItems.length === 0) return null;

          return (
            <div key={section.label} className="app-shell-nav-section">
              <p className="app-shell-nav-label">{section.label}</p>
              <div className="app-shell-nav-list">
                {sectionItems.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    isEmpresa={isEmpresa}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {!isEmpresa && sistemaItems.length > 0 && (
          <div className="app-shell-nav-section app-shell-nav-section--sistema">
            <button
              type="button"
              className={cn(
                "app-shell-nav-link app-shell-nav-link--group",
                sistemaChildActive && "app-shell-nav-link-active"
              )}
              aria-expanded={sistemaOpen}
              aria-controls={sistemaPanelId}
              onClick={() => setSistemaOpen((open) => !open)}
            >
              <Settings className="app-shell-nav-icon" aria-hidden />
              <span className="app-shell-nav-text truncate">Sistema</span>
              {sistemaOpen ? (
                <ChevronUp className="app-shell-nav-chevron" aria-hidden />
              ) : (
                <ChevronDown className="app-shell-nav-chevron" aria-hidden />
              )}
            </button>

            <div
              id={sistemaPanelId}
              className={cn("app-shell-nav-submenu", sistemaOpen && "app-shell-nav-submenu--open")}
              aria-hidden={!sistemaOpen}
            >
              <div className="app-shell-nav-submenu-inner" role="group" aria-label="Sistema">
                {sistemaItems.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    isEmpresa={false}
                    onNavigate={onNavigate}
                    sub
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="app-shell-sidebar-footer">
        <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                className="app-shell-user-card"
                aria-label="Menu do usuário"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <span className="app-shell-user-avatar" aria-hidden>
                  {initials || "U"}
                </span>
                <span className="app-shell-user-meta">
                  <span className="app-shell-user-name truncate">{user.name}</span>
                  <span className="app-shell-user-email truncate">{user.email}</span>
                </span>
                <ChevronUp
                  className={cn(
                    "app-shell-user-chevron",
                    !userMenuOpen && "app-shell-user-chevron--down"
                  )}
                  aria-hidden
                />
              </button>
            }
          />
          <PopoverContent
            className="app-shell-user-menu w-52 p-1.5"
            align="start"
            side="top"
            sideOffset={8}
          >
            <button
              type="button"
              className="app-shell-user-menu-item app-shell-user-menu-item--danger"
              onClick={() => {
                setUserMenuOpen(false);
                void signOut({ callbackUrl: "/" });
              }}
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              Sair
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export function Sidebar({ user, permissionOverrides }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const isEmpresa = isEmpresaPortalRole(user.role);

  return (
    <>
      <aside
        className={cn(
          "app-shell-sidebar hidden md:flex",
          isEmpresa && "app-shell-sidebar--empresa"
        )}
      >
        <NavContent user={user} permissionOverrides={permissionOverrides} />
      </aside>

      <div className="app-shell-mobile-trigger md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                size="icon"
                variant="navy"
                className="h-12 w-12 rounded-xl shadow-[var(--shadow-elevated)]"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            }
          />
          <SheetContent
            side="left"
            className="app-shell-sidebar-sheet w-[var(--dash-sidebar-w)] max-w-[85vw] p-0"
          >
            <NavContent
              user={user}
              permissionOverrides={permissionOverrides}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
