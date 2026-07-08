"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ExamDetailSerialized } from "@/lib/exams";
import {
  EXAM_CATEGORY_LABELS,
  EXAM_PREPARATION_LABELS,
  EXAM_DEADLINE_TYPE_LABELS,
  EXAM_HISTORY_ACTION_LABELS,
} from "@/lib/exams";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ExamDetailContentProps = {
  exam: ExamDetailSerialized;
  compact?: boolean;
};

function BoolLabel({ value }: { value: boolean }) {
  return (
    <span className={cn("font-medium", value ? "text-emerald-700" : "text-slate-500")}>
      {value ? "Sim" : "Não"}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 text-sm text-slate-700">
        {children}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="min-w-[10rem] shrink-0 font-medium text-slate-600">{label}</span>
      <span className="flex-1 text-slate-800">{value}</span>
    </div>
  );
}

export function ExamDetailContent({ exam, compact }: ExamDetailContentProps) {
  return (
    <div className={cn("space-y-6", compact && "space-y-5")}>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={exam.status} type="exam" />
          <Badge variant="outline" className="rounded-full border-slate-200 bg-white">
            {EXAM_CATEGORY_LABELS[exam.category]}
          </Badge>
          <Badge variant="outline" className="rounded-full border-slate-200 bg-white">
            {EXAM_PREPARATION_LABELS[exam.preparationType]}
          </Badge>
        </div>
        <h2 className="mt-3 text-xl font-semibold text-slate-900">{exam.name}</h2>
        {exam.shortDescription && (
          <p className="mt-1 text-sm text-slate-600">{exam.shortDescription}</p>
        )}
      </div>

      <Section title="Informações gerais">
        <Row label="Categoria" value={EXAM_CATEGORY_LABELS[exam.category]} />
        <Row label="Status" value={<StatusBadge status={exam.status} type="exam" />} />
        <Row label="Exibir no site" value={<BoolLabel value={exam.showOnWebsite} />} />
        <Row
          label="Formulário de encaminhamento"
          value={<BoolLabel value={exam.availableOnPublicForm} />}
        />
        <Row label="Descrição curta" value={exam.shortDescription || "—"} />
      </Section>

      <Section title="Preparo">
        <Row label="Tipo de preparo" value={EXAM_PREPARATION_LABELS[exam.preparationType]} />
        <Row label="Preparo antes do exame" value={exam.preparationBefore || "—"} />
        <Row label="Orientações no dia" value={exam.instructionsOnDay || "—"} />
        <Row label="Observações importantes" value={exam.observations || "—"} />
        <Row label="Quando informar a clínica" value={exam.whenToNotifyClinic || "—"} />
      </Section>

      <Section title="Prazo">
        <Row label="Prazo médio de entrega" value={exam.averageDeadline || "—"} />
        <Row
          label="Unidade de prazo"
          value={
            exam.deadlineType ? EXAM_DEADLINE_TYPE_LABELS[exam.deadlineType] : "—"
          }
        />
      </Section>

      <Section title="Configurações operacionais">
        <Row label="Requer agendamento" value={<BoolLabel value={exam.requiresAppointment} />} />
        <Row
          label="Requer profissional específico"
          value={<BoolLabel value={exam.requiresProfessional} />}
        />
        <Row label="Requer documento/anexo" value={<BoolLabel value={exam.requiresAttachment} />} />
        <Row
          label="Pré-encaminhamento público"
          value={<BoolLabel value={exam.availableOnPublicForm} />}
        />
        <Row label="Portal da empresa" value={<BoolLabel value={exam.availableOnCompanyPortal} />} />
        {exam.displayOrder != null && <Row label="Ordem de exibição" value={exam.displayOrder} />}
        {exam.internalTags && <Row label="Tags internas" value={exam.internalTags} />}
      </Section>

      {!compact && exam.history.length > 0 && (
        <Section title="Histórico">
          <ul className="space-y-3">
            {exam.history.map((h) => (
              <li key={h.id} className="border-b border-slate-200/80 pb-3 last:border-0 last:pb-0">
                <p className="font-medium text-slate-800">
                  {EXAM_HISTORY_ACTION_LABELS[h.action]}
                </p>
                {h.notes && <p className="mt-0.5 text-slate-600">{h.notes}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  {h.performedByName ?? "Sistema"} ·{" "}
                  {format(new Date(h.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
