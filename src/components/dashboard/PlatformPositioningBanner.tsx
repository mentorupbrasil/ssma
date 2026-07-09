import { InfoBanner } from "@/components/dashboard/InfoBanner";
import { cn } from "@/lib/utils";

type PlatformPositioningBannerProps = {
  className?: string;
  compact?: boolean;
};

export function PlatformPositioningBanner({ className, compact }: PlatformPositioningBannerProps) {
  return (
    <InfoBanner
      title={compact ? undefined : "Plataforma complementar"}
      className={cn(compact && "py-3", className)}
    >
      <strong className="font-semibold text-[var(--brand-navy)]">Plataforma complementar:</strong>{" "}
      organiza portal empresarial, documentos, fechamentos, orçamentos e operações —{" "}
      <span className="text-[var(--dash-text-muted)]">
        não substitui o sistema clínico de atendimento da clínica.
      </span>
    </InfoBanner>
  );
}
