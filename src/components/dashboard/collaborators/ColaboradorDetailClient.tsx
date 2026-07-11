"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  Pencil,
  FolderOpen,
  LayoutDashboard,
  Calendar,
  Download,
  ChevronLeft,
} from "lucide-react";
import type { DocumentStatus } from "@prisma/client";
import type { CollaboratorDetailSerialized } from "@/lib/collaborators";
import {
  getPeriodicExamBadge,
  buildCollaboratorTimeline,
} from "@/lib/collaborators";
import {
  DOCUMENT_TYPE_LABELS,
  normalizeDocumentStatus,
} from "@/lib/documents";
import { CLINICAL_EXAM_LABELS } from "@/types";
import { PageModule } from "@/components/dashboard/PageModule";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatCPF, formatPhone } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { EditCollaboratorDialog } from "./CollaboratorDialogs";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { InlineEmptyNote } from "@/components/dashboard/InlineEmptyNote";
import { useBreadcrumbSegmentLabel } from "@/components/dashboard/BreadcrumbLabelProvider";

const TABS = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "referrals", label: "Encaminhamentos", icon: FileText },
  { id: "documents", label: "Documentos", icon: FolderOpen },
] as const;

type TabId = (typeof TABS)[number]["id"];

type ColaboradorDetailClientProps = {
  collaborator: CollaboratorDetailSerialized;
  canManage: boolean;
  isEmpresaPortal?: boolean;
};

function collaboratorInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function collaboratorRoleLine(jobTitle: string | null, department: string | null): string {
  if (jobTitle && department) return `${jobTitle} · ${department}`;
  return jobTitle ?? department ?? "—";
}

function formatPeriodicHint(nextPeriodicDate: string | null): string {
  if (!nextPeriodicDate) return "";
  const diff = differenceInCalendarDays(new Date(nextPeriodicDate), new Date());
  if (diff < 0) return "Vencido";
  if (diff === 0) return "Vence hoje";
  return `Vence em ${diff} dias`;
}

function isPendingDocument(status: string): boolean {
  const normalized = normalizeDocumentStatus(status as DocumentStatus);
  return ["PENDENTE", "VENCIDO", "EM_ELABORACAO", "EM_EMISSAO"].includes(normalized);
}

export function ColaboradorDetailClient({
  collaborator,
  canManage,
  isEmpresaPortal = false,
}: ColaboradorDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const initialTab: TabId =
    tabFromUrl && TABS.some((t) => t.id === tabFromUrl) ? (tabFromUrl as TabId) : "overview";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  useEffect(() => {
    const param = searchParams.get("tab");
    if (param && TABS.some((t) => t.id === param)) {
      setActiveTab(param as TabId);
      return;
    }
    if (!param) setActiveTab("overview");
  }, [searchParams]);

  const [editOpen, setEditOpen] = useState(false);

  useBreadcrumbSegmentLabel(collaborator.id, collaborator.fullName);

  const companyId = collaborator.company?.id ?? "";
  const companyName =
    collaborator.company?.tradeName ?? collaborator.company?.legalName ?? null;

  const setTab = useCallback(
    (tab: TabId) => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/dashboard/colaboradores/${collaborator.id}?${params.toString()}`, {
        scroll: false,
      });
    },
    [collaborator.id, router, searchParams]
  );

  const refresh = () => router.refresh();

  const periodicBadge = getPeriodicExamBadge(collaborator.nextPeriodicDate);
  const timeline = buildCollaboratorTimeline(collaborator);
  const pendingDocsCount = useMemo(
    () => collaborator.documents.filter((d) => isPendingDocument(d.status)).length,
    [collaborator.documents]
  );

  const scheduleHref = `/dashboard/encaminhamentos/novo?patientId=${collaborator.id}${companyId ? `&companyId=${companyId}` : ""}`;

  const returnTo = searchParams.get("returnTo");
  const backHref =
    returnTo && returnTo.startsWith("/dashboard/colaboradores")
      ? returnTo
      : "/dashboard/colaboradores";

  return (
    <PageModule className="colaborador-perfil">
      <Link href={backHref} className="colaborador-perfil-back">
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Voltar para colaboradores
      </Link>

      <header className="colaborador-perfil-header">
        <div className="colaborador-perfil-identity">
          <span className="colaboradores-empresa-avatar colaborador-perfil-avatar" title={collaborator.fullName}>
            {collaboratorInitials(collaborator.fullName)}
          </span>
          <div className="colaborador-perfil-copy">
            <h1 className="colaboradores-empresa-title">{collaborator.fullName}</h1>
            <p className="colaborador-perfil-role">
              {collaboratorRoleLine(collaborator.jobTitle, collaborator.department)}
            </p>
            <div className="colaborador-perfil-meta">
              {companyName && (
                <span>
                  {isEmpresaPortal || !collaborator.company ? (
                    companyName
                  ) : (
                    <Link href={`/dashboard/empresas/${collaborator.company.id}`} className="colaborador-perfil-link">
                      {companyName}
                    </Link>
                  )}
                </span>
              )}
              <span>CPF {formatCPF(collaborator.cpf)}</span>
              <StatusBadge status={collaborator.status} type="collaborator" />
            </div>
          </div>
        </div>

        {canManage && (
          <div className="colaboradores-empresa-header-actions">
            <Link href={scheduleHref} className={cn(buttonVariants({ variant: "brand", size: "sm" }), "rounded-lg")}>
              <Calendar className="mr-2 h-4 w-4" />
              Solicitar exame
            </Link>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar cadastro
            </Button>
          </div>
        )}
      </header>

      <div className="dash-module-tabs colaborador-perfil-tabs" role="tablist" aria-label="Seções do colaborador">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setTab(tab.id)}
            className={cn(
              "dash-module-tab colaborador-perfil-tab",
              activeTab === tab.id && "dash-module-tab-active colaborador-perfil-tab--active"
            )}
          >
            <tab.icon className="mr-1.5 inline h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <OverviewTab
          collaborator={collaborator}
          timeline={timeline}
          pendingDocsCount={pendingDocsCount}
          periodicBadge={periodicBadge}
          canManage={canManage}
          onNavigate={setTab}
          onDefinePeriodic={() => setEditOpen(true)}
        />
      )}
      {activeTab === "referrals" && (
        <ReferralsTab collaborator={collaborator} canManage={canManage} scheduleHref={scheduleHref} />
      )}
      {activeTab === "documents" && <DocumentsTab collaborator={collaborator} />}

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
  pendingDocsCount,
  periodicBadge,
  canManage,
  onNavigate,
  onDefinePeriodic,
}: {
  collaborator: CollaboratorDetailSerialized;
  timeline: ReturnType<typeof buildCollaboratorTimeline>;
  pendingDocsCount: number;
  periodicBadge: ReturnType<typeof getPeriodicExamBadge>;
  canManage: boolean;
  onNavigate: (tab: TabId) => void;
  onDefinePeriodic: () => void;
}) {
  const periodicHint = formatPeriodicHint(collaborator.nextPeriodicDate);
  const openReferrals = collaborator.stats.openReferrals;
  const lastExamText =
    collaborator.stats.lastExamLabel && collaborator.stats.lastExamDate
      ? `${collaborator.stats.lastExamLabel} · ${format(new Date(collaborator.stats.lastExamDate), "dd/MM/yyyy", { locale: ptBR })}`
      : "Nenhum exame registrado";

  const handleSituacaoClick = () => {
    if (pendingDocsCount > 0) onNavigate("documents");
    else if (openReferrals > 0) onNavigate("referrals");
  };

  return (
    <div className="colaborador-perfil-overview">
      <div className="colaborador-perfil-grid colaborador-perfil-grid--2">
        <section className="colaborador-perfil-block">
          <h2 className="colaborador-perfil-block-title">Dados pessoais</h2>
          <dl className="colaborador-perfil-fields">
            <Field label="Nome completo" value={collaborator.fullName} />
            <Field label="CPF" value={formatCPF(collaborator.cpf)} />
            <Field label="RG" value={collaborator.rg ?? "—"} />
            <Field
              label="Data de nascimento"
              value={
                collaborator.birthDate
                  ? format(new Date(collaborator.birthDate), "dd/MM/yyyy", { locale: ptBR })
                  : "—"
              }
            />
            <Field label="Telefone" value={collaborator.phone ? formatPhone(collaborator.phone) : "—"} />
            <Field label="E-mail" value={collaborator.email ?? "—"} />
          </dl>
        </section>

        <section className="colaborador-perfil-block">
          <h2 className="colaborador-perfil-block-title">Dados profissionais</h2>
          <dl className="colaborador-perfil-fields">
            <Field
              label="Empresa"
              value={
                collaborator.company
                  ? collaborator.company.tradeName ?? collaborator.company.legalName
                  : "—"
              }
            />
            <Field label="Função" value={collaborator.jobTitle ?? "—"} />
            <Field label="Setor" value={collaborator.department ?? "—"} />
            <Field
              label="Data de admissão"
              value={
                collaborator.admissionDate
                  ? format(new Date(collaborator.admissionDate), "dd/MM/yyyy", { locale: ptBR })
                  : "—"
              }
            />
            <Field
              label="Cadastrado em"
              value={format(new Date(collaborator.createdAt), "dd/MM/yyyy", { locale: ptBR })}
            />
          </dl>
        </section>
      </div>

      <div className="colaborador-perfil-grid colaborador-perfil-grid--3">
        <div
          role="button"
          tabIndex={0}
          className="colaborador-perfil-highlight"
          onClick={() => onNavigate("referrals")}
          onKeyDown={(e) => e.key === "Enter" && onNavigate("referrals")}
        >
          <span className="colaborador-perfil-highlight-label">Último exame</span>
          <span className="colaborador-perfil-highlight-value">{lastExamText}</span>
        </div>

        <div className="colaborador-perfil-highlight">
          <span className="colaborador-perfil-highlight-label">Próximo periódico</span>
          <span className="colaborador-perfil-highlight-value">
            {collaborator.nextPeriodicDate
              ? format(new Date(collaborator.nextPeriodicDate), "dd/MM/yyyy", { locale: ptBR })
              : "Não definido"}
          </span>
          {periodicHint ? (
            <span
              className={cn(
                "colaborador-perfil-highlight-hint",
                periodicBadge.tone === "danger" && "is-danger",
                periodicBadge.tone === "warning" && "is-warning"
              )}
            >
              {periodicHint}
            </span>
          ) : (
            canManage &&
            !collaborator.nextPeriodicDate && (
              <button
                type="button"
                className="colaboradores-empresa-inline-action colaborador-perfil-define-date"
                onClick={onDefinePeriodic}
              >
                Definir data
              </button>
            )
          )}
        </div>

        <div
          role="button"
          tabIndex={0}
          className="colaborador-perfil-highlight"
          onClick={handleSituacaoClick}
          onKeyDown={(e) => e.key === "Enter" && handleSituacaoClick()}
        >
          <span className="colaborador-perfil-highlight-label">Situação atual</span>
          <div className="colaborador-perfil-situacao">
            {pendingDocsCount > 0 && (
              <span className="colaborador-perfil-situacao-line">
                {pendingDocsCount === 1
                  ? "1 documento pendente"
                  : `${pendingDocsCount} documentos pendentes`}
              </span>
            )}
            {openReferrals > 0 && (
              <span className="colaborador-perfil-situacao-line">
                {openReferrals === 1
                  ? "1 encaminhamento em andamento"
                  : `${openReferrals} encaminhamentos em andamento`}
              </span>
            )}
            {pendingDocsCount === 0 && openReferrals === 0 && (
              <span className="colaboradores-empresa-muted">Tudo em dia</span>
            )}
          </div>
        </div>
      </div>

      <section className="colaborador-perfil-block colaborador-perfil-block--wide">
        <h2 className="colaborador-perfil-block-title">Atividades recentes</h2>
        {timeline.length === 0 ? (
          <InlineEmptyNote>Nenhuma atividade registrada ainda.</InlineEmptyNote>
        ) : (
          <ul className="colaborador-perfil-activity">
            {timeline.slice(0, 8).map((ev) => (
              <li key={ev.id} className="colaborador-perfil-activity-item">
                <div className="colaborador-perfil-activity-head">
                  <span className="colaborador-perfil-activity-title">{ev.title}</span>
                  <time className="colaborador-perfil-activity-date">
                    {format(new Date(ev.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </time>
                </div>
                {ev.subtitle || ev.badgeStatus ? (
                  <div className="colaborador-perfil-activity-meta">
                    {ev.badgeStatus && ev.badgeType && (
                      <StatusBadge status={ev.badgeStatus} type={ev.badgeType} />
                    )}
                    {ev.subtitle && <span className="colaborador-perfil-activity-sub">{ev.subtitle}</span>}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="colaborador-perfil-field-label">{label}</dt>
      <dd className="colaborador-perfil-field-value">{value}</dd>
    </div>
  );
}

function ReferralsTab({
  collaborator,
  canManage,
  scheduleHref,
}: {
  collaborator: CollaboratorDetailSerialized;
  canManage: boolean;
  scheduleHref: string;
}) {
  if (collaborator.referrals.length === 0) {
    return (
      <EmptyState
        compact
        className="colaboradores-empresa-empty"
        title="Nenhum encaminhamento"
        description="Este colaborador ainda não possui encaminhamentos."
        action={
          canManage ? { label: "Solicitar exame", href: scheduleHref } : undefined
        }
      />
    );
  }

  return (
    <div className="colaboradores-empresa-table-wrap">
      <div className="colaboradores-empresa-table-scroll">
        <table className="colaboradores-empresa-table">
          <thead>
            <tr>
              <th>Protocolo</th>
              <th>Tipo de exame</th>
              <th>Solicitação</th>
              <th>Agendamento</th>
              <th>Status</th>
              <th className="colaboradores-empresa-th-actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {collaborator.referrals.map((r) => (
              <tr key={r.id} className="colaboradores-empresa-row">
                <td className="font-medium text-slate-800">{r.protocol}</td>
                <td>
                  {CLINICAL_EXAM_LABELS[r.clinicalExamType as keyof typeof CLINICAL_EXAM_LABELS] ??
                    r.clinicalExamType}
                </td>
                <td>{format(new Date(r.createdAt), "dd/MM/yyyy", { locale: ptBR })}</td>
                <td>
                  {r.scheduledAt
                    ? format(new Date(r.scheduledAt), "dd/MM/yyyy · HH:mm", { locale: ptBR })
                    : "—"}
                </td>
                <td>
                  <StatusBadge status={r.status} type="referral" />
                </td>
                <td className="colaboradores-empresa-td-actions">
                  <Link
                    href={`/dashboard/encaminhamentos?id=${r.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg")}
                  >
                    Ver detalhes
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocumentsTab({ collaborator }: { collaborator: CollaboratorDetailSerialized }) {
  if (collaborator.documents.length === 0) {
    return (
      <EmptyState
        compact
        className="colaboradores-empresa-empty"
        title="Nenhum documento"
        description="Documentos deste colaborador aparecerão aqui."
      />
    );
  }

  return (
    <div className="colaboradores-empresa-table-wrap">
      <div className="colaboradores-empresa-table-scroll">
        <table className="colaboradores-empresa-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Nome</th>
              <th>Validade</th>
              <th>Status</th>
              <th>Data</th>
              <th className="colaboradores-empresa-th-actions">Ação</th>
            </tr>
          </thead>
          <tbody>
            {collaborator.documents.map((d) => {
              const canDownload = Boolean(d.fileUrl);
              return (
                <tr key={d.id} className="colaboradores-empresa-row">
                  <td>
                    {DOCUMENT_TYPE_LABELS[d.type as keyof typeof DOCUMENT_TYPE_LABELS] ?? d.type}
                  </td>
                  <td className="colaboradores-empresa-name">{d.title}</td>
                  <td>
                    {d.validUntil
                      ? format(new Date(d.validUntil), "dd/MM/yyyy", { locale: ptBR })
                      : "—"}
                  </td>
                  <td>
                    <StatusBadge
                      status={normalizeDocumentStatus(d.status as DocumentStatus)}
                      type="document"
                    />
                  </td>
                  <td>{format(new Date(d.createdAt), "dd/MM/yyyy", { locale: ptBR })}</td>
                  <td className="colaboradores-empresa-td-actions">
                    {canDownload ? (
                      <a
                        href={`/api/documents/${d.id}/file`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg")}
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Baixar
                      </a>
                    ) : (
                      <span className="colaborador-perfil-doc-awaiting">Aguardando liberação</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
