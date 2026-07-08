import Link from "next/link";
import { Bell, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TopbarBreadcrumb } from "@/components/dashboard/TopbarBreadcrumb";

type TopbarProps = {
  userName: string;
};

export function Topbar({ userName }: TopbarProps) {
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="app-shell-topbar">
      <div className="app-shell-topbar-inner">
        <div className="min-w-0 flex-1">
          <TopbarBreadcrumb />
          <div className="relative mt-3 hidden max-w-lg md:block">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar encaminhamentos, empresas, colaboradores..."
              className="h-10 rounded-xl border-slate-200/90 bg-white pl-10 shadow-none focus:bg-white"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link href="/" target="_blank">
            <Button variant="ghost" size="sm" className="hidden rounded-xl text-slate-600 sm:flex">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver site
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="rounded-xl border border-transparent hover:border-slate-200 hover:bg-white">
            <Bell className="h-4 w-4 text-slate-600" />
          </Button>
          <div className="topbar-user-chip hidden sm:flex">
            <span className="topbar-user-avatar" aria-hidden>
              {initials || "U"}
            </span>
            <span className="max-w-[10rem] truncate text-sm font-medium text-slate-700">{userName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
