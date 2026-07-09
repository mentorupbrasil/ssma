import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopbarBreadcrumb } from "@/components/dashboard/TopbarBreadcrumb";
import { TopbarSearch, TopbarNotifications } from "@/components/dashboard/TopbarActions";

type TopbarProps = {
  userName: string;
};

function userInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Topbar({ userName }: TopbarProps) {
  const initials = userInitials(userName);

  return (
    <header className="app-shell-topbar">
      <div className="app-shell-topbar-inner">
        <div className="app-shell-topbar-leading">
          <TopbarBreadcrumb />
          <TopbarSearch />
        </div>

        <div className="app-shell-topbar-trailing">
          <Link href="/" target="_blank">
            <Button variant="ghost" size="sm" className="topbar-site-link">
              <ExternalLink className="mr-2 h-4 w-4" strokeWidth={2} />
              Ver site
            </Button>
          </Link>
          <TopbarNotifications />
          <div className="topbar-user-chip hidden sm:flex">
            <span className="topbar-user-avatar" aria-hidden>
              {initials || "U"}
            </span>
            <span className="max-w-[9rem] truncate text-sm font-semibold text-[var(--brand-navy)]">
              {userName}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
