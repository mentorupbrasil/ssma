import {
  Building2,
  Calendar,
  FileCheck,
  Paperclip,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PORTAL_STATS = [
  { label: "Encaminhamentos ativos", value: "5", icon: Users },
  { label: "Exames agendados", value: "2", icon: Calendar },
  { label: "ASOs disponíveis", value: "1", icon: FileCheck },
] as const;

const PORTAL_COLLABORATORS = [
  {
    id: "1",
    name: "Maria Silva",
    initials: "MS",
    exam: "ASO Admissional",
    detail: "Encaminhado em 05/03",
    status: "Aguardando agendamento",
    statusTone: "amber" as const,
    document: false,
  },
  {
    id: "2",
    name: "João Oliveira",
    initials: "JO",
    exam: "ASO Periódico",
    detail: "Agendado para 14/03 · 08h30",
    status: "Agendado",
    statusTone: "violet" as const,
    document: false,
  },
  {
    id: "3",
    name: "Ana Costa",
    initials: "AC",
    exam: "Retorno ao trabalho",
    detail: "Exame realizado em 10/03",
    status: "ASO disponível",
    statusTone: "emerald" as const,
    document: true,
  },
] as const;

const DEMO_STATS = [
  { label: "Encaminhamentos", icon: Users },
  { label: "Exames agendados", icon: Calendar },
  { label: "Documentos", icon: FileCheck },
] as const;

const DEMO_COLLABORATORS = [
  {
    id: "1",
    name: "Colaborador 01",
    initials: "01",
    exam: "ASO Admissional",
    detail: "Encaminhamento registrado",
    status: "Em análise",
    statusTone: "amber" as const,
    document: false,
  },
  {
    id: "2",
    name: "Colaborador 02",
    initials: "02",
    exam: "ASO Periódico",
    detail: "Agendamento confirmado",
    status: "Agendado",
    statusTone: "violet" as const,
    document: false,
  },
  {
    id: "3",
    name: "Colaborador 03",
    initials: "03",
    exam: "Retorno ao trabalho",
    detail: "Atendimento concluído",
    status: "Concluído",
    statusTone: "emerald" as const,
    document: true,
  },
] as const;

const STATUS_TONE_CLASS = {
  amber: "portal-mockup-status portal-mockup-status--amber",
  violet: "portal-mockup-status portal-mockup-status--violet",
  emerald: "portal-mockup-status portal-mockup-status--emerald",
} as const;

const AVATAR_TONE_CLASS = [
  "portal-mockup-avatar portal-mockup-avatar--navy",
  "portal-mockup-avatar portal-mockup-avatar--green",
  "portal-mockup-avatar portal-mockup-avatar--slate",
] as const;

type HeroPortalMockupProps = {
  variant?: "hero" | "inline";
  demoMode?: boolean;
  className?: string;
};

export function HeroPortalMockup({
  variant = "inline",
  demoMode = false,
  className,
}: HeroPortalMockupProps) {
  const isInline = variant === "inline";
  const stats = demoMode ? DEMO_STATS : PORTAL_STATS;
  const collaborators = demoMode ? DEMO_COLLABORATORS : PORTAL_COLLABORATORS;

  return (
    <div className={cn("portal-mockup-wrap relative w-full", className)}>
      {demoMode && (
        <span className="portal-mockup-demo-badge" aria-hidden>
          Demonstração
        </span>
      )}

      <div
        className="pointer-events-none absolute -inset-2 rounded-[1.25rem] bg-gradient-to-br from-[var(--brand-green)]/8 to-transparent"
        aria-hidden
      />

      <div
        className={cn(
          "portal-mockup-shell relative overflow-hidden bg-white",
          demoMode ? "portal-mockup-shell--demo" : "rounded-2xl border border-slate-200/90 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12)]",
          !isInline && !demoMode && "shadow-[0_24px_64px_-12px_rgba(0,0,0,0.2)]"
        )}
        aria-hidden={demoMode}
      >
        <div className="portal-mockup-header flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-3.5 py-2.5 sm:px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-navy)] text-white shadow-sm">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[var(--brand-navy)]">Portal Empresarial</p>
            <p className="truncate text-[0.68rem] font-medium text-slate-600 sm:text-xs">
              {demoMode ? "Área do RH · Empresa cliente" : "Área do RH · Alfa Indústria Ltda."}
            </p>
          </div>
          {!demoMode && (
            <span className="rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[0.6rem] font-semibold text-emerald-800 sm:text-[0.65rem]">
              Área do RH
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-px bg-slate-100">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={cn(
                  "flex flex-col bg-white px-3 py-3 sm:px-3.5",
                  demoMode ? "items-center gap-1.5 text-center" : "items-start gap-1.5"
                )}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand-green-light)]">
                  <Icon className="h-3.5 w-3.5 text-[var(--brand-green)]" />
                </div>
                {!demoMode && "value" in stat && (
                  <p className="text-lg font-bold leading-none text-[var(--brand-navy)] sm:text-xl">
                    {stat.value}
                  </p>
                )}
                <p className="text-[0.62rem] font-semibold leading-tight text-slate-600 sm:text-[0.68rem]">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-100 bg-slate-50/50 p-3.5 sm:p-4">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-slate-600 sm:text-xs">
              Colaboradores encaminhados
            </p>
            <span className="text-[0.62rem] font-medium text-slate-500 sm:text-[0.65rem]">
              Histórico e documentos
            </span>
          </div>

          <ul className="space-y-2">
            {collaborators.map((item, index) => (
              <li
                key={item.id}
                className={cn(
                  "portal-mockup-row rounded-xl border bg-white p-2.5 sm:p-3",
                  item.document
                    ? "border-emerald-200/80 ring-1 ring-emerald-100/80"
                    : "border-slate-100"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className={cn(AVATAR_TONE_CLASS[index % AVATAR_TONE_CLASS.length])}>
                    {item.initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                      <p className="text-sm font-semibold text-[var(--brand-navy)]">{item.name}</p>
                      <span className={STATUS_TONE_CLASS[item.statusTone]}>{item.status}</span>
                    </div>

                    <p className="mt-0.5 text-xs font-medium text-[var(--brand-green)]">{item.exam}</p>
                    <p className="mt-0.5 text-[0.68rem] text-slate-600 sm:text-xs">{item.detail}</p>

                    {item.document && (
                      <div className="portal-mockup-doc-badge mt-2 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/70 bg-emerald-50/80 px-2 py-1 text-[0.65rem] font-semibold text-emerald-800">
                        <Paperclip className="h-3 w-3" />
                        {demoMode ? "Documento disponível para consulta" : "ASO anexado · disponível para download"}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
