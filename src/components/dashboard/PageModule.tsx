import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageModuleProps = {
  children: ReactNode;
  className?: string;
};

/** Wrapper padrão de módulos do dashboard — ritmo vertical consistente */
export function PageModule({ children, className }: PageModuleProps) {
  return <div className={cn("dash-module", className)}>{children}</div>;
}
