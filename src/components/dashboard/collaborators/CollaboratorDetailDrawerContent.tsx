import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CollaboratorDetailSerialized } from "@/lib/collaborators";
import { getPeriodicExamBadge } from "@/lib/collaborators";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { maskCpf } from "@/lib/referrals";
import { cn } from "@/lib/utils";

type CollaboratorDetailDrawerContentProps = {
  collaborator: CollaboratorDetailSerialized;
};

export function CollaboratorDetailDrawerContent({
  collaborator,
}: CollaboratorDetailDrawerContentProps) {
  const periodic = getPeriodicExamBadge(collaborator.nextPeriodicDate);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={collaborator.status} type="collaborator" />
        <Badge
          variant="outline"
          className={cn(
            "rounded-full text-[0.625rem] font-semibold",
            periodic.tone === "danger" && "border-red-200 bg-red-50 text-red-800",
            periodic.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-800",
            periodic.tone === "ok" && "border-emerald-200 bg-emerald-50 text-emerald-800",
            periodic.tone === "neutral" && "border-slate-200 bg-slate-50 text-slate-600"
          )}
        >
          {periodic.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Enc. abertos", value: collaborator.stats.openReferrals },
          { label: "Agendamentos", value: collaborator.stats.upcomingAppointments },
          { label: "Documentos", value: collaborator.stats.availableDocuments },
          { label: "Exames pend.", value: collaborator.stats.pendingExams },
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
          <dt className="text-[var(--dash-text-muted)]">CPF</dt>
          <dd>{maskCpf(collaborator.cpf)}</dd>
        </div>
        {collaborator.company && (
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
            <dt className="text-[var(--dash-text-muted)]">Empresa</dt>
            <dd className="text-right font-medium">
              {collaborator.company.tradeName ?? collaborator.company.legalName}
            </dd>
          </div>
        )}
        {collaborator.jobTitle && (
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
            <dt className="text-[var(--dash-text-muted)]">Função</dt>
            <dd>{collaborator.jobTitle}</dd>
          </div>
        )}
        {collaborator.stats.lastExamLabel && (
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
            <dt className="text-[var(--dash-text-muted)]">Último exame</dt>
            <dd className="text-right">{collaborator.stats.lastExamLabel}</dd>
          </div>
        )}
        {collaborator.nextPeriodicDate && (
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--dash-text-muted)]">Próx. periódico</dt>
            <dd>{format(new Date(collaborator.nextPeriodicDate), "dd/MM/yyyy", { locale: ptBR })}</dd>
          </div>
        )}
      </dl>

      <Link
        href={`/dashboard/colaboradores/${collaborator.id}`}
        className={buttonVariants({ variant: "brand", className: "w-full" })}
      >
        Abrir ficha completa
      </Link>
    </div>
  );
}
