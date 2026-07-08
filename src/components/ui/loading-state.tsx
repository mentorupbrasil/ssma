import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  className?: string;
  overlay?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function LoadingState({
  label = "Carregando...",
  className,
  overlay = false,
  size = "md",
}: LoadingStateProps) {
  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-3 text-center", className)}>
      <Loader2
        className={cn("animate-spin text-[var(--brand-green)]", sizeMap[size])}
        aria-hidden
      />
      {label ? <p className="text-sm text-slate-500">{label}</p> : null}
    </div>
  );

  if (overlay) {
    return (
      <div
        className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-[1px]"
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        {content}
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" aria-label={label}>
      {content}
    </div>
  );
}
