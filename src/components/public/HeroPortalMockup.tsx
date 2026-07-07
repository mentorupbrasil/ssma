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

  return (
    <div className={cn("relative w-full", className)}>
      {isHero && (
        <div
          className="pointer-events-none absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-[var(--brand-green)]/25 via-emerald-400/10 to-transparent blur-2xl sm:-inset-4"
          aria-hidden
        />
      )}

      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-white shadow-[0_24px_64px_-12px_rgba(0,0,0,0.35)]",
          isHero ? "border-white/20 ring-1 ring-white/10" : "border-slate-200/80"
        )}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3 sm:px-5">
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
              className="flex items-center gap-3 bg-white px-4 py-4 sm:flex-col sm:items-start sm:px-5 sm:py-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-green-light)]">
                <stat.icon className="h-5 w-5 text-[var(--brand-green)]" />
              </div>
              <div className="min-w-0 sm:mt-1">
                <p className="text-2xl font-bold leading-none text-[var(--brand-navy)] sm:text-[1.65rem]">
                  {stat.value}
                </p>
                <p className="mt-1 text-[0.7rem] font-medium leading-snug text-slate-500 sm:text-xs">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Referrals */}
        <div className="border-t border-slate-100 bg-slate-50/40 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Encaminhamentos recentes
            </p>
            <span className="rounded-full bg-[var(--brand-green-light)] px-2.5 py-0.5 text-[0.65rem] font-semibold text-[var(--brand-navy)]">
              Ao vivo
            </span>
          </div>
          <ul className="space-y-2">
            {HERO_REFERRALS.map((r) => (
              <li
                key={r.protocol}
                className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-white px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-4"
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
