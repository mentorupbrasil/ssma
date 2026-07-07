import {
  Building2,
  Calendar,
  FileText,
  LayoutDashboard,
  Monitor,
} from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { cn } from "@/lib/utils";

const HERO_STATS = [
  { label: "Encaminhamentos novos", value: "12", icon: FileText },
  { label: "Exames hoje", value: "8", icon: Calendar },
  { label: "Empresas ativas", value: "24", icon: Building2 },
] as const;

const HERO_REFERRALS = [
  { protocol: "UNI-2026-000048", patient: "Carlos E. Santos", company: "Alfa Indústria", status: "NOVO" as const },
  { protocol: "UNI-2026-000047", patient: "Fernanda L. Oliveira", company: "Beta Comércio", status: "EM_ANALISE" as const },
  { protocol: "UNI-2026-000046", patient: "Roberto M. Silva", company: "Alfa Indústria", status: "AGENDADO" as const },
  { protocol: "UNI-2026-000045", patient: "Ana P. Costa", company: "Gama Transportes", status: "CONCLUIDO" as const },
];

type HeroPortalMockupProps = {
  variant?: "hero" | "inline";
  className?: string;
};

export function HeroPortalMockup({ variant = "hero", className }: HeroPortalMockupProps) {
  const isHero = variant === "hero";
  const isInline = variant === "inline";
  const referrals = isInline ? HERO_REFERRALS.slice(0, 3) : HERO_REFERRALS;

  return (
    <div className={cn("relative w-full", className)}>
      {isHero && (
        <div
          className="pointer-events-none absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-[var(--brand-green)]/25 via-emerald-400/10 to-transparent blur-2xl sm:-inset-4"
          aria-hidden
        />
      )}

      {isInline && (
        <div
          className="pointer-events-none absolute -inset-2 rounded-[1.25rem] bg-gradient-to-br from-[var(--brand-green)]/8 to-transparent"
          aria-hidden
        />
      )}

      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-white",
          isHero
            ? "border-white/20 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.35)] ring-1 ring-white/10"
            : "border-slate-200/90 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12)]"
        )}
      >
        {/* Title bar */}
        <div
          className={cn(
            "flex items-center gap-2.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white",
            isInline ? "px-3.5 py-2.5 sm:px-4" : "px-4 py-3 sm:px-5"
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-navy)] text-white shadow-sm">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[var(--brand-navy)]">Portal Empresarial</p>
            <p className="truncate text-[0.65rem] font-medium text-slate-500 sm:text-xs">
              Gestão de encaminhamentos e exames
            </p>
          </div>
          <div className="hidden items-center gap-1.5 sm:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
          </div>
          <Monitor className="h-4 w-4 text-slate-400 sm:hidden" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-3">
          {HERO_STATS.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "flex items-center gap-3 bg-white sm:flex-col sm:items-start",
                isInline ? "px-3.5 py-3 sm:px-4" : "px-4 py-4 sm:px-5 sm:py-5"
              )}
            >
              <div
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-xl bg-[var(--brand-green-light)]",
                  isInline ? "h-8 w-8" : "h-10 w-10"
                )}
              >
                <stat.icon className={cn("text-[var(--brand-green)]", isInline ? "h-4 w-4" : "h-5 w-5")} />
              </div>
              <div className="min-w-0 sm:mt-1">
                <p
                  className={cn(
                    "font-bold leading-none text-[var(--brand-navy)]",
                    isInline ? "text-xl sm:text-2xl" : "text-2xl sm:text-[1.65rem]"
                  )}
                >
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[0.68rem] font-medium leading-snug text-slate-500 sm:text-xs">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Referrals */}
        <div className={cn("border-t border-slate-100 bg-slate-50/40", isInline ? "p-3.5 sm:p-4" : "p-4 sm:p-5")}>
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">
              Encaminhamentos recentes
            </p>
            <span className="rounded-full bg-[var(--brand-green-light)] px-2 py-0.5 text-[0.6rem] font-semibold text-[var(--brand-navy)] sm:text-[0.65rem]">
              Ao vivo
            </span>
          </div>
          <ul className="space-y-1.5">
            {referrals.map((r) => (
              <li
                key={r.protocol}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border border-slate-100 bg-white shadow-sm sm:flex-row sm:items-center sm:justify-between",
                  isInline ? "px-3 py-2.5 sm:px-3.5" : "px-3 py-3 sm:px-4"
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[var(--brand-navy)] sm:text-sm">
                    {r.protocol}
                  </p>
                  <p className="truncate text-[0.7rem] text-slate-600 sm:text-xs">
                    {r.patient}
                  </p>
                  <p className="truncate text-[0.65rem] text-slate-400">{r.company}</p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
