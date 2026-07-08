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
} from "lucide-react";
import { signOut } from "next-auth/react";
import type { UserRole } from "@/types/roles";
import { DASHBOARD_NAV, hasPermission, getRoleLabel } from "@/lib/permissions";
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
};

type SidebarProps = {
  user: { name: string; email: string; role: UserRole };
};

function NavContent({ user, onNavigate }: { user: SidebarProps["user"]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = DASHBOARD_NAV.filter((item) => hasPermission(user.role, item.permission));

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-100 p-5">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-navy)] text-sm font-bold text-white shadow-sm">
            U
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--brand-navy)]">Painel</p>
            <p className="text-xs font-medium text-slate-500">{getRoleLabel(user.role)}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-[var(--brand-green-light)] text-[var(--brand-navy)] shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[var(--brand-navy)]"
              )}
            >
              <Icon className={cn("h-4 w-4", active && "text-[var(--brand-green)]")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2">
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
      <aside className="hidden w-[17.5rem] shrink-0 border-r border-slate-200/80 bg-white lg:block">
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
