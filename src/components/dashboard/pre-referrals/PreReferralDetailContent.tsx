"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2,
  User,
  FileText,
  Stethoscope,
  History,
  MessageCircle,
  ArrowRightCircle,
  RefreshCw,
  StickyNote,
  XCircle,
} from "lucide-react";
import type { PreReferralDetailSerialized } from "@/lib/pre-referrals";
import {
  PRE_REFERRAL_SOURCE_LABELS,
  PRE_REFERRAL_HISTORY_ACTION_LABELS,
  buildPreReferralWhatsAppMessage,
  getMissingPreReferralFields,
  maskDocument,
} from "@/lib/pre-referrals";
import {
  PRE_REFERRAL_CLINICAL_EXAM_LABELS,
  PRE_REFERRAL_STATUS_LABELS,
  EXAM_SELECTION_MODE_LABELS,
} from "@/types";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatPhone } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { updatePreReferralStatusWithNotes, logPreReferralWhatsApp } from "@/actions/pre-referrals";
import { toast } from "sonner";
import Link from "next/link";

function Section({
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="referral-detail-row">
      <span className="referral-detail-label">{label}</span>
      <span className="referral-detail-value">{value}</span>
    </div>
  );
}

export function PreReferralDetailContent({
  item,
  canManage,
  onRefresh,
  onOpenStatus,
  onOpenNote,
  onOpenConvert,
}: {
  item: PreReferralDetailSerialized;
  canManage: boolean;
  onRefresh: () => void;
  onOpenStatus: () => void;
  onOpenNote: () => void;
  onOpenConvert: () => void;
}) {
  const { confirm, ConfirmDialogHost } = useConfirmDialog();
  const missing = getMissingPreReferralFields(item);
  const whatsappMessage = buildPreReferralWhatsAppMessage({
    protocol: item.protocol,
    companyName: item.companyName,
    employeeName: item.employeeName,
    clinicalExamType: item.clinicalExamType,
    missingFields: missing,
  });
  const whatsappUrl = `https://wa.me/55${item.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`;

  const handleWhatsApp = async () => {
    await logPreReferralWhatsApp(item.id);
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    onRefresh();
  };

  const handleQuickStatus = async (status: string) => {
    const result = await updatePreReferralStatusWithNotes(item.id, status);
    if (result.success) {
      toast.success("Status atualizado!");
      onRefresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleCancel = async () => {
    const ok = await confirm({
      title: "Cancelar solicitação",
      description: "Deseja cancelar esta solicitação?",
      confirmLabel: "Cancelar solicitação",
      variant: "destructive",
    });
    if (!ok) return;
    const result = await updatePreReferralStatusWithNotes(
      item.id,
      "CANCELADO",
      "Solicitação cancelada pela equipe"
    );
    if (result.success) {
      toast.success("Solicitação cancelada.");
      onRefresh();
    } else {
      toast.error(result.error);
    }
  };

  const isTerminal = item.status === "CONVERTIDO" || item.status === "CANCELADO";

  return (
    <div className="referral-detail-content">
      <div className="referral-detail-actions">
        {canManage && !isTerminal && (
          <>
            <Button variant="brand" size="sm" onClick={onOpenConvert}>
              <ArrowRightCircle className="mr-1.5 h-4 w-4" />
              Converter em encaminhamento
            </Button>
            <Button variant="outline" size="sm" onClick={handleWhatsApp}>
              <MessageCircle className="mr-1.5 h-4 w-4" />
              Falar no WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={onOpenStatus}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Alterar status
            </Button>
            <Button variant="outline" size="sm" onClick={onOpenNote}>
              <StickyNote className="mr-1.5 h-4 w-4" />
              Observação interna
            </Button>
            {item.status === "NOVO" && (
              <Button variant="outline" size="sm" onClick={() => handleQuickStatus("EM_ANALISE")}>
                Marcar em análise
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-red-600" onClick={handleCancel}>
              <XCircle className="mr-1.5 h-4 w-4" />
              Cancelar
            </Button>
          </>
        )}
        {item.convertedReferral?.id && (
          <Link
            href={`/dashboard/encaminhamentos?id=${item.convertedReferral.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Ver encaminhamento{item.convertedReferral.protocol ? ` ${item.convertedReferral.protocol}` : ""}
          </Link>
        )}
      </div>

      <Section title="Resumo" icon={FileText}>
        <Row label="Protocolo" value={<strong>{item.protocol}</strong>} />
        <Row label="Status" value={<StatusBadge status={item.status} type="preReferral" />} />
        <Row
          label="Data de envio"
          value={format(new Date(item.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        />
        <Row
          label="Origem"
          value={PRE_REFERRAL_SOURCE_LABELS[item.source] ?? item.source}
        />
        <Row
          label="Tipo de exame"
          value={PRE_REFERRAL_CLINICAL_EXAM_LABELS[item.clinicalExamType]}
        />
        {item.assignedTo && <Row label="Responsável" value={item.assignedTo.name} />}
      </Section>

      <Section title="Empresa e contato" icon={Building2}>
        <Row label="Empresa" value={item.companyName} />
        <Row label="CNPJ/CPF" value={maskDocument(item.companyDocument)} />
        <Row label="Responsável" value={item.responsibleName} />
        <Row label="WhatsApp" value={formatPhone(item.whatsapp)} />
        <Row label="E-mail" value={item.email ?? "—"} />
      </Section>

      <Section title="Colaborador" icon={User}>
        <Row label="Nome" value={item.employeeName} />
        <Row label="CPF" value={maskDocument(item.employeeDocument)} />
        <Row label="Função" value={item.employeeRole} />
        <Row
          label="Tipo de exame"
          value={PRE_REFERRAL_CLINICAL_EXAM_LABELS[item.clinicalExamType]}
        />
      </Section>

      <Section title="Exames e observações" icon={Stethoscope}>
        <Row
          label="Modo de seleção"
          value={EXAM_SELECTION_MODE_LABELS[item.examSelectionMode]}
        />
        {item.selectedExams.length > 0 && (
          <Row label="Exames selecionados" value={item.selectedExams.join(", ")} />
        )}
        <Row label="Observações do cliente" value={item.notes ?? "—"} />
      </Section>

      <Section title="Histórico" icon={History}>
        {item.history.length === 0 ? (
          <p className="text-sm text-slate-500">Sem registros no histórico.</p>
        ) : (
          <ol className="referral-timeline">
            {item.history.map((entry, index) => (
              <li key={entry.id} className="referral-timeline-item">
                <div className="referral-timeline-dot" data-first={index === 0} />
                <div className="referral-timeline-content">
                  <p className="text-sm font-medium text-slate-800">
                    {PRE_REFERRAL_HISTORY_ACTION_LABELS[entry.action] ?? entry.action}
                    {entry.fromStatus && entry.toStatus && entry.fromStatus !== entry.toStatus && (
                      <>
                        {": "}
                        {PRE_REFERRAL_STATUS_LABELS[entry.fromStatus]} →{" "}
                        {PRE_REFERRAL_STATUS_LABELS[entry.toStatus]}
                      </>
                    )}
                  </p>
                  {entry.notes && <p className="text-sm text-slate-600">{entry.notes}</p>}
                  <p className="text-xs text-slate-500">
                    {entry.performedByName ?? "Sistema"} ·{" "}
                    {format(new Date(entry.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Section>
      <ConfirmDialogHost />
    </div>
  );
}
