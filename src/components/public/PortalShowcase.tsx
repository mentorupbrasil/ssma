import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Monitor,
} from "lucide-react";
import { SectionTitle } from "@/components/public/SectionTitle";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

const MOCK_REFERRALS = [
  { protocol: "UNI-2026-000042", patient: "Carlos E.", status: "EM_ANALISE" as const },
  { protocol: "UNI-2026-000041", patient: "Fernanda L.", status: "AGENDADO" as const },
  { protocol: "UNI-2026-000040", patient: "Roberto M.", status: "NOVO" as const },
];

export function PortalShowcase() {
  return (
    <section className="section-padding overflow-hidden">
      <div className="container-page">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionTitle
              eyebrow="Diferencial digital"
              title="Portal empresarial que funciona de verdade"
              description="Encaminhe colaboradores, acompanhe status em tempo real e organize documentos — sem depender de planilhas e ligações."
              align="left"
              className="mb-8"
            />

            <ul className="space-y-4">
              {[
                "Encaminhamento online com protocolo automático",
                "Acompanhamento de status por colaborador",
                "Histórico de exames e documentos",
                "Acesso exclusivo para o RH da empresa",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-green)]" />
                  <span className="text-sm leading-relaxed sm:text-base">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/empresas">
                <Button variant="brand" className="rounded-xl">
                  Conhecer o portal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="rounded-xl">
                  Acessar painel
                </Button>
              </Link>
            </div>
          </div>

          {/* Mock visual do dashboard — não precisa de foto */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[var(--brand-green)]/20 to-[var(--brand-navy)]/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-elevated)]">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                <Monitor className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-600">Portal Empresarial</span>
                <div className="ml-auto flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-px bg-slate-100 p-px">
                {[
                  { label: "Novos", value: "12", icon: FileText },
                  { label: "Hoje", value: "8", icon: Calendar },
                  { label: "Painel", value: "Live", icon: LayoutDashboard },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white p-4 text-center">
                    <stat.icon className="mx-auto mb-2 h-4 w-4 text-[var(--brand-green)]" />
                    <p className="text-xl font-bold text-[var(--brand-navy)]">{stat.value}</p>
                    <p className="text-[0.65rem] font-medium uppercase tracking-wide text-slate-500">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Encaminhamentos recentes
                </p>
                <div className="space-y-2">
                  {MOCK_REFERRALS.map((r) => (
                    <div
                      key={r.protocol}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5"
                    >
                      <div>
                        <p className="text-xs font-semibold text-[var(--brand-navy)]">
                          {r.protocol}
                        </p>
                        <p className="text-[0.7rem] text-slate-500">{r.patient}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
