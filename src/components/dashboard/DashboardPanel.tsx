import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardPanelProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function DashboardPanel({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
}: DashboardPanelProps) {
  return (
    <section className={cn("dashboard-panel", className)}>
      <header className="dashboard-panel-header">
        <div className="min-w-0">
          <h2 className="dashboard-panel-title">
            {Icon ? <Icon className="h-4 w-4 shrink-0 text-[var(--brand-green)]" aria-hidden /> : null}
            {title}
          </h2>
          {description ? <p className="dashboard-panel-desc">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="dashboard-panel-body">{children}</div>
    </section>
  );
}
