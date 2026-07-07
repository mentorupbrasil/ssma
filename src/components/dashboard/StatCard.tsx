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
    <Card className={cn("border-slate-200 shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <div className="rounded-lg bg-[#DFF7F0] p-2">
          <Icon className="h-4 w-4 text-[#16A085]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#0F3D4A]">{value}</div>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
        {trend && <p className="mt-1 text-xs font-medium text-[#16A085]">{trend}</p>}
      </CardContent>
    </Card>
  );
}
