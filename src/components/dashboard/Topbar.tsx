import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopbarBreadcrumb } from "@/components/dashboard/TopbarBreadcrumb";
import { TopbarSearch, TopbarNotifications } from "@/components/dashboard/TopbarActions";

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
          <TopbarSearch />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link href="/" target="_blank">
            <Button variant="ghost" size="sm" className="hidden rounded-xl text-slate-600 sm:flex">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver site
            </Button>
          </Link>
          <TopbarNotifications />
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
