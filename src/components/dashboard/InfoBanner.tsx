import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

type InfoBannerProps = {
  title?: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
};

export function InfoBanner({ title, children, icon: Icon = Info, className }: InfoBannerProps) {
  return (
    <div className={cn("info-banner", className)} role="note">
      <div className="info-banner-icon">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        {title && <p className="info-banner-title">{title}</p>}
        <div className={cn("info-banner-text", !title && "mt-0")}>{children}</div>
      </div>
    </div>
  );
}
