import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className={cn("premium-card border-slate-200/80 shadow-[var(--shadow-soft)]", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
        <CardTitle className="text-sm font-medium leading-snug text-slate-600">{title}</CardTitle>
        <div className="rounded-xl bg-[var(--brand-green-light)] p-2.5">
          <Icon className="h-4 w-4 text-[var(--brand-green)]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight text-[var(--brand-navy)]">{value}</div>
        {description && <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{description}</p>}
        {trend && <p className="mt-2 text-xs font-semibold text-[var(--brand-green)]">{trend}</p>}
      </CardContent>
    </Card>
  );
}
