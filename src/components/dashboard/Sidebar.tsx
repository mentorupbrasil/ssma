"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Calendar,
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
} from "lucide-react";
import { signOut } from "next-auth/react";
import type { UserRole } from "@/types/roles";
import { DASHBOARD_NAV, hasPermission } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FileText,
  Calendar,
  Building2,
  Users,
  Stethoscope,
  DollarSign,
  FolderOpen,
  UserCog,
  Settings,
  Shield,
};

type SidebarProps = {
  user: { name: string; email: string; role: UserRole };
};

function NavContent({ user, onNavigate }: { user: SidebarProps["user"]; onNavigate?: () => void }) {
  const pathname = usePathname();

  const items = DASHBOARD_NAV.filter((item) =>
    hasPermission(user.role, item.permission)
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 p-4">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F3D4A] text-sm font-bold text-white">
            U
          </div>
          <div>
            <p className="text-sm font-bold text-[#0F3D4A]">Painel</p>
            <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-[#DFF7F0] text-[#0F3D4A]"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 px-3 text-xs text-slate-500 truncate">{user.email}</div>
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-600"
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
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <NavContent user={user} />
      </aside>

      <div className="fixed bottom-4 left-4 z-40 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button size="icon" className="h-12 w-12 rounded-full bg-[#0F3D4A] shadow-lg">
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
