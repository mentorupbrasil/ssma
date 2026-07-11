"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DocumentDetailSerialized } from "@/lib/documents";
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_HISTORY_LABELS,
  ASO_CLINICAL_TYPE_LABELS,
  LGPD_DEFAULT_NOTICE,
  LGPD_DOWNLOAD_FOOTER,
  formatFileSize,
  getDocumentDisplayStatus,
} from "@/lib/documents";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Shield, AlertTriangle } from "lucide-react";

type DocumentDetailContentProps = {
  document: DocumentDetailSerialized;
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

function ValidityBadge({ label }: { label: string | null }) {
  if (!label) return <span>—</span>;
  const colors =
    label === "Vencido"
      ? "bg-red-50 text-red-800 border-red-200"
      : label === "A vencer"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-emerald-50 text-emerald-800 border-emerald-200";
  return (
    <Badge variant="outline" className={cn("rounded-full font-normal", colors)}>
      {label}
    </Badge>
  );
}

export function DocumentDetailContent({ document: doc, compact }: DocumentDetailContentProps) {
  const display = getDocumentDisplayStatus(doc);

  return (
    <div className={cn("space-y-6", compact && "space-y-5")}>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={display.status} type="document" label={display.label} />
          <Badge variant="outline" className="rounded-full border-slate-200 bg-white">
            {DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type}
          </Badge>
          {doc.sensitive && (
            <Badge
              variant="outline"
              className="rounded-full border-violet-200 bg-violet-50 text-violet-800"
            >
              <Shield className="mr-1 h-3 w-3" /> Sensível
            </Badge>
          )}
          {doc.validityLabel && (
            <ValidityBadge label={doc.validityLabel} />
          )}
        </div>
        <h2 className="mt-3 text-xl font-semibold text-slate-900">{doc.title}</h2>
        {doc.fileName && (
          <p className="mt-1 text-sm text-slate-500">{doc.fileName}</p>
        )}
      </div>

      {(doc.sensitive || doc.type === "ASO" || doc.type === "RESULTADO_EXAME") && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/80 p-4 text-sm text-violet-900">
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-2">
              <p className="font-medium">Aviso LGPD</p>
              <p>{LGPD_DEFAULT_NOTICE}</p>
              <p className="text-xs text-violet-800">{LGPD_DOWNLOAD_FOOTER}</p>
            </div>
          </div>
        </div>
      )}

      <Section title="Resumo">
        <Row label="Título" value={doc.title} />
        <Row label="Tipo" value={DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type} />
        <Row label="Status" value={<StatusBadge status={display.status} type="document" label={display.label} />} />
        <Row
          label="Data de criação"
          value={format(new Date(doc.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        />
        {doc.issuedAt && (
          <Row
            label="Data de emissão"
            value={format(new Date(doc.issuedAt), "dd/MM/yyyy", { locale: ptBR })}
          />
        )}
        {doc.validUntil && (
          <Row
            label="Validade"
            value={
              <span className="flex flex-wrap items-center gap-2">
                {format(new Date(doc.validUntil), "dd/MM/yyyy", { locale: ptBR })}
                <ValidityBadge label={doc.validityLabel} />
              </span>
            }
          />
        )}
        <Row label="Documento sensível" value={<BoolLabel value={doc.sensitive} />} />
        <Row label="Portal empresarial" value={<BoolLabel value={doc.availableOnPortal} />} />
        <Row label="Responsável" value={doc.uploadedByName ?? "—"} />
        {doc.type === "ASO" && (
          <>
            {doc.asoClinicalType && (
              <Row
                label="Tipo de ASO"
                value={ASO_CLINICAL_TYPE_LABELS[doc.asoClinicalType]}
              />
            )}
            {doc.asoExamDate && (
              <Row
                label="Data do exame"
                value={format(new Date(doc.asoExamDate), "dd/MM/yyyy", { locale: ptBR })}
              />
            )}
            {doc.asoProfessionalName && (
              <Row label="Profissional responsável" value={doc.asoProfessionalName} />
            )}
          </>
        )}
      </Section>

      <Section title="Vínculos">
        <Row label="Empresa" value={doc.companyName ?? "—"} />
        <Row label="Colaborador" value={doc.patientName ?? "—"} />
        <Row label="Encaminhamento" value={doc.protocol ?? "—"} />
        <Row label="Exame" value={doc.examName ?? "—"} />
        <Row label="Orçamento" value={doc.quoteNumber ?? "—"} />
        <Row label="Tipo de vínculo" value={doc.linkLabel} />
      </Section>

      <Section title="Arquivo">
        {doc.hasFile ? (
          <>
            <Row label="Nome" value={doc.fileName ?? "—"} />
            <Row label="Tipo" value={doc.fileMimeType ?? "—"} />
            <Row label="Tamanho" value={formatFileSize(doc.fileSize)} />
          </>
        ) : (
          <div className="flex items-start gap-2 text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Nenhum arquivo anexado. O registro está pendente de upload.</p>
          </div>
        )}
      </Section>

      {(doc.notes || doc.clientNotes) && (
        <Section title="Observações">
          {doc.notes && <Row label="Observação interna" value={doc.notes} />}
          {doc.clientNotes && <Row label="Observação para empresa/RH" value={doc.clientNotes} />}
        </Section>
      )}

      {!compact && doc.history.length > 0 && (
        <Section title="Histórico">
          <ul className="space-y-3">
            {doc.history.map((h) => (
              <li key={h.id} className="border-b border-slate-200/80 pb-3 last:border-0 last:pb-0">
                <p className="font-medium text-slate-800">
                  {DOCUMENT_HISTORY_LABELS[h.action]}
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
