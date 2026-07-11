"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  DollarSign,
  MessageCircle,
  Pencil,
  Users,
  Calendar,
  FolderOpen,
  History,
  LayoutDashboard,
  Globe,
  Phone,
  Plus,
  Tags,
  Building2,
  ClipboardList,
  UserPlus,
  ShieldOff,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  MoreHorizontal,
  PanelLeft,
} from "lucide-react";
import type { CompanyDetailSerialized } from "@/lib/companies";
import {
  COMPANY_SIZE_LABELS,
  COMPANY_CONTRACT_LABELS,
  COMPANY_CONTACT_TYPE_LABELS,
  COMPANY_HISTORY_ACTION_LABELS,
  COMPANY_STATUS_LABELS,
  buildCompanyWhatsAppMessage,
  formatCompanyPendingLabel,
} from "@/lib/companies";
import {
  DOCUMENT_TYPE_LABELS,
  normalizeDocumentStatus,
} from "@/lib/documents";
import { CLINICAL_EXAM_LABELS } from "@/types";
import type { DocumentStatus } from "@prisma/client";
import { PageModule } from "@/components/dashboard/PageModule";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCNPJ, formatPhone } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { toggleCompanyPortal } from "@/actions/companies";
import { createUser, updateUser } from "@/actions/users";
import { EditCompanyDialog, CompanyContactDialog } from "./CompanyDialogs";
import { InlineEmptyNote } from "@/components/dashboard/InlineEmptyNote";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useBreadcrumbSegmentLabel } from "@/components/dashboard/BreadcrumbLabelProvider";
import { toast } from "sonner";

type TabId =
  | "overview"
  | "employees"
  | "referrals"
  | "agenda"
  | "documents"
  | "quotes"
  | "contract"
  | "contacts"
  | "portal"
  | "history";

type NavItem = {
  id: TabId;
  label: string;
  icon: typeof LayoutDashboard;
};

type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    id: "overview-group",
    label: "Visão geral",
    items: [{ id: "overview", label: "Visão geral", icon: LayoutDashboard }],
  },
  {
    id: "operation",
    label: "Operação",
    items: [
      { id: "employees", label: "Colaboradores", icon: Users },
      { id: "referrals", label: "Atendimentos", icon: FileText },
      { id: "agenda", label: "Agenda", icon: Calendar },
      { id: "documents", label: "Documentos", icon: FolderOpen },
    ],
  },
  {
    id: "commercial",
    label: "Comercial",
    items: [
      { id: "quotes", label: "Orçamentos", icon: DollarSign },
      { id: "contract", label: "Contrato e preços", icon: Tags },
    ],
  },
  {
    id: "relationship",
    label: "Relacionamento",
    items: [
      { id: "contacts", label: "Contatos", icon: Phone },
      { id: "portal", label: "Portal", icon: Globe },
      { id: "history", label: "Histórico", icon: History },
    ],
  },
];

const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);

function getNavLabel(tab: TabId): string {
  return ALL_NAV_ITEMS.find((item) => item.id === tab)?.label ?? "Visão geral";
}

function isTabId(value: string | null): value is TabId {
  return ALL_NAV_ITEMS.some((item) => item.id === value);
}

type PortalState = "not_configured" | "active" | "suspended";

function getPortalState(company: CompanyDetailSerialized): PortalState {
  if (company.portalEnabled) return "active";
  if (company.portalUsers.length > 0) return "suspended";
  return "not_configured";
}

const PORTAL_STATE_LABELS: Record<PortalState, string> = {
  not_configured: "Portal não configurado",
  active: "Portal ativo",
  suspended: "Portal suspenso",
};

type CompanyDetailClientProps = {
  company: CompanyDetailSerialized;
  canManage: boolean;
  canCommercial: boolean;
};

export function CompanyDetailClient({
  company,
  canManage,
  canCommercial,
}: CompanyDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabId = isTabId(tabParam) ? tabParam : "overview";

  const [editOpen, setEditOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const displayName = company.tradeName ?? company.legalName;
  useBreadcrumbSegmentLabel(company.id, displayName);

  const phone = company.whatsapp ?? company.phone;
  const waUrl = phone
    ? `https://wa.me/55${phone.replace(/\D/g, "")}?text=${encodeURIComponent(buildCompanyWhatsAppMessage(displayName))}`
    : null;

  const setTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/dashboard/empresas/${company.id}?${params.toString()}`);
    setNavOpen(false);
  };

  const refresh = () => router.refresh();

  const handlePortalToggle = async (enabled: boolean) => {
    setPortalBusy(true);
    const result = await toggleCompanyPortal(company.id, enabled);
    setPortalBusy(false);
    if (result.success) {
      toast.success(enabled ? "Portal ativado" : "Portal suspenso");
      refresh();
      return true;
    }
    toast.error(result.error);
    return false;
  };

  const cityLine = [company.city, company.state].filter(Boolean).join("/") || null;

  return (
    <PageModule className="empresa-perfil">
      <header className="colaborador-perfil-header empresa-perfil-header">
        <div className="colaborador-perfil-identity">
          <div className="colaborador-perfil-avatar empresa-perfil-avatar" aria-hidden>
            <Building2 className="h-5 w-5" />
          </div>
          <div className="colaborador-perfil-copy">
            <h1 className="colaboradores-empresa-title">{company.legalName}</h1>
            <p className="colaborador-perfil-role">
              {company.tradeName ?? "Sem nome fantasia"}
            </p>
            <div className="colaborador-perfil-meta">
              <span className="empresas-clinica-cnpj">CNPJ {formatCNPJ(company.cnpj)}</span>
              {cityLine ? <span>{cityLine}</span> : null}
              <StatusBadge status={company.status} type="company" />
            </div>
          </div>
        </div>

        <div className="colaboradores-empresa-header-actions empresa-perfil-actions">
          {canManage && (
            <Link
              href={`/dashboard/encaminhamentos/novo?companyId=${company.id}`}
              className={cn(buttonVariants({ variant: "brand", size: "sm" }), "rounded-lg")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Criar atendimento
            </Link>
          )}
          {canManage && canCommercial && (
            <Link
              href={`/dashboard/orcamentos?companyId=${company.id}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-lg empresa-perfil-action-secondary"
              )}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Novo orçamento
            </Link>
          )}
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg empresa-perfil-action-secondary"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar cadastro
            </Button>
          )}
          {(waUrl || canManage) && (
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    aria-label="Mais ações"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                }
              />
              <PopoverContent className="collaborator-action-menu w-60 p-1.5" align="end" sideOffset={6}>
                {waUrl && (
                  <button
                    type="button"
                    className="collaborator-action-item"
                    onClick={() => window.open(waUrl, "_blank", "noopener,noreferrer")}
                  >
                    <span className="collaborator-action-icon collaborator-action-icon--schedule">
                      <MessageCircle className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="collaborator-action-label">WhatsApp</span>
                      <span className="collaborator-action-hint">Contato rápido da empresa</span>
                    </span>
                  </button>
                )}
                {canManage && canCommercial && (
                  <button
                    type="button"
                    className="collaborator-action-item empresa-perfil-action-menu-mobile"
                    onClick={() => router.push(`/dashboard/orcamentos?companyId=${company.id}`)}
                  >
                    <span className="collaborator-action-icon collaborator-action-icon--quote">
                      <DollarSign className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="collaborator-action-label">Novo orçamento</span>
                      <span className="collaborator-action-hint">Proposta comercial</span>
                    </span>
                  </button>
                )}
                {canManage && (
                  <button
                    type="button"
                    className="collaborator-action-item empresa-perfil-action-menu-mobile"
                    onClick={() => setEditOpen(true)}
                  >
                    <span className="collaborator-action-icon collaborator-action-icon--docs">
                      <Pencil className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="collaborator-action-label">Editar cadastro</span>
                      <span className="collaborator-action-hint">Dados e responsável</span>
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  className="collaborator-action-item"
                  onClick={() => setTab("portal")}
                >
                  <span className="collaborator-action-icon collaborator-action-icon--portal">
                    <Globe className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="collaborator-action-label">Gerenciar portal</span>
                    <span className="collaborator-action-hint">Acesso do RH da empresa</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="collaborator-action-item"
                  onClick={() => setTab("contacts")}
                >
                  <span className="collaborator-action-icon collaborator-action-icon--view">
                    <Phone className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="collaborator-action-label">Contatos</span>
                    <span className="collaborator-action-hint">Agenda de contatos</span>
                  </span>
                </button>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </header>

      <div className="empresa-perfil-layout">
        <aside className="empresa-perfil-nav" aria-label="Menu da empresa">
          <CompanySectionNav activeTab={activeTab} onNavigate={setTab} />
        </aside>

        <div className="empresa-perfil-main">
          <div className="empresa-perfil-nav-mobile-bar">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg empresa-perfil-nav-mobile-btn"
              onClick={() => setNavOpen(true)}
            >
              <PanelLeft className="mr-2 h-4 w-4" />
              Seções da empresa
              <span className="empresa-perfil-nav-mobile-current">{getNavLabel(activeTab)}</span>
            </Button>
          </div>

          <div className="empresa-perfil-body">
            {activeTab === "overview" && (
              <OverviewTab company={company} onNavigate={setTab} />
            )}
            {activeTab === "employees" && (
              <EmployeesTab company={company} canManage={canManage} />
            )}
            {activeTab === "referrals" && (
              <ReferralsTab company={company} canManage={canManage} />
            )}
            {activeTab === "agenda" && (
              <AgendaTab company={company} canManage={canManage} />
            )}
            {activeTab === "documents" && <DocumentsTab company={company} />}
            {activeTab === "quotes" && (
              <QuotesTab company={company} canCommercial={canCommercial} />
            )}
            {activeTab === "contract" && (
              <ContractTab company={company} canCommercial={canCommercial} />
            )}
            {activeTab === "contacts" && (
              <ContactsTab
                company={company}
                canManage={canManage}
                onAddContact={() => setContactOpen(true)}
              />
            )}
            {activeTab === "portal" && (
              <PortalTab
                company={company}
                canManage={canManage}
                busy={portalBusy}
                onToggle={handlePortalToggle}
                onRefresh={refresh}
              />
            )}
            {activeTab === "history" && <HistoryTab company={company} />}
          </div>
        </div>
      </div>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="empresa-perfil-nav-sheet p-0" showCloseButton>
          <SheetHeader className="empresa-perfil-nav-sheet-header">
            <SheetTitle>Seções da empresa</SheetTitle>
          </SheetHeader>
          <div className="empresa-perfil-nav-sheet-body">
            <CompanySectionNav activeTab={activeTab} onNavigate={setTab} />
          </div>
        </SheetContent>
      </Sheet>

      <EditCompanyDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        companyId={company.id}
        company={{
          legalName: company.legalName,
          tradeName: company.tradeName,
          cnpj: company.cnpj,
          whatsapp: company.whatsapp,
          email: company.email,
          phone: company.phone,
          responsibleName: company.responsibleName,
          notes: company.notes,
          status: company.status,
        }}
        onSuccess={refresh}
      />
      <CompanyContactDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        companyId={company.id}
        onSuccess={refresh}
      />
    </PageModule>
  );
}

function CompanySectionNav({
  activeTab,
  onNavigate,
}: {
  activeTab: TabId;
  onNavigate: (tab: TabId) => void;
}) {
  return (
    <nav className="empresa-perfil-nav-list">
      {NAV_SECTIONS.map((section) => (
        <div key={section.id} className="empresa-perfil-nav-group">
          <p className="empresa-perfil-nav-group-label">{section.label}</p>
          <ul className="empresa-perfil-nav-items">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cn(
                      "empresa-perfil-nav-item",
                      isActive && "empresa-perfil-nav-item--active"
                    )}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => onNavigate(item.id)}
                  >
                    <Icon className="empresa-perfil-nav-item-icon" aria-hidden />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function OverviewTab({
  company,
  onNavigate,
}: {
  company: CompanyDetailSerialized;
  onNavigate: (tab: TabId) => void;
}) {
  const portalState = getPortalState(company);
  const stats = [
    {
      key: "employees",
      label: "Colaboradores",
      value: company.stats.employees,
      hint: "Cadastros vinculados",
      tone: "primary" as const,
      icon: Users,
      tab: "employees" as TabId,
    },
    {
      key: "open_referrals",
      label: "Atendimentos em aberto",
      value: company.stats.openReferrals,
      hint: "Em andamento",
      tone: "warning" as const,
      icon: ClipboardList,
      tab: "referrals" as TabId,
    },
    {
      key: "upcoming_appointments",
      label: "Agendamentos futuros",
      value: company.stats.upcomingAppointments,
      hint: "Próximas datas",
      tone: "primary" as const,
      icon: Calendar,
      tab: "agenda" as TabId,
    },
    {
      key: "pending_documents",
      label: "Documentos pendentes",
      value: company.stats.pendingDocuments,
      hint: "A regularizar",
      tone: "warning" as const,
      icon: FolderOpen,
      tab: "documents" as TabId,
    },
  ];

  const address =
    [company.address, company.city, company.state, company.zipCode].filter(Boolean).join(", ") ||
    "—";

  const now = Date.now();
  const nextAppointment = [...company.appointments]
    .filter((a) => new Date(a.scheduledAt).getTime() >= now)
    .sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )[0];

  const availableDocuments = company.documents.filter(
    (d) => normalizeDocumentStatus(d.status as DocumentStatus) === "DISPONIVEL"
  ).length;

  const availableDocumentsLabel =
    availableDocuments <= 0
      ? "Nenhum disponível"
      : availableDocuments === 1
        ? "1 disponível"
        : `${availableDocuments} disponíveis`;

  return (
    <div className="colaborador-perfil-overview empresa-perfil-overview">
      <div className="colaboradores-empresa-stats empresa-perfil-stats">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onNavigate(s.tab)}
              className="colaboradores-empresa-stat colaboradores-empresa-stat--clickable"
            >
              <span
                className={cn(
                  "colaboradores-empresa-stat-icon",
                  `colaboradores-empresa-stat-icon--${s.tone}`
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="colaboradores-empresa-stat-body">
                <span className="colaboradores-empresa-stat-value">{s.value}</span>
                <span className="colaboradores-empresa-stat-title">{s.label}</span>
                <span className="colaboradores-empresa-stat-hint">{s.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="empresa-perfil-summary" role="note">
        <div className="empresa-perfil-summary-item">
          <span className="empresa-perfil-summary-label">Último atendimento</span>
          <span className="empresa-perfil-summary-value">
            {company.stats.lastAppointmentAt
              ? format(new Date(company.stats.lastAppointmentAt), "dd/MM/yyyy", {
                  locale: ptBR,
                })
              : "—"}
          </span>
        </div>
        <div className="empresa-perfil-summary-item">
          <span className="empresa-perfil-summary-label">Próximo agendamento</span>
          <span className="empresa-perfil-summary-value">
            {nextAppointment
              ? format(new Date(nextAppointment.scheduledAt), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })
              : "—"}
          </span>
        </div>
        <div className="empresa-perfil-summary-item">
          <span className="empresa-perfil-summary-label">Pendências</span>
          <span className="empresa-perfil-summary-value">
            {formatCompanyPendingLabel(company.stats.pendingDocuments)}
          </span>
        </div>
        <div className="empresa-perfil-summary-item">
          <span className="empresa-perfil-summary-label">Documentos disponíveis</span>
          <span className="empresa-perfil-summary-value">{availableDocumentsLabel}</span>
        </div>
        <div className="empresa-perfil-summary-item">
          <span className="empresa-perfil-summary-label">Última atualização</span>
          <span className="empresa-perfil-summary-value">
            {format(new Date(company.updatedAt), "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>

      <div className="colaborador-perfil-grid colaborador-perfil-grid--3 empresa-perfil-blocks">
        <section className="colaborador-perfil-block">
          <h2 className="colaborador-perfil-block-title">Dados da empresa</h2>
          <dl className="colaborador-perfil-fields">
            <Field label="Razão social" value={company.legalName} />
            <Field label="Nome fantasia" value={company.tradeName ?? "—"} />
            <Field label="CNPJ" value={formatCNPJ(company.cnpj)} />
            <Field label="Inscrição estadual" value={company.stateRegistration ?? "—"} />
            <Field label="Endereço" value={address} />
            <Field label="Segmento" value={company.segment ?? "—"} />
          </dl>
        </section>

        <section className="colaborador-perfil-block">
          <h2 className="colaborador-perfil-block-title">Responsável e contatos</h2>
          <dl className="colaborador-perfil-fields">
            <Field label="Responsável" value={company.responsibleName ?? "—"} />
            <Field label="Cargo" value={company.responsibleRole ?? "—"} />
            <Field
              label="WhatsApp"
              value={company.whatsapp ? formatPhone(company.whatsapp) : "—"}
            />
            <Field label="Telefone" value={company.phone ? formatPhone(company.phone) : "—"} />
            <Field label="E-mail" value={company.email ?? "—"} />
            {company.notes ? <Field label="Observações internas" value={company.notes} /> : null}
          </dl>
        </section>

        <section className="colaborador-perfil-block">
          <h2 className="colaborador-perfil-block-title">Contrato, portal e situação cadastral</h2>
          <dl className="colaborador-perfil-fields">
            <Field
              label="Porte"
              value={company.size ? COMPANY_SIZE_LABELS[company.size] : "—"}
            />
            <Field
              label="Contrato"
              value={
                company.contractType ? COMPANY_CONTRACT_LABELS[company.contractType] : "—"
              }
            />
            <Field label="Status cadastral" value={COMPANY_STATUS_LABELS[company.status]} />
            <Field label="Portal" value={PORTAL_STATE_LABELS[portalState]} />
            <Field
              label="Cadastro em"
              value={format(new Date(company.createdAt), "dd/MM/yyyy", { locale: ptBR })}
            />
          </dl>
        </section>
      </div>
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

function EmployeesTab({
  company,
  canManage,
}: {
  company: CompanyDetailSerialized;
  canManage: boolean;
}) {
  return (
    <div>
      {canManage && (
        <div className="mb-4 flex gap-2">
          <Link
            href={`/dashboard/colaboradores?new=1&companyId=${company.id}`}
            className={cn(buttonVariants({ variant: "brand", size: "sm" }), "rounded-lg")}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Novo colaborador
          </Link>
        </div>
      )}
      {company.employees.length === 0 ? (
        <InlineEmptyNote>Nenhum colaborador cadastrado.</InlineEmptyNote>
      ) : (
        <div className="colaboradores-empresa-table-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Último exame</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {company.employees.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/colaboradores/${e.id}`}
                      className="text-[var(--brand-green)] hover:underline"
                    >
                      {e.fullName}
                    </Link>
                  </TableCell>
                  <TableCell>{e.cpf}</TableCell>
                  <TableCell>{e.jobTitle ?? "—"}</TableCell>
                  <TableCell>{e.department ?? "—"}</TableCell>
                  <TableCell>
                    {e.lastReferralAt
                      ? format(new Date(e.lastReferralAt), "dd/MM/yyyy", { locale: ptBR })
                      : "—"}
                  </TableCell>
                  <TableCell>{e.status === "ATIVO" ? "Ativo" : e.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ReferralsTab({
  company,
  canManage,
}: {
  company: CompanyDetailSerialized;
  canManage: boolean;
}) {
  if (company.referrals.length === 0) {
    return (
      <EmptyState
        compact
        title="Nenhum atendimento"
        description="Esta empresa ainda não possui atendimentos registrados."
        action={
          canManage
            ? {
                label: "Criar atendimento",
                href: `/dashboard/encaminhamentos/novo?companyId=${company.id}`,
              }
            : undefined
        }
      />
    );
  }
  return (
    <div className="colaboradores-empresa-table-scroll">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Protocolo</TableHead>
            <TableHead>Colaborador</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Agendamento</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {company.referrals.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <Link
                  href={`/dashboard/encaminhamentos?id=${r.id}`}
                  className="text-[var(--brand-green)] hover:underline"
                >
                  {r.protocol}
                </Link>
              </TableCell>
              <TableCell>{r.employeeName}</TableCell>
              <TableCell>
                {CLINICAL_EXAM_LABELS[r.clinicalExamType] ?? r.clinicalExamType}
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
    </div>
  );
}

function AgendaTab({
  company,
  canManage,
}: {
  company: CompanyDetailSerialized;
  canManage: boolean;
}) {
  if (company.appointments.length === 0) {
    return (
      <EmptyState
        compact
        title="Nenhum agendamento"
        description="Não há agendamentos vinculados a esta empresa."
        action={
          canManage
            ? { label: "Agendar atendimento", href: `/dashboard/agenda?companyId=${company.id}` }
            : undefined
        }
      />
    );
  }
  return (
    <div className="colaboradores-empresa-table-scroll">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Horário</TableHead>
            <TableHead>Colaborador</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Protocolo</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {company.appointments.map((a) => (
            <TableRow key={a.id}>
              <TableCell>
                {format(new Date(a.scheduledAt), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <Link
                  href={`/dashboard/agenda?id=${a.id}`}
                  className="text-[var(--brand-green)] hover:underline"
                >
                  {format(new Date(a.scheduledAt), "HH:mm", { locale: ptBR })}
                </Link>
              </TableCell>
              <TableCell>{a.employeeName ?? "—"}</TableCell>
              <TableCell>
                {a.clinicalExamType ? CLINICAL_EXAM_LABELS[a.clinicalExamType] : "—"}
              </TableCell>
              <TableCell>{a.protocol ?? "—"}</TableCell>
              <TableCell>
                <StatusBadge status={a.status} type="appointment" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DocumentsTab({ company }: { company: CompanyDetailSerialized }) {
  return company.documents.length === 0 ? (
    <div className="space-y-4">
      <InlineEmptyNote>Nenhum documento vinculado.</InlineEmptyNote>
      <Link
        href={`/dashboard/documentos?companyId=${company.id}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg")}
      >
        <Plus className="mr-2 h-4 w-4" /> Anexar documento
      </Link>
    </div>
  ) : (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href={`/dashboard/documentos?companyId=${company.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg")}
        >
          Ver na central de documentos
        </Link>
      </div>
      <div className="colaboradores-empresa-table-scroll">
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
            {company.documents.map((d) => (
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
                      className="text-[var(--brand-green)] hover:underline"
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
                  <StatusBadge
                    status={normalizeDocumentStatus(
                      d.status as import("@prisma/client").DocumentStatus
                    )}
                    type="document"
                  />
                </TableCell>
                <TableCell>
                  {format(new Date(d.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function QuotesTab({
  company,
  canCommercial,
}: {
  company: CompanyDetailSerialized;
  canCommercial: boolean;
}) {
  if (company.quotes.length === 0) {
    return (
      <EmptyState
        compact
        title="Nenhum orçamento"
        description="Orçamentos vinculados a esta empresa aparecerão aqui."
        action={
          canCommercial
            ? { label: "Novo orçamento", href: `/dashboard/orcamentos?companyId=${company.id}` }
            : undefined
        }
      />
    );
  }
  return (
    <div className="colaboradores-empresa-table-scroll">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Validade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {company.quotes.map((q) => (
            <TableRow key={q.id}>
              <TableCell>
                <Link
                  href={`/dashboard/orcamentos?id=${q.id}`}
                  className="text-[var(--brand-green)] hover:underline"
                >
                  {q.quoteNumber ?? q.id.slice(-6).toUpperCase()}
                </Link>
              </TableCell>
              <TableCell>{q.serviceTitle ?? "—"}</TableCell>
              <TableCell>
                {q.estimatedValue != null
                  ? q.estimatedValue.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  : "—"}
              </TableCell>
              <TableCell>
                <StatusBadge status={q.status} type="quote" />
              </TableCell>
              <TableCell>
                {format(new Date(q.createdAt), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell>
                {q.validUntil
                  ? format(new Date(q.validUntil), "dd/MM/yyyy", { locale: ptBR })
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ContractTab({
  company,
  canCommercial,
}: {
  company: CompanyDetailSerialized;
  canCommercial: boolean;
}) {
  return (
    <div className="space-y-4">
      <section className="colaborador-perfil-block">
        <h2 className="colaborador-perfil-block-title">Contrato</h2>
        <dl className="colaborador-perfil-fields">
          <Field
            label="Tipo de contrato"
            value={
              company.contractType
                ? COMPANY_CONTRACT_LABELS[company.contractType]
                : "Não definido"
            }
          />
          <Field label="Status comercial" value={COMPANY_STATUS_LABELS[company.status]} />
          <Field label="Portal empresarial" value={PORTAL_STATE_LABELS[getPortalState(company)]} />
        </dl>
      </section>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--brand-navy)]">Preços negociados</h3>
        {canCommercial && (
          <Link
            href={`/dashboard/tabela-precos?companyId=${company.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg")}
          >
            Gerenciar na tabela de preços
          </Link>
        )}
      </div>

      {company.priceListItems.length === 0 ? (
        <InlineEmptyNote>
          Nenhum preço específico para esta empresa. Os valores padrão da clínica serão aplicados.
        </InlineEmptyNote>
      ) : (
        <div className="colaboradores-empresa-table-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Cobrança</TableHead>
                <TableHead>Preço</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {company.priceListItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.chargeType}</TableCell>
                  <TableCell>
                    {item.price.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ContactsTab({
  company,
  canManage,
  onAddContact,
}: {
  company: CompanyDetailSerialized;
  canManage: boolean;
  onAddContact: () => void;
}) {
  return (
    <div className="space-y-4">
      {canManage && (
        <Button variant="brand" size="sm" className="rounded-lg" onClick={onAddContact}>
          <Plus className="mr-1.5 h-4 w-4" /> Registrar contato
        </Button>
      )}
      {company.siteMessages.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-[var(--brand-navy)]">
            Mensagens do site
          </h3>
          <ul className="space-y-2">
            {company.siteMessages.map((m) => (
              <li key={m.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                <p className="font-medium">{m.subject}</p>
                <p className="text-slate-500">{m.name}</p>
                <StatusBadge status={m.status} type="contact" />
              </li>
            ))}
          </ul>
        </div>
      )}
      {company.contacts.length === 0 && company.siteMessages.length === 0 ? (
        <InlineEmptyNote>Nenhum contato registrado.</InlineEmptyNote>
      ) : (
        <ul className="referral-history-list">
          {company.contacts.map((c) => (
            <li key={c.id} className="referral-history-item">
              <div className="flex justify-between">
                <span className="text-sm font-medium">
                  {COMPANY_CONTACT_TYPE_LABELS[
                    c.type as keyof typeof COMPANY_CONTACT_TYPE_LABELS
                  ] ?? c.type}
                  {c.title ? ` — ${c.title}` : ""}
                </span>
                <span className="text-xs text-slate-400">
                  {format(new Date(c.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              </div>
              {c.performedByName && (
                <p className="text-xs text-slate-500">Por: {c.performedByName}</p>
              )}
              <p className="mt-1 text-sm text-slate-600">{c.notes}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PortalTab({
  company,
  canManage,
  busy,
  onToggle,
  onRefresh,
}: {
  company: CompanyDetailSerialized;
  canManage: boolean;
  busy: boolean;
  onToggle: (enabled: boolean) => Promise<boolean>;
  onRefresh: () => void;
}) {
  const portalState = getPortalState(company);
  const primaryUser = company.portalUsers[0] ?? null;
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [name, setName] = useState(company.responsibleName ?? "");
  const [email, setEmail] = useState(company.email ?? "");
  const [password, setPassword] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const configurePortal = async () => {
    const ok = company.portalEnabled ? true : await onToggle(true);
    if (ok) setShowCreateUser(true);
  };

  const handleCreateUser = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Preencha nome, e-mail e senha do responsável.");
      return;
    }
    setSaving(true);
    if (!company.portalEnabled) {
      const enabled = await onToggle(true);
      if (!enabled) {
        setSaving(false);
        return;
      }
    }
    const result = await createUser({
      name: name.trim(),
      email: email.trim(),
      password,
      role: "COMPANY_HR",
      companyId: company.id,
    });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Usuário do RH criado");
    setPassword("");
    setShowCreateUser(false);
    onRefresh();
  };

  const handleResetAccess = async () => {
    if (!resetUserId || !resetPassword.trim()) {
      toast.error("Informe a nova senha.");
      return;
    }
    setSaving(true);
    const result = await updateUser({ id: resetUserId, password: resetPassword });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Acesso redefinido");
    setResetPassword("");
    setResetUserId(null);
  };

  if (portalState === "not_configured" && !showCreateUser) {
    return (
      <div className="empresa-portal-empty">
        <div className="empresa-portal-empty-icon" aria-hidden>
          <Globe className="h-5 w-5" />
        </div>
        <h2 className="empresa-portal-empty-title">Portal ainda não configurado</h2>
        <p className="empresa-portal-empty-text">
          Configure o acesso para que o RH da empresa acompanhe colaboradores, exames e
          documentos.
        </p>
        <ol className="empresa-portal-steps">
          <li>Ativar o portal da empresa</li>
          <li>Criar o usuário responsável do RH</li>
        </ol>
        {canManage && (
          <Button
            variant="brand"
            size="sm"
            className="rounded-lg"
            disabled={busy}
            onClick={configurePortal}
          >
            Configurar acesso ao portal
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="colaborador-perfil-block">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="colaborador-perfil-block-title">Status do portal</h2>
            <div className="mt-2 flex items-center gap-2">
              {portalState === "active" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />
              )}
              <span className="text-sm font-semibold text-[var(--brand-navy)]">
                {PORTAL_STATE_LABELS[portalState]}
              </span>
            </div>
          </div>
          {canManage && portalState !== "not_configured" && (
            <div className="flex flex-wrap gap-2">
              {portalState === "active" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  disabled={busy}
                  onClick={() => onToggle(false)}
                >
                  <ShieldOff className="mr-1.5 h-4 w-4" /> Suspender portal
                </Button>
              ) : (
                <Button
                  variant="brand"
                  size="sm"
                  className="rounded-lg"
                  disabled={busy}
                  onClick={() => onToggle(true)}
                >
                  Reativar portal
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => setShowCreateUser(true)}
              >
                <UserPlus className="mr-1.5 h-4 w-4" /> Adicionar usuário
              </Button>
            </div>
          )}
        </div>

        <dl className="colaborador-perfil-fields mt-4">
          <Field label="Usuários vinculados" value={String(company.portalUsers.length)} />
          <Field label="Responsável" value={primaryUser?.name ?? "—"} />
          <Field label="E-mail" value={primaryUser?.email ?? company.email ?? "—"} />
          <Field label="Último acesso" value="—" />
        </dl>
      </section>

      {(showCreateUser || portalState === "not_configured") && canManage && (
        <section className="colaborador-perfil-block">
          <h2 className="colaborador-perfil-block-title">Criar usuário do RH</h2>
          <p className="mb-3 text-xs text-slate-500">
            Após ativar o portal, crie o acesso do responsável para o RH entrar no sistema.
          </p>
          <div className="empresa-portal-form">
            <Input
              placeholder="Nome do responsável"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              type="email"
              placeholder="E-mail de acesso"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Senha inicial"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="brand"
                size="sm"
                className="rounded-lg"
                disabled={saving || busy}
                onClick={handleCreateUser}
              >
                Criar usuário do RH
              </Button>
              {portalState !== "not_configured" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setShowCreateUser(false)}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {company.portalUsers.length > 0 && (
        <section className="colaborador-perfil-block">
          <h2 className="colaborador-perfil-block-title">Usuários vinculados</h2>
          <div className="colaboradores-empresa-table-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.portalUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.status === "ACTIVE" ? "Ativo" : "Inativo"}</TableCell>
                    <TableCell>
                      {format(new Date(u.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => {
                            setResetUserId(u.id);
                            setResetPassword("");
                          }}
                        >
                          <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                          Redefinir
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {resetUserId && canManage && (
        <section className="colaborador-perfil-block">
          <h2 className="colaborador-perfil-block-title">Redefinir acesso</h2>
          <div className="empresa-portal-form">
            <Input
              type="password"
              placeholder="Nova senha"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="brand"
                size="sm"
                className="rounded-lg"
                disabled={saving}
                onClick={handleResetAccess}
              >
                Salvar nova senha
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg"
                onClick={() => setResetUserId(null)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function HistoryTab({ company }: { company: CompanyDetailSerialized }) {
  return company.history.length === 0 ? (
    <InlineEmptyNote>Nenhum registro no histórico.</InlineEmptyNote>
  ) : (
    <ul className="referral-history-list">
      {company.history.map((h) => (
        <li key={h.id} className="referral-history-item">
          <div className="flex justify-between">
            <span className="text-sm font-medium">
              {COMPANY_HISTORY_ACTION_LABELS[h.action] ?? h.action}
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
