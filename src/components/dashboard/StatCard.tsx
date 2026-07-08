import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: string;
  className?: string;
};

export function StatCard({ title, value, description, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("stat-card-shell", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <div className="mt-2 text-3xl font-bold tracking-tight text-[var(--brand-navy)]">{value}</div>
            {description && (
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{description}</p>
            )}
            {trend && <p className="mt-2 text-xs font-semibold text-[var(--brand-green)]">{trend}</p>}
          </div>
          <div className="stat-card-icon">
            <Icon className="h-4 w-4 text-[var(--brand-green)]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
