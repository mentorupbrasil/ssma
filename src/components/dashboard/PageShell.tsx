import { cn } from "@/lib/utils";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  /** Largura ampla para tabelas; padrão para formulários */
  width?: "default" | "wide" | "narrow";
};

const WIDTH_CLASS = {
  default: "max-w-[88rem]",
  wide: "max-w-[96rem]",
  narrow: "max-w-4xl",
};

export function PageShell({ children, className, width = "default" }: PageShellProps) {
  return (
    <div className={cn("page-stack mx-auto w-full", WIDTH_CLASS[width], className)}>{children}</div>
  );
}
