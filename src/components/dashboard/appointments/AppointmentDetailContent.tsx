"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  User,
  Building2,
  Stethoscope,
  History,
  MessageCircle,
  FileText,
  CheckCircle2,
  Play,
  XCircle,
  RefreshCw,
  Paperclip,
} from "lucide-react";
import type { AppointmentDetailSerialized } from "@/lib/appointments";
import {
  APPOINTMENT_HISTORY_ACTION_LABELS,
  APPOINTMENT_EXAM_STATUS_LABELS,
  getClinicalExamLabel,
  buildAppointmentConfirmationWhatsApp,
  formatAppointmentDateTime,
  canClinicalAppointmentActions,
  canReceptionAppointmentActions,
} from "@/lib/appointments";
import { CLINICAL_EXAM_LABELS, EXAM_CATEGORY_LABELS } from "@/types";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPhone } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import {
  confirmAppointment,
  startAppointmentAttendance,
  completeAppointment,
} from "@/actions/appointments";
import { toast } from "sonner";

type AppointmentDetailContentProps = {
  appointment: AppointmentDetailSerialized;
  userRole: string;
  canManage: boolean;
  onRefresh: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  onNoShow: () => void;
  onAddNote: () => void;
  onAttachDocument?: () => void;
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

export function AppointmentDetailContent({
  appointment,
  userRole,
  canManage,
  onRefresh,
  onReschedule,
  onCancel,
  onNoShow,
  onAddNote,
  onAttachDocument,
}: AppointmentDetailContentProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const examTypeLabel = getClinicalExamLabel(
    appointment.clinicalExamType,
    appointment.type
  );
  const { date, time } = formatAppointmentDateTime(appointment.scheduledAt);

  const phone =
    appointment.employee?.phone ??
    appointment.company?.whatsapp ??
    appointment.company?.phone ??
    "";

  const whatsappMessage = buildAppointmentConfirmationWhatsApp({
    employeeName: appointment.employee?.fullName ?? "—",
    companyName: appointment.company?.tradeName ?? appointment.company?.legalName ?? "—",
    examType: examTypeLabel,
    date,
    time,
  });

  const whatsappUrl = phone
    ? `https://wa.me/55${phone.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`
    : null;

  const canClinical = canClinicalAppointmentActions(userRole);
  const canReception = canReceptionAppointmentActions(userRole);
  const isTerminal = ["CONCLUIDO", "CANCELADO", "REAGENDADO", "FALTOU"].includes(
    appointment.status
  );

  const runAction = async (
    key: string,
    fn: () => Promise<{ success: boolean; error?: string }>
  ) => {
    setActionLoading(key);
    const result = await fn();
    setActionLoading(null);
    if (result.success) {
      toast.success("Atualizado!");
      onRefresh();
    } else {
      toast.error(result.error ?? "Erro");
    }
  };

  return (
    <div className="referral-detail-content">
      <div className="referral-detail-actions flex-wrap">
        {canManage && !isTerminal && (
          <>
            {appointment.status === "AGENDADO" && canReception && (
              <Button
                variant="brand"
                size="sm"
                disabled={!!actionLoading}
                onClick={() => runAction("confirm", () => confirmAppointment(appointment.id))}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Confirmar
              </Button>
            )}
            {["AGENDADO", "CONFIRMADO"].includes(appointment.status) && canClinical && (
              <Button
                variant="brand"
                size="sm"
                disabled={!!actionLoading}
                onClick={() => runAction("start", () => startAppointmentAttendance(appointment.id))}
              >
                <Play className="mr-1.5 h-4 w-4" />
                Iniciar atendimento
              </Button>
            )}
            {appointment.status === "EM_ATENDIMENTO" && canClinical && (
              <Button
                variant="brand"
                size="sm"
                disabled={!!actionLoading}
                onClick={() => runAction("complete", () => completeAppointment(appointment.id))}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Concluir
              </Button>
            )}
            {canReception && !isTerminal && (
              <>
                <Button variant="outline" size="sm" onClick={onReschedule}>
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  Reagendar
                </Button>
                <Button variant="outline" size="sm" onClick={onNoShow}>
                  <XCircle className="mr-1.5 h-4 w-4" />
                  Marcar falta
                </Button>
                <Button variant="outline" size="sm" onClick={onCancel}>
                  <XCircle className="mr-1.5 h-4 w-4" />
                  Cancelar
                </Button>
              </>
            )}
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
        {appointment.referralId && (
          <Link
            href={`/dashboard/encaminhamentos?id=${appointment.referralId}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <FileText className="mr-1.5 h-4 w-4" />
            Ver encaminhamento
          </Link>
        )}
        {canManage && onAttachDocument && (
          <Button variant="outline" size="sm" onClick={onAttachDocument}>
            <Paperclip className="mr-1.5 h-4 w-4" />
            Anexar documento
          </Button>
        )}
        {canManage && (
          <Button variant="ghost" size="sm" onClick={onAddNote}>
            Adicionar observação
          </Button>
        )}
      </div>

      <DetailSection title="Resumo" icon={Calendar}>
        <DetailRow label="Status" value={<StatusBadge status={appointment.status} type="appointment" />} />
        <DetailRow
          label="Data e horário"
          value={format(new Date(appointment.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        />
        {appointment.protocol && (
          <DetailRow label="Protocolo" value={appointment.protocol} />
        )}
        <DetailRow label="Tipo de exame" value={examTypeLabel} />
        <DetailRow
          label="Empresa"
          value={appointment.company?.tradeName ?? appointment.company?.legalName ?? "—"}
        />
        <DetailRow label="Colaborador" value={appointment.employee?.fullName ?? "—"} />
        {appointment.professional && (
          <DetailRow label="Profissional" value={appointment.professional.name} />
        )}
        {appointment.roomName && <DetailRow label="Sala/unidade" value={appointment.roomName} />}
      </DetailSection>

      {appointment.employee && (
        <DetailSection title="Dados do colaborador" icon={User}>
          <DetailRow label="Nome" value={appointment.employee.fullName} />
          <DetailRow label="CPF" value={appointment.employee.cpf} />
          <DetailRow label="Função" value={appointment.employee.jobTitle ?? "—"} />
          <DetailRow label="Setor" value={appointment.employee.department ?? "—"} />
          <DetailRow
            label="Telefone"
            value={appointment.employee.phone ? formatPhone(appointment.employee.phone) : "—"}
          />
        </DetailSection>
      )}

      {appointment.company && (
        <DetailSection title="Dados da empresa" icon={Building2}>
          <DetailRow
            label="Nome"
            value={appointment.company.tradeName ?? appointment.company.legalName}
          />
          <DetailRow label="Responsável" value={appointment.company.responsibleName ?? "—"} />
          <DetailRow
            label="WhatsApp"
            value={
              appointment.company.whatsapp
                ? formatPhone(appointment.company.whatsapp)
                : "—"
            }
          />
          <DetailRow label="E-mail" value={appointment.company.email ?? "—"} />
        </DetailSection>
      )}

      <DetailSection title="Exames" icon={Stethoscope}>
        <DetailRow
          label="Tipo clínico"
          value={
            appointment.clinicalExamType
              ? CLINICAL_EXAM_LABELS[appointment.clinicalExamType]
              : appointment.type ?? "—"
          }
        />
        {appointment.exams.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum exame complementar vinculado.</p>
        ) : (
          <ul className="space-y-2">
            {appointment.exams.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{e.examName}</p>
                  <p className="text-xs text-slate-500">
                    {EXAM_CATEGORY_LABELS[e.category] ?? e.category}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {APPOINTMENT_EXAM_STATUS_LABELS[e.status] ?? e.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Observações" icon={FileText}>
        <DetailRow label="Observações gerais" value={appointment.notes ?? "—"} />
        <DetailRow label="Observações internas" value={appointment.internalNotes ?? "—"} />
        <DetailRow
          label="Observações para atendimento"
          value={appointment.attendanceNotes ?? "—"}
        />
      </DetailSection>

      <DetailSection title="Histórico" icon={History}>
        {appointment.history.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum registro.</p>
        ) : (
          <ul className="referral-history-list">
            {appointment.history.map((h) => (
              <li key={h.id} className="referral-history-item">
                <div className="referral-history-item-header">
                  <span className="font-medium text-sm">
                    {APPOINTMENT_HISTORY_ACTION_LABELS[h.action] ?? h.action}
                  </span>
                  <span className="text-xs text-slate-400">
                    {format(new Date(h.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {h.performedByName && (
                  <p className="text-xs text-slate-500">Por: {h.performedByName}</p>
                )}
                {h.fromStatus && h.toStatus && h.fromStatus !== h.toStatus && (
                  <p className="text-xs text-slate-500">
                    {h.fromStatus} → {h.toStatus}
                  </p>
                )}
                {h.notes && <p className="mt-1 text-sm text-slate-600">{h.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </div>
  );
}
