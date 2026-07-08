"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  FileText,
  MessageCircle,
  Paperclip,
  RefreshCw,
  User,
  Building2,
  Stethoscope,
  History,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import type { ReferralDetailSerialized } from "@/lib/referrals";
import {
  REFERRAL_SOURCE_LABELS,
  REFERRAL_EXAM_STATUS_LABELS,
  REFERRAL_DOCUMENT_TYPE_LABELS,
  buildReferralWhatsAppMessage,
  maskCpf,
} from "@/lib/referrals";
import { CLINICAL_EXAM_LABELS, EXAM_CATEGORY_LABELS, REFERRAL_STATUS_LABELS } from "@/types";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCNPJ, formatCPF, formatPhone } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { cancelReferralAppointment, deleteReferralDocument, updateReferralStatusWithNotes } from "@/actions/referrals";
import { toast } from "sonner";

type ReferralDetailContentProps = {
  referral: ReferralDetailSerialized;
  canManage: boolean;
  onRefresh: () => void;
  onOpenStatus: () => void;
  onOpenSchedule: () => void;
  onOpenDocument: () => void;
};

function DetailSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="referral-detail-section">
      <h3 className="referral-detail-section-title">
        <Icon className="h-4 w-4 text-[var(--brand-green)]" />
        {title}
      </h3>
      <div className="referral-detail-section-body">{children}</div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="referral-detail-row">
      <span className="referral-detail-label">{label}</span>
      <span className="referral-detail-value">{value}</span>
    </div>
  );
}

export function ReferralDetailContent({
  referral,
  canManage,
  onRefresh,
  onOpenStatus,
  onOpenSchedule,
  onOpenDocument,
}: ReferralDetailContentProps) {
  const phone =
    referral.company.whatsapp ??
    referral.company.phone ??
    referral.companyPhone ??
    "";

  const hasAso =
    referral.status === "ASO_DISPONIVEL" ||
    referral.documents.some((d) => d.type === "ASO");

  const whatsappMessage = buildReferralWhatsAppMessage({
    protocol: referral.protocol,
    companyName: referral.company.tradeName ?? referral.company.legalName,
    employeeName: referral.employee.fullName,
    clinicalExamType: referral.clinicalExamType,
    status: referral.status,
    scheduledAt: referral.scheduledAt ? new Date(referral.scheduledAt) : null,
    hasAso,
  });

  const whatsappUrl = phone
    ? `https://wa.me/55${phone.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`
    : null;

  const activeAppointment = referral.appointments.find((a) => a.status !== "CANCELADO");

  const handleCancelAppointment = async () => {
    if (!activeAppointment) return;
    if (!confirm("Cancelar este agendamento?")) return;
    const result = await cancelReferralAppointment(referral.id, activeAppointment.id);
    if (result.success) {
      toast.success("Agendamento cancelado.");
      onRefresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteDocument = async (docId: string, fileName: string) => {
    if (!confirm(`Remover o documento "${fileName}"?`)) return;
    const result = await deleteReferralDocument(referral.id, docId);
    if (result.success) {
      toast.success("Documento removido.");
      onRefresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleMarkComplete = async () => {
    if (!confirm("Marcar este encaminhamento como concluído?")) return;
    const result = await updateReferralStatusWithNotes(referral.id, "CONCLUIDO", "Encaminhamento concluído");
    if (result.success) {
      toast.success("Encaminhamento concluído!");
      onRefresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="referral-detail-content">
      <div className="referral-detail-actions">
        {canManage && (
          <>
            <Button variant="brand" size="sm" onClick={onOpenSchedule}>
              <Calendar className="mr-1.5 h-4 w-4" />
              {activeAppointment ? "Reagendar" : "Agendar atendimento"}
            </Button>
            <Button variant="outline" size="sm" onClick={onOpenStatus}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Alterar status
            </Button>
            <Button variant="outline" size="sm" onClick={onOpenDocument}>
              <Paperclip className="mr-1.5 h-4 w-4" />
              Anexar documento
            </Button>
          </>
        )}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <MessageCircle className="mr-1.5 h-4 w-4" />
            WhatsApp
          </a>
        )}
        {canManage && referral.status !== "CONCLUIDO" && referral.status !== "CANCELADO" && (
          <>
            <Button variant="outline" size="sm" onClick={handleMarkComplete}>
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              Concluir
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600"
              onClick={async () => {
                if (!confirm("Cancelar este encaminhamento?")) return;
                const result = await updateReferralStatusWithNotes(
                  referral.id,
                  "CANCELADO",
                  "Encaminhamento cancelado"
                );
                if (result.success) {
                  toast.success("Encaminhamento cancelado.");
                  onRefresh();
                } else {
                  toast.error(result.error);
                }
              }}
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Cancelar
            </Button>
          </>
        )}
      </div>

      <DetailSection title="Resumo" icon={FileText}>
        <DetailRow label="Protocolo" value={<strong>{referral.protocol}</strong>} />
        <DetailRow label="Status" value={<StatusBadge status={referral.status} />} />
        <DetailRow
          label="Empresa"
          value={referral.company.tradeName ?? referral.company.legalName}
        />
        <DetailRow label="Colaborador" value={referral.employee.fullName} />
        <DetailRow
          label="Tipo de exame"
          value={CLINICAL_EXAM_LABELS[referral.clinicalExamType]}
        />
        <DetailRow
          label="Data da solicitação"
          value={format(new Date(referral.requestedDate), "dd/MM/yyyy", { locale: ptBR })}
        />
        <DetailRow
          label="Agendamento"
          value={
            referral.scheduledAt
              ? format(new Date(referral.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
              : "Não agendado"
          }
        />
        {referral.assignedTo && (
          <DetailRow label="Responsável" value={referral.assignedTo.name} />
        )}
        {referral.preReferral && (
          <DetailRow
            label="Pré-encaminhamento"
            value={referral.preReferral.protocol}
          />
        )}
      </DetailSection>

      <DetailSection title="Dados da empresa" icon={Building2}>
        <DetailRow
          label="Nome"
          value={referral.company.tradeName ?? referral.company.legalName}
        />
        <DetailRow
          label="CNPJ/CPF"
          value={
            referral.company.cnpj.length === 14
              ? formatCNPJ(referral.company.cnpj)
              : referral.company.cnpj.length === 11
                ? formatCPF(referral.company.cnpj)
                : referral.company.cnpj
          }
        />
        <DetailRow
          label="Responsável"
          value={referral.company.responsibleName ?? referral.authorizerName ?? "—"}
        />
        <DetailRow
          label="WhatsApp"
          value={phone ? formatPhone(phone) : "—"}
        />
        <DetailRow label="E-mail" value={referral.company.email ?? referral.companyEmail ?? "—"} />
      </DetailSection>

      <DetailSection title="Dados do colaborador" icon={User}>
        <DetailRow label="Nome" value={referral.employee.fullName} />
        <DetailRow label="CPF" value={maskCpf(referral.employee.cpf)} />
        <DetailRow label="Função/cargo" value={referral.employee.jobTitle ?? "—"} />
        <DetailRow label="Setor" value={referral.employee.department ?? "—"} />
        <DetailRow
          label="Observações"
          value={referral.employee.notes ?? referral.internalNotes ?? "—"}
        />
      </DetailSection>

      <DetailSection title="Exame clínico" icon={Stethoscope}>
        <DetailRow
          label="Tipo"
          value={CLINICAL_EXAM_LABELS[referral.clinicalExamType]}
        />
      </DetailSection>

      {referral.exams.length > 0 && (
        <DetailSection title="Exames complementares" icon={Stethoscope}>
          <ul className="space-y-2">
            {referral.exams.map((exam) => (
              <li key={exam.id} className="referral-exam-item">
                <div>
                  <span className="text-xs text-slate-500">
                    {EXAM_CATEGORY_LABELS[exam.category] ?? exam.category}
                  </span>
                  <p className="font-medium text-slate-800">{exam.examName}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {REFERRAL_EXAM_STATUS_LABELS[exam.status]}
                </span>
              </li>
            ))}
          </ul>
        </DetailSection>
      )}

      <DetailSection title="Documentos" icon={Paperclip}>
        {referral.documents.length === 0 && referral.legacyDocuments.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum documento anexado.</p>
        ) : (
          <ul className="space-y-2">
            {referral.documents.map((doc) => (
              <li key={doc.id} className="referral-doc-item">
                <div>
                  <span className="text-xs font-medium text-[var(--brand-green)]">
                    {REFERRAL_DOCUMENT_TYPE_LABELS[doc.type]}
                  </span>
                  <p className="text-sm font-medium">{doc.fileName}</p>
                  {doc.uploadedByName && (
                    <p className="text-xs text-slate-500">
                      por {doc.uploadedByName} ·{" "}
                      {format(new Date(doc.createdAt), "dd/MM/yyyy HH:mm")}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                  >
                    Ver
                  </a>
                  <a
                    href={doc.fileUrl}
                    download
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                  >
                    Baixar
                  </a>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                    >
                      Remover
                    </Button>
                  )}
                </div>
              </li>
            ))}
            {referral.legacyDocuments.map((doc) => (
              <li key={doc.id} className="referral-doc-item">
                <div>
                  <span className="text-xs text-slate-500">{doc.type}</span>
                  <p className="text-sm font-medium">{doc.title}</p>
                </div>
                {doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                  >
                    Ver
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
        {canManage && (
          <Button variant="outline" size="sm" className="mt-3" onClick={onOpenDocument}>
            <Paperclip className="mr-1.5 h-4 w-4" />
            Anexar documento
          </Button>
        )}
      </DetailSection>

      {activeAppointment && canManage && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-800">Agendamento ativo</p>
          <p className="text-sm text-slate-600">
            {format(new Date(activeAppointment.scheduledAt), "dd/MM/yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </p>
          {activeAppointment.notes && (
            <p className="mt-1 text-xs text-slate-500">{activeAppointment.notes}</p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-2 text-red-600"
            onClick={handleCancelAppointment}
          >
            <XCircle className="mr-1.5 h-4 w-4" />
            Cancelar agendamento
          </Button>
        </div>
      )}

      <DetailSection title="Histórico" icon={History}>
        {referral.statusHistory.length === 0 ? (
          <p className="text-sm text-slate-500">Sem registros no histórico.</p>
        ) : (
          <ol className="referral-timeline">
            {referral.statusHistory.map((entry, index) => (
              <li key={entry.id} className="referral-timeline-item">
                <div className="referral-timeline-dot" data-first={index === 0} />
                <div className="referral-timeline-content">
                  <p className="text-sm font-medium text-slate-800">
                    {entry.fromStatus
                      ? `${REFERRAL_STATUS_LABELS[entry.fromStatus]} → ${REFERRAL_STATUS_LABELS[entry.toStatus]}`
                      : REFERRAL_STATUS_LABELS[entry.toStatus]}
                  </p>
                  {entry.notes && (
                    <p className="text-sm text-slate-600">{entry.notes}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    {entry.changedByName ?? "Sistema"} ·{" "}
                    {format(new Date(entry.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </DetailSection>

      <Separator />
      <p className="text-xs text-slate-500">
        Origem: {REFERRAL_SOURCE_LABELS[referral.source]} · Atualizado em{" "}
        {format(new Date(referral.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
      </p>
    </div>
  );
}
