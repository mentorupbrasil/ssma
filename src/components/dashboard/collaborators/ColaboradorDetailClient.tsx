"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  Pencil,
  Calendar,
  FolderOpen,
  History,
  LayoutDashboard,
  Stethoscope,
  Plus,
} from "lucide-react";
import type { CollaboratorDetailSerialized } from "@/lib/collaborators";
import {
  PATIENT_HISTORY_ACTION_LABELS,
  PATIENT_STATUS_LABELS,
  getPeriodicExamBadge,
  buildCollaboratorTimeline,
} from "@/lib/collaborators";
import {
  DOCUMENT_TYPE_LABELS,
  normalizeDocumentStatus,
} from "@/lib/documents";
import { CLINICAL_EXAM_LABELS } from "@/types";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PageModule } from "@/components/dashboard/PageModule";
import { MetricGrid } from "@/components/dashboard/MetricGrid";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getMetricMeta } from "@/lib/metric-cards";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCPF, formatPhone } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { EditCollaboratorDialog } from "./CollaboratorDialogs";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { InlineEmptyNote } from "@/components/dashboard/InlineEmptyNote";

const TABS = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "referrals", label: "Encaminhamentos", icon: FileText },
  { id: "agenda", label: "Agenda", icon: Calendar },
  { id: "exams", label: "Exames", icon: Stethoscope },
  { id: "documents", label: "Documentos", icon: FolderOpen },
  { id: "history", label: "Histórico", icon: History },
] as const;

type TabId = (typeof TABS)[number]["id"];

type ColaboradorDetailClientProps = {
  collaborator: CollaboratorDetailSerialized;
  canManage: boolean;
  canClinical: boolean;
};

export function ColaboradorDetailClient({
  collaborator,
  canManage,
  canClinical,
}: ColaboradorDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabId) || "overview";

  const [editOpen, setEditOpen] = useState(false);

  const companyId = collaborator.company?.id ?? "";
  const companyName =
    collaborator.company?.tradeName ?? collaborator.company?.legalName ?? null;

  const setTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/dashboard/colaboradores/${collaborator.id}?${params.toString()}`);
  };

  const refresh = () => router.refresh();

  const visibleTabs = canClinical ? TABS : TABS.filter((t) => t.id !== "exams");
  const resolvedTab =
    !canClinical && activeTab === "exams" ? "overview" : activeTab;

  const periodicBadge = getPeriodicExamBadge(collaborator.nextPeriodicDate);
  const timeline = buildCollaboratorTimeline(collaborator);

  return (
    <PageModule>
      <PageHeader
        title={collaborator.fullName}
        description={companyName ?? "Colaborador"}
      >
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={collaborator.status} type="collaborator" />
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              periodicBadge.tone === "danger" && "bg-red-100 text-red-700",
              periodicBadge.tone === "warning" && "bg-amber-100 text-amber-800",
              periodicBadge.tone === "ok" && "bg-emerald-100 text-emerald-800",
              periodicBadge.tone === "neutral" && "bg-slate-100 text-slate-600"
            )}
          >
            {periodicBadge.label}
          </span>
          {canManage && (
            <>
              <Link
                href={`/dashboard/encaminhamentos/novo?patientId=${collaborator.id}&companyId=${companyId}`}
                className={cn(buttonVariants({ variant: "brand", size: "sm" }))}
              >
                <FileText className="mr-1.5 h-4 w-4" /> Novo encaminhamento
              </Link>
              {(canManage || canClinical) && (
                <Link
                  href={`/dashboard/agenda?new=1&patientId=${collaborator.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  <Calendar className="mr-1.5 h-4 w-4" /> Agendar exame
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-1.5 h-4 w-4" /> Editar
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      <p className="mb-4 text-sm text-slate-500">
        CPF: {formatCPF(collaborator.cpf)}
        {companyName && (
          <>
            {" · "}
            Empresa:{" "}
            {collaborator.company ? (
              <Link
                href={`/dashboard/empresas/${collaborator.company.id}`}
                className="text-[#16A085] hover:underline"
              >
                {companyName}
              </Link>
            ) : (
              companyName
            )}
          </>
        )}
      </p>

      <div className="dash-module-tabs">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={cn(
              "dash-module-tab",
              resolvedTab === tab.id && "dash-module-tab-active"
            )}
          >
            <tab.icon className="mr-1.5 inline h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {resolvedTab === "overview" && (
        <OverviewTab collaborator={collaborator} timeline={timeline} onNavigate={setTab} />
      )}
      {resolvedTab === "referrals" && (
        <ReferralsTab collaborator={collaborator} canManage={canManage} />
      )}
      {resolvedTab === "agenda" && (
        <AgendaTab collaborator={collaborator} canManage={canManage} companyId={companyId} />
      )}
      {resolvedTab === "exams" && canClinical && (
        <ExamsTab collaborator={collaborator} />
      )}
      {resolvedTab === "documents" && (
        <DocumentsTab collaborator={collaborator} canManage={canManage} />
      )}
      {resolvedTab === "history" && <HistoryTab collaborator={collaborator} />}

      {canManage && (
        <EditCollaboratorDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          collaboratorId={collaborator.id}
          collaborator={{
            fullName: collaborator.fullName,
            cpf: collaborator.cpf,
            birthDate: collaborator.birthDate,
            phone: collaborator.phone,
            email: collaborator.email,
            companyId: collaborator.company?.id ?? null,
            jobTitle: collaborator.jobTitle,
            department: collaborator.department,
            admissionDate: collaborator.admissionDate,
            nextPeriodicDate: collaborator.nextPeriodicDate,
            status: collaborator.status,
            notes: collaborator.notes,
          }}
          onSuccess={refresh}
        />
      )}
    </PageModule>
  );
}

function OverviewTab({
  collaborator,
  timeline,
  onNavigate,
}: {
  collaborator: CollaboratorDetailSerialized;
  timeline: ReturnType<typeof buildCollaboratorTimeline>;
  onNavigate: (tab: TabId) => void;
}) {
  const stats = [
    {
      key: "open_referrals",
      label: "Encaminhamentos em aberto",
      value: collaborator.stats.openReferrals,
      tab: "referrals" as TabId,
    },
    {
      key: "upcoming_appointments",
      label: "Agendamentos futuros",
      value: collaborator.stats.upcomingAppointments,
      tab: "agenda" as TabId,
    },
    {
      key: "available_documents",
      label: "Documentos disponíveis",
      value: collaborator.stats.availableDocuments,
      tab: "documents" as TabId,
    },
    {
      key: "pending_exams",
      label: "Exames pendentes",
      value: collaborator.stats.pendingExams,
      tab: "exams" as TabId,
    },
    {
      key: "last_exam",
      label: "Último exame",
      value:
        collaborator.stats.lastExamLabel && collaborator.stats.lastExamDate
          ? `${collaborator.stats.lastExamLabel} · ${format(new Date(collaborator.stats.lastExamDate), "dd/MM/yyyy", { locale: ptBR })}`
          : "—",
      tab: "referrals" as TabId,
    },
  ];

  return (
    <div className="space-y-6">
      <MetricGrid>
        {stats.map((s) => {
          const meta = getMetricMeta(`collaborator_detail:${s.key}`);
          return (
            <MetricCard
              key={s.key}
              label={s.label}
              value={s.value}
              icon={meta.icon}
              description={meta.description}
              variant={meta.tone}
              onClick={() => onNavigate(s.tab)}
            />
          );
        })}
      </MetricGrid>

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <InfoRow label="Nome completo" value={collaborator.fullName} />
          <InfoRow label="CPF" value={formatCPF(collaborator.cpf)} />
          <InfoRow label="RG" value={collaborator.rg ?? "—"} />
          <InfoRow
            label="Data de nascimento"
            value={
              collaborator.birthDate
                ? format(new Date(collaborator.birthDate), "dd/MM/yyyy", { locale: ptBR })
                : "—"
            }
          />
          <InfoRow
            label="Telefone"
            value={collaborator.phone ? formatPhone(collaborator.phone) : "—"}
          />
          <InfoRow label="E-mail" value={collaborator.email ?? "—"} />
          <InfoRow label="Status" value={PATIENT_STATUS_LABELS[collaborator.status]} />
          <InfoRow
            label="Empresa"
            value={
              collaborator.company
                ? collaborator.company.tradeName ?? collaborator.company.legalName
                : "—"
            }
          />
          <InfoRow label="Função" value={collaborator.jobTitle ?? "—"} />
          <InfoRow label="Setor" value={collaborator.department ?? "—"} />
          <InfoRow
            label="Data de admissão"
            value={
              collaborator.admissionDate
                ? format(new Date(collaborator.admissionDate), "dd/MM/yyyy", { locale: ptBR })
                : "—"
            }
          />
          <InfoRow
            label="Próximo periódico"
            value={
              collaborator.nextPeriodicDate
                ? format(new Date(collaborator.nextPeriodicDate), "dd/MM/yyyy", { locale: ptBR })
                : "—"
            }
          />
          <InfoRow
            label="Cadastrado em"
            value={format(new Date(collaborator.createdAt), "dd/MM/yyyy", { locale: ptBR })}
          />
          {collaborator.notes && (
            <div className="sm:col-span-2">
              <InfoRow label="Observações internas" value={collaborator.notes} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-4 font-semibold text-[#0F3D4A]">Linha do tempo</h3>
          {timeline.length === 0 ? (
            <InlineEmptyNote>Nenhum evento registrado ainda.</InlineEmptyNote>
          ) : (
            <ul className="referral-history-list">
              {timeline.map((ev) => (
                <li key={ev.id} className="referral-history-item">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-sm">{ev.title}</span>
                    <span className="shrink-0 text-xs text-slate-400">
                      {format(new Date(ev.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {ev.subtitle && <p className="mt-1 text-xs text-slate-500">{ev.subtitle}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  );
}

function ReferralsTab({
  collaborator,
  canManage,
}: {
  collaborator: CollaboratorDetailSerialized;
  canManage: boolean;
}) {
  return (
    <div>
      {canManage && (
        <div className="mb-4 flex gap-2">
          <Link
            href={`/dashboard/encaminhamentos/novo?patientId=${collaborator.id}&companyId=${collaborator.company?.id ?? ""}`}
            className={cn(buttonVariants({ variant: "brand", size: "sm" }))}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Novo encaminhamento
          </Link>
        </div>
      )}
      {collaborator.referrals.length === 0 ? (
        <EmptyState
          compact
          title="Nenhum encaminhamento"
          description="Este colaborador ainda não possui encaminhamentos."
          action={
            canManage
              ? {
                  label: "Novo encaminhamento",
                  href: `/dashboard/encaminhamentos/novo?patientId=${collaborator.id}&companyId=${collaborator.company?.id ?? ""}`,
                }
              : undefined
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Protocolo</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Agendamento</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collaborator.referrals.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link
                    href={`/dashboard/encaminhamentos?id=${r.id}`}
                    className="text-[#16A085] hover:underline"
                  >
                    {r.protocol}
                  </Link>
                </TableCell>
                <TableCell>{r.companyName}</TableCell>
                <TableCell>
                  {CLINICAL_EXAM_LABELS[r.clinicalExamType as keyof typeof CLINICAL_EXAM_LABELS] ??
                    r.clinicalExamType}
                </TableCell>
                <TableCell>
                  {format(new Date(r.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  {r.scheduledAt
                    ? format(new Date(r.scheduledAt), "dd/MM HH:mm", { locale: ptBR })
                    : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function AgendaTab({
  collaborator,
  canManage,
  companyId,
}: {
  collaborator: CollaboratorDetailSerialized;
  canManage: boolean;
  companyId: string;
}) {
  if (collaborator.appointments.length === 0) {
    return (
      <EmptyState
        compact
        title="Nenhum agendamento"
        description="Não há exames agendados para este colaborador."
        action={
          canManage
            ? { label: "Agendar exame", href: `/dashboard/agenda?new=1&patientId=${collaborator.id}&companyId=${companyId}` }
            : undefined
        }
      />
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Horário</TableHead>
          <TableHead>Empresa</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Protocolo</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {collaborator.appointments.map((a) => (
          <TableRow key={a.id}>
            <TableCell>
              {format(new Date(a.scheduledAt), "dd/MM/yyyy", { locale: ptBR })}
            </TableCell>
            <TableCell>
              <Link
                href={`/dashboard/agenda?id=${a.id}`}
                className="text-[#16A085] hover:underline"
              >
                {format(new Date(a.scheduledAt), "HH:mm", { locale: ptBR })}
              </Link>
            </TableCell>
            <TableCell>{a.companyName ?? "—"}</TableCell>
            <TableCell>
              {a.clinicalExamType
                ? CLINICAL_EXAM_LABELS[a.clinicalExamType as keyof typeof CLINICAL_EXAM_LABELS]
                : "—"}
            </TableCell>
            <TableCell>{a.protocol ?? "—"}</TableCell>
            <TableCell>
              <StatusBadge status={a.status} type="appointment" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ExamsTab({ collaborator }: { collaborator: CollaboratorDetailSerialized }) {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 font-semibold text-[#0F3D4A]">Exames clínicos</h3>
        {collaborator.clinicalExams.length === 0 ? (
          <InlineEmptyNote>Nenhum exame clínico registrado.</InlineEmptyNote>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exame</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Protocolo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collaborator.clinicalExams.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.name}</TableCell>
                  <TableCell>
                    {format(new Date(e.date), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{e.protocol ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section>
        <h3 className="mb-3 font-semibold text-[#0F3D4A]">Exames complementares</h3>
        {collaborator.complementaryExams.length === 0 ? (
          <InlineEmptyNote>Nenhum exame complementar registrado.</InlineEmptyNote>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exame</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Protocolo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collaborator.complementaryExams.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.name}</TableCell>
                  <TableCell>
                    {format(new Date(e.date), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{e.protocol ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}

function DocumentsTab({
  collaborator,
  canManage,
}: {
  collaborator: CollaboratorDetailSerialized;
  canManage: boolean;
}) {
  if (collaborator.documents.length === 0) {
    return (
      <EmptyState
        compact
        title="Nenhum documento"
        description="Documentos deste colaborador aparecerão aqui."
        action={
          canManage
            ? { label: "Anexar documento", href: `/dashboard/documentos?patientId=${collaborator.id}&new=1` }
            : undefined
        }
      />
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href={`/dashboard/documentos?patientId=${collaborator.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Ver na central de documentos
        </Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Validade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Anexado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {collaborator.documents.map((d) => (
            <TableRow key={d.id}>
              <TableCell>
                {DOCUMENT_TYPE_LABELS[d.type as keyof typeof DOCUMENT_TYPE_LABELS] ?? d.type}
              </TableCell>
              <TableCell>
                {d.fileUrl ? (
                  <a
                    href={`/api/documents/${d.id}/file`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#16A085] hover:underline"
                  >
                    {d.title}
                  </a>
                ) : (
                  d.title
                )}
              </TableCell>
              <TableCell>
                {d.validUntil
                  ? format(new Date(d.validUntil), "dd/MM/yyyy", { locale: ptBR })
                  : "—"}
              </TableCell>
              <TableCell>
                <StatusBadge status={normalizeDocumentStatus(d.status as import("@prisma/client").DocumentStatus)} type="document" />
              </TableCell>
              <TableCell>
                {format(new Date(d.createdAt), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function HistoryTab({ collaborator }: { collaborator: CollaboratorDetailSerialized }) {
  return collaborator.history.length === 0 ? (
    <p className="text-sm text-slate-500">Nenhum registro no histórico.</p>
  ) : (
    <ul className="referral-history-list">
      {collaborator.history.map((h) => (
        <li key={h.id} className="referral-history-item">
          <div className="flex justify-between">
            <span className="text-sm font-medium">
              {PATIENT_HISTORY_ACTION_LABELS[h.action] ?? h.action}
            </span>
            <span className="text-xs text-slate-400">
              {format(new Date(h.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </span>
          </div>
          {h.performedByName && (
            <p className="text-xs text-slate-500">Por: {h.performedByName}</p>
          )}
          {h.notes && <p className="mt-1 text-sm text-slate-600">{h.notes}</p>}
        </li>
      ))}
    </ul>
  );
}
