"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  UserX,
  FileWarning,
  Link2Off,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import type { CollaboratorListItem } from "@/lib/collaborators";
import { COLLABORATOR_STAT_CARDS, getPeriodicExamBadge } from "@/lib/collaborators";
import { CollaboratorBulkImport } from "./CollaboratorBulkImport";
import { CollaboratorActionMenu } from "./CollaboratorActionMenu";
import { PageModule } from "@/components/dashboard/PageModule";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterChips } from "@/components/dashboard/FilterChips";
import { DetailDrawer } from "@/components/dashboard/DetailDrawer";
import { CollaboratorDetailDrawerContent } from "./CollaboratorDetailDrawerContent";
import { getCollaboratorDetail } from "@/actions/collaborators";
import type { CollaboratorDetailSerialized } from "@/lib/collaborators";
import { buildFilterChips, removeFilterKey } from "@/lib/filter-chips-utils";
import { toast } from "sonner";
import { LoadingState } from "@/components/ui/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewCollaboratorDialog } from "./CollaboratorDialogs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STAT_ICONS: Record<string, LucideIcon> = {
  ativos: Users,
  inativos: UserX,
  docs_pendentes: FileWarning,
  sem_empresa: Link2Off,
};

const STAT_TONES: Record<string, "primary" | "warning"> = {
  ativos: "primary",
  inativos: "primary",
  docs_pendentes: "warning",
  sem_empresa: "warning",
};

type ColaboradoresClientProps = {
  initialItems: CollaboratorListItem[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  statCounts: Record<string, number>;
  companies: { id: string; name: string }[];
  jobTitles: string[];
  departments: string[];
  canManage: boolean;
  isEmpresaPortal?: boolean;
  filters: Record<string, string | undefined>;
};

export function ColaboradoresClient({
  initialItems,
  initialTotal,
  initialPage,
  pageSize,
  statCounts,
  companies,
  jobTitles,
  departments,
  canManage,
  isEmpresaPortal = false,
  filters,
}: ColaboradoresClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(filters.q ?? "");
  const [companyId, setCompanyId] = useState(filters.companyId ?? "");
  const [jobTitle, setJobTitle] = useState(filters.jobTitle ?? "");
  const [department, setDepartment] = useState(filters.department ?? "");
  const [clinicalExamType, setClinicalExamType] = useState(filters.clinicalExamType ?? "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");
  const [periodicDue, setPeriodicDue] = useState(filters.periodicDue ?? "");
  const [docsPending, setDocsPending] = useState(filters.docsPending ?? "");
  const [scheduled, setScheduled] = useState(
    filters.status === "SCHEDULED" ? "true" : ""
  );
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(
    Boolean(
      filters.jobTitle ||
        filters.department ||
        filters.clinicalExamType ||
        filters.dateFrom ||
        filters.dateTo ||
        filters.periodicDue ||
        filters.docsPending ||
        filters.status === "SCHEDULED" ||
        filters.status === "PERIODIC_DUE"
    )
  );
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerCollaborator, setDrawerCollaborator] = useState<CollaboratorDetailSerialized | null>(
    null
  );

  const activeStatus = filters.status ?? "";
  const totalPages = Math.max(1, Math.ceil(initialTotal / pageSize));

  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "ALL") params.delete(key);
        else params.set(key, value);
      });
      if (!("page" in updates)) params.delete("page");
      startTransition(() => {
        router.push(`/dashboard/colaboradores?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const pushCurrentFilters = (extra?: Record<string, string | undefined>) => {
    const nextStatus =
      extra && "status" in extra
        ? extra.status
        : scheduled === "true"
          ? "SCHEDULED"
          : activeStatus === "SCHEDULED"
            ? undefined
            : activeStatus || undefined;

    updateFilters({
      q: q || undefined,
      companyId: companyId || undefined,
      jobTitle: jobTitle || undefined,
      department: department || undefined,
      clinicalExamType: clinicalExamType || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      periodicDue: periodicDue || undefined,
      docsPending: docsPending || undefined,
      status: nextStatus,
      ...extra,
    });
  };

  const clearFilters = () => {
    setQ("");
    setCompanyId("");
    setJobTitle("");
    setDepartment("");
    setClinicalExamType("");
    setDateFrom("");
    setDateTo("");
    setPeriodicDue("");
    setDocsPending("");
    setScheduled("");
    setMoreFiltersOpen(false);
    startTransition(() => router.push("/dashboard/colaboradores"));
  };

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.q ||
          filters.status ||
          filters.companyId ||
          filters.jobTitle ||
          filters.department ||
          filters.clinicalExamType ||
          filters.dateFrom ||
          filters.dateTo ||
          filters.periodicDue ||
          filters.docsPending
      ),
    [filters]
  );

  const advancedFilterCount = [
    filters.jobTitle,
    filters.department,
    filters.clinicalExamType,
    filters.dateFrom,
    filters.dateTo,
    filters.periodicDue,
    filters.docsPending,
    filters.status === "SCHEDULED" || filters.status === "PERIODIC_DUE"
      ? filters.status
      : null,
  ].filter(Boolean).length;

  const patientStatusValue =
    activeStatus === "ATIVO" ||
    activeStatus === "INATIVO" ||
    activeStatus === "AFASTADO" ||
    activeStatus === "DESLIGADO" ||
    activeStatus === "PENDENTE"
      ? activeStatus
      : "";

  const activeChips = useMemo(
    () =>
      buildFilterChips([
        { key: "q", value: filters.q, label: (v) => `Busca: ${v}` },
        {
          key: "status",
          value: filters.status,
          label: (v) => {
            const card = COLLABORATOR_STAT_CARDS.find((c) => c.filter === v);
            if (card) return card.label;
            if (v === "ATIVO") return "Status: Ativo";
            if (v === "INATIVO") return "Status: Inativo";
            if (v === "AFASTADO") return "Status: Afastado";
            if (v === "DESLIGADO") return "Status: Desligado";
            if (v === "PENDENTE") return "Status: Pendente";
            if (v === "SCHEDULED") return "Com exame agendado";
            if (v === "PERIODIC_DUE") return "Periódico a vencer";
            if (v === "DOCS_PENDING") return "Com pendências";
            if (v === "NO_COMPANY") return "Sem empresa vinculada";
            return `Status: ${v}`;
          },
          skip: (v) => v === "ALL",
        },
        {
          key: "companyId",
          value: filters.companyId,
          label: (v) => `Empresa: ${companies.find((c) => c.id === v)?.name ?? v}`,
        },
        { key: "jobTitle", value: filters.jobTitle, label: (v) => `Função: ${v}` },
        { key: "department", value: filters.department, label: (v) => `Setor: ${v}` },
        {
          key: "clinicalExamType",
          value: filters.clinicalExamType,
          label: (v) => `Exame: ${v}`,
        },
        { key: "dateFrom", value: filters.dateFrom, label: (v) => `Cadastro de ${v}` },
        { key: "dateTo", value: filters.dateTo, label: (v) => `Cadastro até ${v}` },
        { key: "periodicDue", value: filters.periodicDue, label: () => "Próximo periódico a vencer" },
        { key: "docsPending", value: filters.docsPending, label: () => "Documento pendente" },
      ]),
    [filters, companies]
  );

  const removeChip = (key: string) => {
    const next = removeFilterKey(key, filters);
    if (key === "q") setQ("");
    if (key === "companyId") setCompanyId("");
    if (key === "jobTitle") setJobTitle("");
    if (key === "department") setDepartment("");
    if (key === "clinicalExamType") setClinicalExamType("");
    if (key === "dateFrom") setDateFrom("");
    if (key === "dateTo") setDateTo("");
    if (key === "periodicDue") setPeriodicDue("");
    if (key === "docsPending") setDocsPending("");
    if (key === "status") setScheduled("");
    updateFilters(next);
  };

  const openDetail = async (id: string) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerCollaborator(null);
    const result = await getCollaboratorDetail(id);
    setDrawerLoading(false);
    if (!result.success) {
      toast.error(result.error);
      setDrawerOpen(false);
      return;
    }
    setDrawerCollaborator(result.collaborator);
  };

  useEffect(() => {
    if (searchParams.get("new") === "1" && canManage) setNewDialogOpen(true);
  }, [searchParams, canManage]);

  const resultLabel =
    initialTotal === 1
      ? "1 colaborador encontrado"
      : `${initialTotal} colaboradores encontrados`;

  return (
    <PageModule className="colaboradores-clinica">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Colaboradores</h1>
          <p className="colaboradores-empresa-subtitle">
            Cadastro de colaboradores, vínculos com empresas e controle de periódicos.
          </p>
        </div>
        {canManage && (
          <div className="colaboradores-empresa-header-actions">
            <Button
              variant="brand"
              size="sm"
              className="rounded-lg"
              onClick={() => setNewDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo colaborador
            </Button>
          </div>
        )}
      </header>

      {isEmpresaPortal && <CollaboratorBulkImport />}

      <div className="colaboradores-empresa-stats colaboradores-clinica-stats">
        {COLLABORATOR_STAT_CARDS.map((card) => {
          const Icon = STAT_ICONS[card.key] ?? Users;
          const isActive = activeStatus === card.filter;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => updateFilters({ status: isActive ? undefined : card.filter })}
              className={cn(
                "colaboradores-empresa-stat colaboradores-empresa-stat--clickable",
                isActive && "colaboradores-empresa-stat--active"
              )}
            >
              <span
                className={cn(
                  "colaboradores-empresa-stat-icon",
                  `colaboradores-empresa-stat-icon--${STAT_TONES[card.key] ?? "primary"}`
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="colaboradores-empresa-stat-body">
                <span className="colaboradores-empresa-stat-value">
                  {statCounts[card.key] ?? 0}
                </span>
                <span className="colaboradores-empresa-stat-title">{card.label}</span>
                <span className="colaboradores-empresa-stat-hint">{card.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="colaboradores-empresa-filters">
        <div className="colaboradores-empresa-filters-row">
          <div className="colaboradores-empresa-search">
            <Search className="colaboradores-empresa-search-icon" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pushCurrentFilters()}
              placeholder="Buscar por nome, CPF, empresa ou função"
              aria-label="Buscar colaboradores"
              className="colaboradores-empresa-search-input"
            />
          </div>

          {!isEmpresaPortal && (
            <select
              value={companyId}
              onChange={(e) => {
                const value = e.target.value;
                setCompanyId(value);
                pushCurrentFilters({ companyId: value || undefined });
              }}
              aria-label="Filtrar por empresa"
              className="colaboradores-empresa-select"
            >
              <option value="">Empresa</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={patientStatusValue}
            onChange={(e) => {
              const value = e.target.value;
              setScheduled("");
              updateFilters({ status: value || undefined });
            }}
            aria-label="Filtrar por status"
            className="colaboradores-empresa-select"
          >
            <option value="">Status</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
            <option value="AFASTADO">Afastado</option>
            <option value="DESLIGADO">Desligado</option>
            <option value="PENDENTE">Pendente</option>
          </select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="colaboradores-empresa-more-btn rounded-lg"
            onClick={() => setMoreFiltersOpen((open) => !open)}
            aria-expanded={moreFiltersOpen}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Mais filtros
            {advancedFilterCount > 0 && (
              <span className="colaboradores-empresa-filter-count">{advancedFilterCount}</span>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="colaboradores-empresa-clear-btn rounded-lg"
              onClick={clearFilters}
            >
              Limpar filtros
            </Button>
          )}
        </div>

        {moreFiltersOpen && (
          <div className="colaboradores-empresa-filters-advanced">
            <select
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Função"
            >
              <option value="">Função</option>
              {jobTitles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>

            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Setor"
            >
              <option value="">Setor</option>
              {departments.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={clinicalExamType}
              onChange={(e) => setClinicalExamType(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Tipo de exame"
            >
              <option value="">Tipo de exame</option>
              <option value="ADMISSIONAL">Admissional</option>
              <option value="PERIODICO">Periódico</option>
              <option value="DEMISSIONAL">Demissional</option>
              <option value="RETORNO_TRABALHO">Retorno ao trabalho</option>
              <option value="MUDANCA_FUNCAO">Mudança de função</option>
            </select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="Cadastro de"
              className="h-9 rounded-lg text-sm"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="Cadastro até"
              className="h-9 rounded-lg text-sm"
            />

            <select
              value={scheduled}
              onChange={(e) => setScheduled(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Exames agendados"
            >
              <option value="">Exames agendados</option>
              <option value="true">Com exame agendado</option>
            </select>

            <select
              value={periodicDue}
              onChange={(e) => setPeriodicDue(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Próximo periódico"
            >
              <option value="">Próximo periódico</option>
              <option value="true">A vencer (30 dias)</option>
            </select>

            <select
              value={docsPending}
              onChange={(e) => setDocsPending(e.target.value)}
              className="colaboradores-empresa-select"
              aria-label="Documento pendente"
            >
              <option value="">Documento pendente</option>
              <option value="true">Com pendência</option>
            </select>

            <Button
              type="button"
              variant="brand"
              size="sm"
              className="rounded-lg"
              onClick={() => {
                if (scheduled === "true") {
                  pushCurrentFilters({ status: "SCHEDULED" });
                  return;
                }
                pushCurrentFilters({
                  status:
                    activeStatus === "SCHEDULED" ? undefined : activeStatus || undefined,
                });
              }}
            >
              Aplicar
            </Button>
          </div>
        )}

        {activeChips.length > 0 && (
          <div className="colaboradores-empresa-chips">
            <FilterChips chips={activeChips} onRemove={removeChip} onClearAll={clearFilters} />
          </div>
        )}
      </div>

      <div className="colaboradores-empresa-table-wrap relative">
        {isPending && <LoadingState overlay label="Atualizando colaboradores..." />}

        <div className="colaboradores-empresa-result-bar">
          <span className="text-xs text-slate-500">{resultLabel}</span>
        </div>

        {initialItems.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum colaborador encontrado"
            description="Cadastre um colaborador ou ajuste os filtros."
            action={
              canManage
                ? { label: "Novo colaborador", onClick: () => setNewDialogOpen(true) }
                : undefined
            }
          />
        ) : (
          <>
            <div className="colaboradores-empresa-table-scroll hidden md:block">
              <table className="colaboradores-empresa-table colaboradores-clinica-table">
                <thead>
                  <tr>
                    <th>Colaborador</th>
                    {!isEmpresaPortal && <th>Empresa</th>}
                    <th>Função e setor</th>
                    <th>Último exame</th>
                    <th>Próximo periódico</th>
                    <th>Pendências</th>
                    <th>Status</th>
                    <th className="colaboradores-empresa-th-actions">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {initialItems.map((c) => {
                    const periodicBadge = getPeriodicExamBadge(c.nextPeriodicDate);
                    const showPeriodicAlert =
                      periodicBadge.tone === "warning" || periodicBadge.tone === "danger";

                    return (
                      <tr
                        key={c.id}
                        className="colaboradores-clinica-row cursor-pointer"
                        onClick={() => openDetail(c.id)}
                      >
                        <td>
                          <div className="colaboradores-empresa-name-cell">
                            <Link
                              href={`/dashboard/colaboradores/${c.id}`}
                              className="colaboradores-empresa-name colaboradores-clinica-link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {c.fullName}
                            </Link>
                            <p className="colaboradores-empresa-muted colaboradores-clinica-cpf">
                              {c.cpfFormatted}
                            </p>
                          </div>
                        </td>

                        {!isEmpresaPortal && (
                          <td onClick={(e) => e.stopPropagation()}>
                            {c.companyId ? (
                              <Link
                                href={`/dashboard/empresas/${c.companyId}`}
                                className="colaboradores-clinica-link text-sm"
                              >
                                {c.companyName ?? "—"}
                              </Link>
                            ) : (
                              <Badge
                                variant="outline"
                                className="colaboradores-clinica-badge colaboradores-clinica-badge--muted"
                              >
                                Sem vínculo
                              </Badge>
                            )}
                          </td>
                        )}

                        <td>
                          <p className="colaboradores-clinica-primary-text">
                            {c.jobTitle ?? "—"}
                          </p>
                          <p className="colaboradores-empresa-muted">{c.department ?? "—"}</p>
                        </td>

                        <td>
                          {c.lastExamLabel ? (
                            <div>
                              <p className="colaboradores-clinica-primary-text">{c.lastExamLabel}</p>
                              {c.lastExamDate ? (
                                <p className="colaboradores-empresa-muted">
                                  {format(new Date(c.lastExamDate), "dd/MM/yyyy", {
                                    locale: ptBR,
                                  })}
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <span className="colaboradores-empresa-muted">—</span>
                          )}
                        </td>

                        <td>
                          <p className="colaboradores-clinica-primary-text">
                            {c.nextPeriodicDate
                              ? format(new Date(c.nextPeriodicDate), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })
                              : "Não definido"}
                          </p>
                          {showPeriodicAlert ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "colaboradores-clinica-badge mt-1",
                                periodicBadge.tone === "danger"
                                  ? "colaboradores-clinica-badge--danger"
                                  : "colaboradores-clinica-badge--warning"
                              )}
                            >
                              Periódico a vencer
                            </Badge>
                          ) : null}
                        </td>

                        <td>
                          {c.hasPendingDocs ? (
                            <Badge
                              variant="outline"
                              className="colaboradores-clinica-badge colaboradores-clinica-badge--warning"
                            >
                              Documento pendente
                            </Badge>
                          ) : (
                            <span className="colaboradores-empresa-muted">Sem pendências</span>
                          )}
                        </td>

                        <td>
                          <StatusBadge status={c.status} type="collaborator" />
                        </td>

                        <td
                          className="colaboradores-empresa-td-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <CollaboratorActionMenu
                            onViewDetails={() => openDetail(c.id)}
                            onViewProfile={() => router.push(`/dashboard/colaboradores/${c.id}`)}
                            onViewDocuments={() =>
                              router.push(`/dashboard/documentos?patientId=${c.id}`)
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="colaboradores-empresa-mobile-list md:hidden">
              {initialItems.map((c) => {
                const periodicBadge = getPeriodicExamBadge(c.nextPeriodicDate);
                return (
                  <article
                    key={c.id}
                    className="colaboradores-empresa-mobile-card"
                    onClick={() => openDetail(c.id)}
                  >
                    <div className="colaboradores-empresa-mobile-card-head">
                      <p className="colaboradores-empresa-name">{c.fullName}</p>
                      <StatusBadge status={c.status} type="collaborator" />
                    </div>
                    <p className="colaboradores-empresa-mobile-role">
                      {c.cpfFormatted}
                      {c.companyName ? ` · ${c.companyName}` : " · Sem vínculo"}
                    </p>
                    <dl className="colaboradores-empresa-mobile-meta">
                      <div>
                        <dt>Função</dt>
                        <dd>{c.jobTitle ?? "—"}</dd>
                      </div>
                      <div>
                        <dt>Periódico</dt>
                        <dd>
                          {c.nextPeriodicDate
                            ? format(new Date(c.nextPeriodicDate), "dd/MM/yyyy", {
                                locale: ptBR,
                              })
                            : "Não definido"}
                        </dd>
                      </div>
                      <div>
                        <dt>Pendências</dt>
                        <dd>
                          {c.hasPendingDocs ? "Documento pendente" : "Sem pendências"}
                        </dd>
                      </div>
                      {(periodicBadge.tone === "warning" || periodicBadge.tone === "danger") && (
                        <div>
                          <dt>Alerta</dt>
                          <dd>Periódico a vencer</dd>
                        </div>
                      )}
                    </dl>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {totalPages > 1 && (
          <div className="colaboradores-empresa-pagination">
            <Button
              variant="outline"
              size="sm"
              disabled={initialPage <= 1 || isPending}
              onClick={() =>
                updateFilters({
                  page: String(initialPage - 1),
                  status: activeStatus || undefined,
                })
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="colaboradores-empresa-pagination-label">
              Página {initialPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={initialPage >= totalPages || isPending}
              onClick={() =>
                updateFilters({
                  page: String(initialPage + 1),
                  status: activeStatus || undefined,
                })
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <DetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={drawerCollaborator?.fullName ?? "Colaborador"}
        description="Histórico"
        loading={drawerLoading}
        size="lg"
      >
        {drawerCollaborator && (
          <CollaboratorDetailDrawerContent collaborator={drawerCollaborator} />
        )}
      </DetailDrawer>

      <NewCollaboratorDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        companies={companies}
        defaultCompanyId={
          isEmpresaPortal && companies[0]
            ? companies[0].id
            : searchParams.get("companyId") ?? undefined
        }
        isEmpresaPortal={isEmpresaPortal}
        onSuccess={(id, createReferral) => {
          if (isEmpresaPortal && createReferral) {
            router.push(`/dashboard/encaminhamentos/novo?patientId=${id}`);
          } else {
            router.push(`/dashboard/colaboradores/${id}`);
          }
        }}
      />
    </PageModule>
  );
}
