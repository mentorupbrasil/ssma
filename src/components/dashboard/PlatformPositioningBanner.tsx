import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

type PlatformPositioningBannerProps = {
  className?: string;
  compact?: boolean;
};

export function PlatformPositioningBanner({ className, compact }: PlatformPositioningBannerProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-[var(--brand-green)]/20 bg-gradient-to-r from-emerald-50/80 to-slate-50/80 text-sm leading-relaxed text-slate-700",
        compact ? "px-4 py-3" : "px-5 py-4",
        className
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-green)]" aria-hidden />
      <p>
        <strong className="font-semibold text-[var(--brand-navy)]">Plataforma complementar:</strong>{" "}
        organiza portal empresarial, documentos, fechamentos, orçamentos e operações —{" "}
        <span className="text-slate-600">não substitui o sistema clínico de atendimento da clínica.</span>
      </p>
    </div>
  );
}
