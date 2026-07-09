import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CompanyDetailSerialized } from "@/lib/companies";
import {
  COMPANY_SIZE_LABELS,
  COMPANY_CONTRACT_LABELS,
} from "@/lib/companies";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatCNPJ, formatPhone } from "@/lib/helpers";

type CompanyDetailDrawerContentProps = {
  company: CompanyDetailSerialized;
};

export function CompanyDetailDrawerContent({ company }: CompanyDetailDrawerContentProps) {
  const name = company.tradeName ?? company.legalName;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={company.status} type="company" />
        {company.contractType && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-slate-600">
            {COMPANY_CONTRACT_LABELS[company.contractType]}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Colaboradores", value: company.stats.employees },
          { label: "Enc. abertos", value: company.stats.openReferrals },
          { label: "Agendamentos", value: company.stats.upcomingAppointments },
          { label: "Docs pendentes", value: company.stats.pendingDocuments },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[var(--dash-border)] bg-slate-50/60 px-3 py-2.5">
            <p className="text-[0.625rem] font-bold uppercase tracking-wide text-[var(--dash-text-subtle)]">
              {s.label}
            </p>
            <p className="mt-0.5 text-lg font-bold text-[var(--brand-navy)]">{s.value}</p>
          </div>
        ))}
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
          <dt className="text-[var(--dash-text-muted)]">CNPJ</dt>
          <dd className="font-medium text-[var(--brand-navy)]">{formatCNPJ(company.cnpj)}</dd>
        </div>
        {company.responsibleName && (
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
            <dt className="text-[var(--dash-text-muted)]">Responsável</dt>
            <dd className="text-right font-medium">{company.responsibleName}</dd>
          </div>
        )}
        {company.phone && (
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
            <dt className="text-[var(--dash-text-muted)]">Telefone</dt>
            <dd>{formatPhone(company.phone)}</dd>
          </div>
        )}
        {company.city && (
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
            <dt className="text-[var(--dash-text-muted)]">Cidade</dt>
            <dd>{company.city}{company.state ? ` / ${company.state}` : ""}</dd>
          </div>
        )}
        {company.size && (
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
            <dt className="text-[var(--dash-text-muted)]">Porte</dt>
            <dd>{COMPANY_SIZE_LABELS[company.size]}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--dash-text-muted)]">Cadastro</dt>
          <dd>{format(new Date(company.createdAt), "dd/MM/yyyy", { locale: ptBR })}</dd>
        </div>
      </dl>

      <Link
        href={`/dashboard/empresas/${company.id}`}
        className={buttonVariants({ variant: "brand", className: "w-full" })}
      >
        Abrir ficha completa
      </Link>
    </div>
  );
}
