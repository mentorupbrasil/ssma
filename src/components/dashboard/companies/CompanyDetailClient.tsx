"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { differenceInDays, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  DollarSign,
  FileText,
  Globe,
  KeyRound,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldOff,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import type { CompanyDetailSerialized } from "@/lib/companies";
import {
  COMPANY_SIZE_LABELS,
  COMPANY_CONTRACT_LABELS,
  COMPANY_HISTORY_ACTION_LABELS,
  COMPANY_STATUS_LABELS,
  buildCompanyWhatsAppMessage,
  formatCompanyPendingLabel,
} from "@/lib/companies";
import {
  DOCUMENT_TYPE_LABELS,
  CLINICAL_DOCUMENT_TYPES,
  normalizeDocumentStatus,
} from "@/lib/documents";
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
import { formatCNPJ, formatPhone } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { toggleCompanyPortal } from "@/actions/companies";
import {
  updateCompanyPackageItem,
  removeCompanyPackageItem,
} from "@/actions/pricing";
import { createUser, updateUser } from "@/actions/users";
import { EditCompanyDialog } from "./CompanyDialogs";
import { CompanyExamPackageDialog } from "./CompanyExamPackageDialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  SystemActionMenu,
  type SystemActionItem,
} from "@/components/dashboard/SystemActionMenu";
import {
  SystemModalField,
  SystemModalShell,
} from "@/components/dashboard/SystemModalShell";
import { useBreadcrumbSegmentLabel } from "@/components/dashboard/BreadcrumbLabelProvider";
import { toast } from "sonner";
import type { CompanyHistoryAction } from "@prisma/client";
import type { DocumentType } from "@prisma/client";
import { PRICE_STATUS_LABELS, formatCurrency } from "@/lib/pricing";

type TabId =
  | "overview"
  | "employees"
  | "documents"
  | "contract"
  | "portal"
  | "history";

const COMPANY_TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Visão geral" },
  { id: "employees", label: "Colaboradores" },
  { id: "documents", label: "Documentos" },
  { id: "contract", label: "Contrato e exames" },
  { id: "portal", label: "Portal" },
  { id: "history", label: "Histórico" },
];

const LEGACY_TABS = ["contacts", "quotes", "referrals", "agenda"] as const;

function isTabId(value: string | null): value is TabId {
  return COMPANY_TABS.some((item) => item.id === value);
}

function resolveTab(tabParam: string | null): TabId {
  if (!tabParam) return "overview";
  if ((LEGACY_TABS as readonly string[]).includes(tabParam)) return "overview";
  if (isTabId(tabParam)) return tabParam;
  return "overview";
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

const PORTAL_STATE_SHORT_LABELS: Record<PortalState, string> = {
  not_configured: "Não configurado",
  active: "Ativo",
  suspended: "Suspenso",
};

function displayValue(value: string | null | undefined): string {
  return value?.trim() ? value.trim() : "Não informado";
}

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
  const activeTab = resolveTab(tabParam);

  const [editOpen, setEditOpen] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);

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
  };

  useEffect(() => {
    if (!tabParam || !(LEGACY_TABS as readonly string[]).includes(tabParam)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "overview");
    router.replace(`/dashboard/empresas/${company.id}?${params.toString()}`);
    // Apenas quando o tab legado muda — evita replace em loop por identidade de searchParams
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam, company.id]);

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
      <header className="empresa-perfil-header">
        <div className="empresa-perfil-identity">
          <div className="empresa-perfil-avatar" aria-hidden>
            <Building2 className="h-4 w-4" />
          </div>
          <div className="empresa-perfil-copy">
            <div className="empresa-perfil-title-row">
              <h1 className="empresa-perfil-title">{company.legalName}</h1>
              {company.tradeName ? (
                <span className="empresa-perfil-trade">{company.tradeName}</span>
              ) : null}
            </div>
            <div className="empresa-perfil-meta">
              <span className="empresas-clinica-cnpj">CNPJ {formatCNPJ(company.cnpj)}</span>
              {cityLine ? <span>{cityLine}</span> : null}
              <StatusBadge status={company.status} type="company" />
            </div>
          </div>
        </div>

        <div className="empresa-perfil-actions">
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              className="empresa-perfil-btn empresa-perfil-action-secondary"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Editar cadastro
            </Button>
          )}
          <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="empresa-perfil-btn-icon"
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
                {canCommercial && (
                  <button
                    type="button"
                    className="collaborator-action-item"
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
                <button
                  type="button"
                  className="collaborator-action-item"
                  onClick={() =>
                    router.push(`/dashboard/encaminhamentos?companyId=${company.id}`)
                  }
                >
                  <span className="collaborator-action-icon collaborator-action-icon--schedule">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="collaborator-action-label">Ver na fila</span>
                    <span className="collaborator-action-hint">Atendimentos desta empresa</span>
                  </span>
                </button>
              </PopoverContent>
          </Popover>
        </div>
      </header>

      <nav className="empresa-perfil-tabs" aria-label="Seções da empresa">
        {COMPANY_TABS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={cn("empresa-perfil-tab", isActive && "empresa-perfil-tab--active")}
              aria-current={isActive ? "page" : undefined}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="empresa-perfil-body">
        {activeTab === "overview" && (
          <OverviewTab company={company} onNavigate={setTab} />
        )}
        {activeTab === "employees" && (
          <EmployeesTab company={company} canManage={canManage} />
        )}
        {activeTab === "documents" && <DocumentsTab company={company} />}
        {activeTab === "contract" && (
          <ContractTab
            company={company}
            canCommercial={canCommercial}
            onRefresh={refresh}
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
    </PageModule>
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
      value: String(company.stats.employees),
      tab: "employees" as TabId,
      icon: Users,
    },
    {
      key: "pending_documents",
      label: "Pendências",
      value: String(company.stats.pendingDocuments),
      tab: "documents" as TabId,
      icon: AlertTriangle,
    },
    {
      key: "contract",
      label: "Contrato",
      value: company.contractType
        ? COMPANY_CONTRACT_LABELS[company.contractType]
        : "Não definido",
      tab: "contract" as TabId,
      isText: true,
      icon: FileText,
    },
    {
      key: "portal",
      label: "Portal",
      value: PORTAL_STATE_SHORT_LABELS[portalState],
      tab: "portal" as TabId,
      isText: true,
      icon: Globe,
    },
  ];

  const addressParts = [company.address, company.city, company.state, company.zipCode].filter(
    Boolean
  );
  const address = addressParts.length > 0 ? addressParts.join(", ") : "Não informado";

  return (
    <div className="empresa-perfil-overview">
      <div className="empresa-perfil-kpis">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onNavigate(s.tab)}
              className="empresa-perfil-kpi"
            >
              <span className="empresa-perfil-kpi-icon" aria-hidden>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="empresa-perfil-kpi-content">
                <span
                  className={cn(
                    "empresa-perfil-kpi-value",
                    "isText" in s && s.isText && "empresa-perfil-kpi-value--text"
                  )}
                >
                  {s.value}
                </span>
                <span className="empresa-perfil-kpi-label">{s.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="empresa-perfil-columns">
        <div className="empresa-perfil-main-col">
          <section className="empresa-erp-panel">
            <h2 className="empresa-erp-panel-title">Dados cadastrais</h2>
            <dl className="empresa-erp-fields">
              <FieldRow label="Razão social" value={displayValue(company.legalName)} />
              <FieldRow label="Nome fantasia" value={displayValue(company.tradeName)} />
              <FieldRow label="CNPJ" value={formatCNPJ(company.cnpj)} />
              <FieldRow
                label="Inscrição estadual"
                value={displayValue(company.stateRegistration)}
              />
              <FieldRow label="Endereço" value={address} />
              <FieldRow label="Segmento" value={displayValue(company.segment)} />
              <FieldRow
                label="Porte"
                value={
                  company.size ? COMPANY_SIZE_LABELS[company.size] : "Não informado"
                }
              />
              <FieldRow
                label="Cadastro em"
                value={format(new Date(company.createdAt), "dd/MM/yyyy", { locale: ptBR })}
              />
            </dl>
          </section>

          <section className="empresa-erp-panel">
            <h2 className="empresa-erp-panel-title">Responsável e contatos</h2>
            <dl className="empresa-erp-fields">
              <FieldRow label="Responsável" value={displayValue(company.responsibleName)} />
              <FieldRow label="Cargo" value={displayValue(company.responsibleRole)} />
              <FieldRow
                label="WhatsApp"
                value={
                  company.whatsapp ? formatPhone(company.whatsapp) : "Não informado"
                }
              />
              <FieldRow
                label="Telefone"
                value={company.phone ? formatPhone(company.phone) : "Não informado"}
              />
              <FieldRow label="E-mail" value={displayValue(company.email)} />
              {company.notes ? (
                <FieldRow label="Observações internas" value={company.notes} />
              ) : null}
            </dl>
          </section>
        </div>

        <aside className="empresa-perfil-side-col">
          <section className="empresa-erp-panel empresa-erp-panel--side">
            <h2 className="empresa-erp-panel-title">Situação</h2>
            <dl className="empresa-erp-side-fields">
              <FieldRow
                label="Situação cadastral"
                value={COMPANY_STATUS_LABELS[company.status]}
              />
              <FieldRow
                label="Contrato"
                value={
                  company.contractType
                    ? COMPANY_CONTRACT_LABELS[company.contractType]
                    : "Não informado"
                }
              />
              <FieldRow label="Portal" value={PORTAL_STATE_LABELS[portalState]} />
              <FieldRow
                label="Pendências"
                value={formatCompanyPendingLabel(company.stats.pendingDocuments)}
              />
              <FieldRow
                label="Usuários do portal"
                value={String(company.portalUsers.length)}
              />
              <FieldRow
                label="Última atualização"
                value={format(new Date(company.updatedAt), "dd/MM/yyyy", { locale: ptBR })}
              />
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="empresa-erp-field-row">
      <dt className="empresa-erp-field-label">{label}</dt>
      <dd className="empresa-erp-field-value">{value}</dd>
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ATIVO" | "INATIVO">("ALL");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return company.employees.filter((e) => {
      if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        e.fullName,
        e.cpf,
        e.jobTitle ?? "",
        e.department ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [company.employees, search, statusFilter]);

  const countLabel =
    filtered.length === company.employees.length
      ? `${filtered.length} colaborador${filtered.length === 1 ? "" : "es"}`
      : `${filtered.length} de ${company.employees.length} colaboradores`;

  return (
    <div>
      <div className="empresa-perfil-tab-toolbar">
        <div className="empresa-perfil-tab-toolbar-filters">
          <div className="empresa-perfil-search">
            <Search className="empresa-perfil-search-icon" aria-hidden />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, CPF, função ou setor"
              className="empresa-perfil-search-input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="empresa-perfil-select"
            aria-label="Filtrar por status"
          >
            <option value="ALL">Todos</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
          <span className="empresa-perfil-count">{countLabel}</span>
        </div>
        {canManage && (
          <Link
            href={`/dashboard/colaboradores?new=1&companyId=${company.id}`}
            className={cn(buttonVariants({ variant: "brand", size: "sm" }), "empresa-perfil-btn")}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Novo colaborador
          </Link>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          compact
          className="empresa-perfil-empty-compact"
          title={
            company.employees.length === 0
              ? "Nenhum colaborador cadastrado"
              : "Nenhum resultado para os filtros"
          }
          description={
            company.employees.length === 0
              ? "Cadastre colaboradores vinculados a esta empresa."
              : "Ajuste a busca ou o filtro de status."
          }
        />
      ) : (
        <div className="empresa-perfil-panel">
          <div className="empresa-perfil-table-shell">
            <div className="empresa-perfil-table-scroll">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Último exame</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.fullName}</TableCell>
                      <TableCell>{e.cpf}</TableCell>
                      <TableCell>{displayValue(e.jobTitle)}</TableCell>
                      <TableCell>{displayValue(e.department)}</TableCell>
                      <TableCell>
                        {e.lastReferralAt
                          ? format(new Date(e.lastReferralAt), "dd/MM/yyyy", { locale: ptBR })
                          : "Não informado"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={e.status} type="collaborator" />
                      </TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Ações de ${e.fullName}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <PopoverContent
                            className="collaborator-action-menu w-52 p-1.5"
                            align="end"
                            sideOffset={6}
                          >
                            <Link
                              href={`/dashboard/colaboradores/${e.id}`}
                              className="collaborator-action-item"
                            >
                              <span className="collaborator-action-icon collaborator-action-icon--view">
                                <Users className="h-4 w-4" />
                              </span>
                              <span>
                                <span className="collaborator-action-label">Ver colaborador</span>
                                <span className="collaborator-action-hint">Abrir perfil completo</span>
                              </span>
                            </Link>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="empresa-perfil-mobile">
              {filtered.map((e) => (
                <article key={e.id} className="empresa-perfil-mobile-card">
                  <div className="empresa-perfil-mobile-card-head">
                    <p className="empresa-perfil-mobile-card-name">{e.fullName}</p>
                    <StatusBadge status={e.status} type="collaborator" />
                  </div>
                  <p className="empresa-perfil-mobile-card-sub">
                    {[displayValue(e.jobTitle), displayValue(e.department)]
                      .filter((v) => v !== "Não informado")
                      .join(" · ") || "Não informado"}
                  </p>
                  <dl className="empresa-perfil-mobile-card-meta">
                    <div>
                      <dt>CPF</dt>
                      <dd>{e.cpf}</dd>
                    </div>
                    <div>
                      <dt>Último exame</dt>
                      <dd>
                        {e.lastReferralAt
                          ? format(new Date(e.lastReferralAt), "dd/MM/yyyy", { locale: ptBR })
                          : "Não informado"}
                      </dd>
                    </div>
                  </dl>
                  <Link
                    href={`/dashboard/colaboradores/${e.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "empresa-perfil-mobile-card-action"
                    )}
                  >
                    Ver colaborador
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DOCUMENT_CATEGORY_ORDER = [
  "Programas ocupacionais",
  "Documentos cadastrais",
  "Laudos e relatórios",
  "Contratos",
  "Documentos ambientais",
  "Outros",
] as const;

type DocumentCategory = (typeof DOCUMENT_CATEGORY_ORDER)[number];

function getDocumentCategory(type: string): DocumentCategory {
  if (["PCMSO", "PGR", "LTCAT", "PPP"].includes(type)) return "Programas ocupacionais";
  if (type === "DOCUMENTO_ADMINISTRATIVO") return "Documentos cadastrais";
  if (type === "CONTRATO") return "Contratos";
  if (
    type === "LAUDO_INSALUBRIDADE" ||
    type === "LAUDO_PERICULOSIDADE" ||
    type === "LAUDO"
  ) {
    return "Laudos e relatórios";
  }
  if (["AET", "PPRA"].includes(type)) return "Documentos ambientais";
  return "Outros";
}

function getDocumentValidityLabel(validUntil: string | null): {
  label: string;
  tone: "neutral" | "danger" | "warning" | "success";
} {
  if (!validUntil) return { label: "Sem validade definida", tone: "neutral" };
  const date = new Date(validUntil);
  const now = new Date();
  if (date < now) return { label: "Vencido", tone: "danger" };
  const days = differenceInDays(date, now);
  if (days < 30) return { label: "Próximo do vencimento", tone: "warning" };
  return { label: "Vigente", tone: "success" };
}

type CompanyDocument = CompanyDetailSerialized["documents"][number];

function DocumentTable({ docs }: { docs: CompanyDocument[] }) {
  return (
    <div className="empresa-perfil-table-scroll empresa-perfil-table-scroll--always">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Documento</TableHead>
            <TableHead>Validade</TableHead>
            <TableHead>Atualizado em</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {docs.map((d) => {
            const validity = getDocumentValidityLabel(d.validUntil);
            const typeLabel =
              DOCUMENT_TYPE_LABELS[d.type as keyof typeof DOCUMENT_TYPE_LABELS] ?? d.type;
            return (
              <TableRow key={d.id}>
                <TableCell>
                  <div className="empresa-perfil-doc-cell">
                    <span className="empresa-perfil-doc-title">{d.title}</span>
                    <span className="empresa-perfil-doc-sub">{typeLabel}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "empresa-perfil-validity",
                      validity.tone === "danger" && "is-danger",
                      validity.tone === "warning" && "is-warning",
                      validity.tone === "success" && "is-success"
                    )}
                  >
                    {validity.label}
                  </span>
                </TableCell>
                <TableCell>
                  {format(new Date(d.createdAt), "dd/MM/yyyy", { locale: ptBR })}
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
                  {d.fileUrl ? (
                    <a
                      href={`/api/documents/${d.id}/file`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "h-8 px-2"
                      )}
                    >
                      Ver arquivo
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function DocumentsTab({ company }: { company: CompanyDetailSerialized }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | "Todos">("Todos");

  const companyDocs = useMemo(
    () =>
      company.documents.filter(
        (d) => !CLINICAL_DOCUMENT_TYPES.includes(d.type as DocumentType)
      ),
    [company.documents]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companyDocs.filter((d) => {
      const category = getDocumentCategory(d.type);
      if (categoryFilter !== "Todos" && category !== categoryFilter) return false;
      if (!q) return true;
      const typeLabel =
        DOCUMENT_TYPE_LABELS[d.type as keyof typeof DOCUMENT_TYPE_LABELS] ?? d.type;
      return [d.title, typeLabel, category].join(" ").toLowerCase().includes(q);
    });
  }, [companyDocs, search, categoryFilter]);

  const grouped = useMemo(() => {
    const map = new Map<DocumentCategory, CompanyDocument[]>();
    for (const cat of DOCUMENT_CATEGORY_ORDER) map.set(cat, []);
    for (const doc of filtered) {
      const cat = getDocumentCategory(doc.type);
      map.get(cat)?.push(doc);
    }
    return DOCUMENT_CATEGORY_ORDER.map((cat) => ({
      category: cat,
      docs: map.get(cat) ?? [],
    })).filter((group) => group.docs.length > 0);
  }, [filtered]);

  return (
    <div>
      <div className="empresa-perfil-tab-toolbar">
        <div>
          <h2 className="empresa-perfil-tab-toolbar-title">Documentos da empresa</h2>
          <p className="empresa-perfil-tab-toolbar-desc">
            Centralize programas, laudos, documentos cadastrais e arquivos importantes desta
            empresa.
          </p>
        </div>
        <Link
          href={`/dashboard/documentos?companyId=${company.id}`}
          className={cn(buttonVariants({ variant: "brand", size: "sm" }), "empresa-perfil-btn")}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Anexar documento
        </Link>
      </div>

      {companyDocs.length > 0 && (
        <div className="empresa-perfil-tab-toolbar empresa-perfil-tab-toolbar--filters">
          <div className="empresa-perfil-tab-toolbar-filters">
            <div className="empresa-perfil-search">
              <Search className="empresa-perfil-search-icon" aria-hidden />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar documento"
                className="empresa-perfil-search-input"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as DocumentCategory | "Todos")
              }
              className="empresa-perfil-select"
              aria-label="Filtrar por categoria"
            >
              <option value="Todos">Todas as categorias</option>
              {DOCUMENT_CATEGORY_ORDER.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {companyDocs.length === 0 ? (
        <EmptyState
          compact
          className="empresa-perfil-empty-compact empresa-perfil-doc-empty"
          title="Nenhum documento armazenado"
          description="Centralize aqui os programas, laudos e documentos desta empresa."
          action={{
            label: "Anexar primeiro documento",
            href: `/dashboard/documentos?companyId=${company.id}`,
          }}
        />
      ) : grouped.length === 0 ? (
        <EmptyState
          compact
          className="empresa-perfil-empty-compact"
          title="Nenhum resultado para os filtros"
          description="Ajuste a busca ou a categoria para ver mais documentos."
        />
      ) : (
        <div className="empresa-perfil-doc-groups">
          {grouped.map((group) => (
            <section key={group.category} className="empresa-erp-panel empresa-perfil-doc-group">
              <div className="empresa-perfil-doc-group-head">
                <h3 className="empresa-perfil-section-title">{group.category}</h3>
                <span className="empresa-perfil-count">
                  {group.docs.length} documento{group.docs.length === 1 ? "" : "s"}
                </span>
              </div>
              <DocumentTable docs={group.docs} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function formatPackagePrice(value: number | null) {
  if (value == null || value <= 0) return "Não definido";
  return formatCurrency(value);
}

function formatPackageValidity(from: string | null, until: string | null) {
  if (!from && !until) return "—";
  const f = from ? format(new Date(from), "dd/MM/yyyy", { locale: ptBR }) : null;
  const u = until ? format(new Date(until), "dd/MM/yyyy", { locale: ptBR }) : null;
  if (f && u) return `${f} – ${u}`;
  if (u) return `Até ${u}`;
  return `Desde ${f}`;
}

function ContractTab({
  company,
  canCommercial,
  onRefresh,
}: {
  company: CompanyDetailSerialized;
  canCommercial: boolean;
  onRefresh: () => void;
}) {
  const [packageOpen, setPackageOpen] = useState(false);
  const [editItem, setEditItem] = useState<CompanyDetailSerialized["priceListItems"][number] | null>(
    null
  );
  const [editPrice, setEditPrice] = useState("");
  const [busy, setBusy] = useState(false);

  const packageItems = company.priceListItems;
  const hasPackage = packageItems.length > 0;
  const packageValidFrom = packageItems.find((i) => i.validFrom)?.validFrom ?? null;
  const packageValidUntil = packageItems.find((i) => i.validUntil)?.validUntil ?? null;

  function openEditValue(item: CompanyDetailSerialized["priceListItems"][number]) {
    setEditItem(item);
    setEditPrice(item.negotiatedPrice != null ? String(item.negotiatedPrice) : "");
  }

  async function handleSaveValue() {
    if (!editItem) return;
    const negotiatedPrice = parseFloat(editPrice);
    if (!(negotiatedPrice > 0)) {
      toast.error("Informe um preço negociado válido.");
      return;
    }
    setBusy(true);
    const result = await updateCompanyPackageItem({
      companyId: company.id,
      itemId: editItem.id,
      negotiatedPrice,
    });
    setBusy(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Valor atualizado.");
    setEditItem(null);
    onRefresh();
  }

  async function handleRemove(item: CompanyDetailSerialized["priceListItems"][number]) {
    setBusy(true);
    const result = await removeCompanyPackageItem({
      companyId: company.id,
      itemId: item.id,
    });
    setBusy(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Exame removido do pacote.");
    onRefresh();
  }

  function itemActions(
    item: CompanyDetailSerialized["priceListItems"][number]
  ): SystemActionItem[] {
    return [
      {
        label: "Editar valor",
        hint: "Alterar preço negociado",
        icon: Pencil,
        iconTone: "docs",
        onClick: () => openEditValue(item),
        disabled: !canCommercial || busy,
      },
      {
        label: "Remover do pacote",
        hint: "Retirar este exame do contrato",
        icon: Trash2,
        iconTone: "cancel",
        onClick: () => void handleRemove(item),
        disabled: !canCommercial || busy,
      },
    ];
  }

  return (
    <div className="space-y-4">
      <section className="empresa-erp-panel">
        <h2 className="empresa-erp-panel-title">Resumo do contrato</h2>
        {!company.contractType ? (
          <div className="empresa-perfil-empty-compact empresa-perfil-contract-empty">
            <p className="empresa-perfil-empty-title">Nenhum contrato configurado</p>
            <p className="empresa-perfil-empty-desc">
              Cadastre as condições comerciais e contratuais desta empresa.
            </p>
          </div>
        ) : (
          <dl className="empresa-erp-fields">
            <FieldRow
              label="Tipo de contrato"
              value={COMPANY_CONTRACT_LABELS[company.contractType]}
            />
            <FieldRow
              label="Status comercial"
              value={COMPANY_STATUS_LABELS[company.status]}
            />
            {company.notes ? (
              <FieldRow label="Observações" value={company.notes} />
            ) : null}
          </dl>
        )}
      </section>

      <section className="empresa-erp-panel">
        <div className="empresa-perfil-tab-toolbar empresa-perfil-tab-toolbar--inner">
          <div>
            <h3 className="empresa-perfil-section-title">Pacote de exames contratado</h3>
            <p className="empresa-perfil-empty-desc mt-1">
              Selecione os exames incluídos no contrato e defina os valores negociados para esta
              empresa.
            </p>
          </div>
          {canCommercial && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="empresa-perfil-btn shrink-0"
              onClick={() => setPackageOpen(true)}
            >
              {hasPackage ? "Editar pacote" : "Montar pacote"}
            </Button>
          )}
        </div>

        {!hasPackage ? (
          <div className="empresa-perfil-empty-compact empresa-perfil-prices-empty">
            <p className="empresa-perfil-empty-title">Nenhum exame no pacote</p>
            <p className="empresa-perfil-empty-desc">
              Monte o pacote com os exames contratados e os valores negociados desta empresa. Os
              preços padrão vêm da Tabela de preços.
            </p>
          </div>
        ) : (
          <div className="empresa-perfil-table-scroll empresa-perfil-table-scroll--always">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exame</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço padrão</TableHead>
                  <TableHead>Preço negociado</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packageItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.categoryLabel}</TableCell>
                    <TableCell>{formatPackagePrice(item.defaultPrice)}</TableCell>
                    <TableCell>{formatPackagePrice(item.negotiatedPrice)}</TableCell>
                    <TableCell>
                      {formatPackageValidity(item.validFrom, item.validUntil)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={item.status}
                        label={
                          PRICE_STATUS_LABELS[
                            item.status as keyof typeof PRICE_STATUS_LABELS
                          ] ?? item.status
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {canCommercial ? <SystemActionMenu items={itemActions(item)} /> : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <CompanyExamPackageDialog
        open={packageOpen}
        onOpenChange={setPackageOpen}
        companyId={company.id}
        companyName={company.tradeName ?? company.legalName}
        initialValidFrom={packageValidFrom}
        initialValidUntil={packageValidUntil}
        onSuccess={onRefresh}
      />

      <SystemModalShell
        open={!!editItem}
        onOpenChange={(open) => {
          if (!open) setEditItem(null);
        }}
        title="Editar valor"
        description={editItem?.name}
        badges={[{ label: "Pacote da empresa", variant: "category" }]}
        footer={
          <div className="collaborator-modal-actions">
            <Button
              variant="outline"
              className="collaborator-modal-btn"
              onClick={() => setEditItem(null)}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={() => void handleSaveValue()}
              disabled={busy}
            >
              Salvar
            </Button>
          </div>
        }
      >
        <SystemModalField label="Preço padrão">
          <input value={formatPackagePrice(editItem?.defaultPrice ?? null)} disabled />
        </SystemModalField>
        <SystemModalField label="Preço negociado (R$)" required>
          <input
            type="number"
            step="0.01"
            min="0"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
          />
        </SystemModalField>
      </SystemModalShell>
    </div>
  );
}

const PORTAL_CHECKLIST = [
  "Ativar o portal da empresa",
  "Cadastrar o responsável do RH",
  "Liberar acesso ao portal",
] as const;

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

  const activationDate = useMemo(() => {
    if (company.portalUsers.length === 0) return company.updatedAt;
    return company.portalUsers.reduce((oldest, user) => {
      return new Date(user.createdAt) < new Date(oldest) ? user.createdAt : oldest;
    }, company.portalUsers[0].createdAt);
  }, [company.portalUsers, company.updatedAt]);

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
      <div className="empresa-portal-empty empresa-portal-checklist-card">
        <div className="empresa-portal-empty-icon" aria-hidden>
          <Globe className="h-5 w-5" />
        </div>
        <h2 className="empresa-portal-empty-title">Portal ainda não configurado</h2>
        <p className="empresa-portal-empty-text">
          Configure o acesso para que o RH da empresa acompanhe colaboradores, exames e
          documentos.
        </p>
        <ul className="empresa-portal-checklist">
          {PORTAL_CHECKLIST.map((item) => (
            <li key={item} className="empresa-portal-checklist-item">
              <CheckCircle2 className="empresa-portal-checklist-icon" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {canManage && (
          <Button
            variant="brand"
            size="sm"
            className="rounded-lg"
            disabled={busy}
            onClick={configurePortal}
          >
            Configurar portal
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="empresa-erp-panel">
        <div className="empresa-perfil-tab-toolbar empresa-perfil-tab-toolbar--inner">
          <div>
            <h2 className="empresa-perfil-section-title">Status do portal</h2>
            <div className="mt-1 flex items-center gap-2">
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

        <dl className="empresa-erp-fields">
          <FieldRow label="Usuários vinculados" value={String(company.portalUsers.length)} />
          <FieldRow label="Responsável" value={displayValue(primaryUser?.name)} />
          <FieldRow
            label="E-mail"
            value={displayValue(primaryUser?.email ?? company.email)}
          />
          <FieldRow
            label="Data de ativação"
            value={format(new Date(activationDate), "dd/MM/yyyy", { locale: ptBR })}
          />
          <FieldRow label="Último acesso" value="Não informado" />
        </dl>
      </section>

      {(showCreateUser || portalState === "not_configured") && canManage && (
        <section className="empresa-erp-panel">
          <h2 className="empresa-erp-panel-title">Criar usuário do RH</h2>
          <p className="px-[0.85rem] pt-2 text-xs text-slate-500">
            Após ativar o portal, crie o acesso do responsável para o RH entrar no sistema.
          </p>
          <div className="empresa-portal-form p-[0.85rem]">
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
        <section className="empresa-erp-panel">
          <h2 className="empresa-erp-panel-title">Usuários vinculados</h2>
          <div className="empresa-perfil-table-scroll empresa-perfil-table-scroll--always">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="w-28">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.portalUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>RH</TableCell>
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
                          Redefinir senha
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
        <section className="empresa-erp-panel">
          <h2 className="empresa-erp-panel-title">Redefinir acesso</h2>
          <div className="empresa-portal-form p-[0.85rem]">
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

const HISTORY_ACTION_ICONS: Record<CompanyHistoryAction, typeof Building2> = {
  CREATED: Building2,
  UPDATED: Pencil,
  STATUS_CHANGED: AlertTriangle,
  EMPLOYEE_ADDED: UserPlus,
  REFERRAL_CREATED: FileText,
  QUOTE_SENT: DollarSign,
  DOCUMENT_ATTACHED: FileText,
  PORTAL_ENABLED: Globe,
  PORTAL_DISABLED: ShieldOff,
  USER_CREATED: UserPlus,
  CONTACT_ADDED: MessageCircle,
};

function HistoryTab({ company }: { company: CompanyDetailSerialized }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return company.history;
    return company.history.filter((h) => {
      const title = COMPANY_HISTORY_ACTION_LABELS[h.action] ?? h.action;
      const description = h.notes ?? (h.performedByName ? `Por ${h.performedByName}` : "");
      return [title, description, h.performedByName ?? ""].join(" ").toLowerCase().includes(q);
    });
  }, [company.history, search]);

  const groupedByDay = useMemo(() => {
    const groups = new Map<string, typeof filtered>();
    for (const item of filtered) {
      const dayKey = format(startOfDay(new Date(item.createdAt)), "yyyy-MM-dd");
      const existing = groups.get(dayKey) ?? [];
      existing.push(item);
      groups.set(dayKey, existing);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  if (company.history.length === 0) {
    return (
      <EmptyState
        compact
        className="empresa-perfil-empty-compact"
        title="Nenhuma atividade registrada"
        description="As alterações realizadas nesta empresa aparecerão aqui."
      />
    );
  }

  return (
    <div>
      <div className="empresa-perfil-tab-toolbar empresa-perfil-tab-toolbar--filters">
        <div className="empresa-perfil-search">
          <Search className="empresa-perfil-search-icon" aria-hidden />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar no histórico"
            className="empresa-perfil-search-input"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          compact
          className="empresa-perfil-empty-compact"
          title="Nenhum resultado para a busca"
          description="Tente outro termo ou limpe o filtro."
        />
      ) : (
        <div className="empresa-perfil-timeline">
          {groupedByDay.map(([dayKey, items]) => (
            <section key={dayKey} className="empresa-perfil-timeline-day">
              <h3 className="empresa-perfil-timeline-day-label">
                {format(new Date(dayKey), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </h3>
              <ul className="empresa-perfil-timeline-list">
                {items.map((h) => {
                  const Icon = HISTORY_ACTION_ICONS[h.action] ?? Building2;
                  const description =
                    h.notes ?? (h.performedByName ? `Por ${h.performedByName}` : null);
                  return (
                    <li key={h.id} className="empresa-perfil-timeline-item">
                      <span className="empresa-perfil-timeline-icon" aria-hidden>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="empresa-perfil-timeline-content">
                        <div className="empresa-perfil-timeline-head">
                          <span className="empresa-perfil-timeline-title">
                            {COMPANY_HISTORY_ACTION_LABELS[h.action] ?? h.action}
                          </span>
                          <time
                            className="empresa-perfil-timeline-time"
                            dateTime={h.createdAt}
                          >
                            {format(new Date(h.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </time>
                        </div>
                        {description ? (
                          <p className="empresa-perfil-timeline-desc">{description}</p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
