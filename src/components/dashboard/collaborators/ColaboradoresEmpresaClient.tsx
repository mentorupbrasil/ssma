"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Users,
  CalendarCheck,
  FileClock,
  Clock,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { CollaboratorListItem } from "@/lib/collaborators";
import { getPeriodicExamBadge } from "@/lib/collaborators";
import { CollaboratorImportDialog } from "./CollaboratorImportDialog";
import { CollaboratorActionMenu } from "./CollaboratorActionMenu";
import { PageModule } from "@/components/dashboard/PageModule";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterChips } from "@/components/dashboard/FilterChips";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { buildFilterChips, removeFilterKey } from "@/lib/filter-chips-utils";
import { LoadingState } from "@/components/ui/loading-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NewCollaboratorDialog } from "./CollaboratorDialogs";
import { cn } from "@/lib/utils";

export type EmpresaCollaboratorStats = {
  ativos: number;
  inativos: number;
  agendados: number;
  docsPendentes: number;
  periodicosVencer: number;
};

type ColaboradoresEmpresaClientProps = {
  initialItems: CollaboratorListItem[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  stats: EmpresaCollaboratorStats;
  companies: { id: string; name: string }[];
  jobTitles: string[];
  departments: string[];
  canManage: boolean;
  filters: Record<string, string | undefined>;
};

function formatPeriodicHint(nextPeriodicDate: string | null): string {
  if (!nextPeriodicDate) return "";
  const diff = differenceInCalendarDays(new Date(nextPeriodicDate), new Date());
  if (diff < 0) return "Vencido";
  if (diff === 0) return "Vence hoje";
  return `Vence em ${diff} dias`;
}

function collaboratorRoleLine(jobTitle: string | null, department: string | null): string {
  if (jobTitle && department) return `${jobTitle} · ${department}`;
  return jobTitle ?? department ?? "—";
}

function pendingLabel(count: number): string {
  return count === 1 ? "1 documento" : `${count} documentos`;
}

export function ColaboradoresEmpresaClient({
  initialItems,
  initialTotal,
  initialPage,
  pageSize,
  stats,
  companies,
  jobTitles,
  departments,
  canManage,
  filters,
}: ColaboradoresEmpresaClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(filters.q ?? "");
  const [status, setStatus] = useState(filters.status && filters.status !== "ALL" ? filters.status : "");
  const [clinicalExamType, setClinicalExamType] = useState(filters.clinicalExamType ?? "");
  const [jobTitle, setJobTitle] = useState(filters.jobTitle ?? "");
  const [department, setDepartment] = useState(filters.department ?? "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");
  const [periodicDue, setPeriodicDue] = useState(filters.periodicDue ?? "");
  const [docsPending, setDocsPending] = useState(filters.docsPending ?? "");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(initialTotal / pageSize));

  const applyFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "ALL") params.delete(key);
        else params.set(key, value);
      });
      if (!updates.page) params.delete("page");
      startTransition(() => {
        router.push(`/dashboard/colaboradores?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams]
  );

  const pushCurrentFilters = useCallback(
    (extra?: Record<string, string | undefined>) => {
      applyFilters({
        q: q.trim() || undefined,
        status: status || undefined,
        clinicalExamType: clinicalExamType || undefined,
        jobTitle: jobTitle || undefined,
        department: department || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        periodicDue: periodicDue || undefined,
        docsPending: docsPending || undefined,
        ...extra,
      });
    },
    [applyFilters, q, status, clinicalExamType, jobTitle, department, dateFrom, dateTo, periodicDue, docsPending]
  );

  const clearFilters = () => {
    setQ("");
    setStatus("");
    setClinicalExamType("");
    setJobTitle("");
    setDepartment("");
    setDateFrom("");
    setDateTo("");
    setPeriodicDue("");
    setDocsPending("");
    setMoreFiltersOpen(false);
    startTransition(() => router.push("/dashboard/colaboradores", { scroll: false }));
  };

  const advancedFilterCount = useMemo(
    () => [jobTitle, department, dateFrom, dateTo, periodicDue, docsPending].filter(Boolean).length,
    [jobTitle, department, dateFrom, dateTo, periodicDue, docsPending]
  );

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.q ||
          (filters.status && filters.status !== "ALL") ||
          filters.clinicalExamType ||
          filters.jobTitle ||
          filters.department ||
          filters.dateFrom ||
          filters.dateTo ||
          filters.periodicDue ||
          filters.docsPending
      ),
    [filters]
  );

  const activeChips = useMemo(
    () =>
      buildFilterChips([
        { key: "q", value: filters.q, label: (v) => `Busca: ${v}` },
        { key: "status", value: filters.status, label: (v) => `Status: ${v}`, skip: (v) => v === "ALL" },
        { key: "clinicalExamType", value: filters.clinicalExamType, label: (v) => `Exame: ${v}` },
        { key: "jobTitle", value: filters.jobTitle, label: (v) => `Função: ${v}` },
        { key: "department", value: filters.department, label: (v) => `Setor: ${v}` },
        {
          key: "dateFrom",
          value: filters.dateFrom || filters.dateTo,
          label: () =>
            filters.dateFrom && filters.dateTo
              ? `Cadastro: ${filters.dateFrom} – ${filters.dateTo}`
              : filters.dateFrom
                ? `Cadastro desde ${filters.dateFrom}`
                : `Cadastro até ${filters.dateTo}`,
        },
        { key: "periodicDue", value: filters.periodicDue, label: () => "Periódico a vencer" },
        { key: "docsPending", value: filters.docsPending, label: () => "Documento pendente" },
      ]),
    [filters]
  );

  const removeChip = (key: string) => {
    if (key === "dateFrom") {
      setDateFrom("");
      setDateTo("");
      applyFilters({ ...removeFilterKey(key, filters), dateTo: undefined });
      return;
    }
    const next = removeFilterKey(key, filters);
    if (key === "q") setQ("");
    if (key === "status") setStatus("");
    if (key === "clinicalExamType") setClinicalExamType("");
    if (key === "jobTitle") setJobTitle("");
    if (key === "department") setDepartment("");
    if (key === "periodicDue") setPeriodicDue("");
    if (key === "docsPending") setDocsPending("");
    applyFilters(next);
  };

  useEffect(() => {
    if (searchParams.get("new") === "1" && canManage) setNewDialogOpen(true);
  }, [searchParams, canManage]);

  const resultLabel =
    initialTotal === 1 ? "1 colaborador encontrado" : `${initialTotal} colaboradores encontrados`;

  const statCards = [
    {
      key: "colaboradores",
      title: "Colaboradores",
      value: stats.ativos,
      hint: `${stats.inativos} inativo${stats.inativos === 1 ? "" : "s"}`,
      icon: Users,
      tone: "primary" as const,
    },
    {
      key: "agendados",
      title: "Exames agendados",
      value: stats.agendados,
      hint: "Atendimentos programados",
      icon: CalendarCheck,
      tone: "primary" as const,
      onClick: () => applyFilters({ status: filters.status === "SCHEDULED" ? undefined : "SCHEDULED" }),
      active: filters.status === "SCHEDULED",
    },
    {
      key: "docs",
      title: "Documentos pendentes",
      value: stats.docsPendentes,
      hint: "Cadastros com documentação incompleta",
      icon: FileClock,
      tone: "warning" as const,
      onClick: () =>
        applyFilters({
          docsPending: filters.docsPending === "true" ? undefined : "true",
          status: undefined,
        }),
      active: filters.docsPending === "true" || filters.status === "DOCS_PENDING",
    },
    {
      key: "periodico",
      title: "Periódicos a vencer",
      value: stats.periodicosVencer,
      hint: "Próximos 30 dias",
      icon: Clock,
      tone: "warning" as const,
      onClick: () =>
        applyFilters({
          periodicDue: filters.periodicDue === "true" ? undefined : "true",
          status: undefined,
        }),
      active: filters.periodicDue === "true" || filters.status === "PERIODIC_DUE",
    },
  ];

  return (
    <PageModule className="colaboradores-empresa">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Colaboradores</h1>
          <p className="colaboradores-empresa-subtitle">
            Gerencie funcionários, exames ocupacionais e documentos.
          </p>
        </div>
        {canManage && (
          <div className="colaboradores-empresa-header-actions">
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setImportOpen(true)}>
              Importar planilha
            </Button>
            <Button variant="brand" size="sm" className="rounded-lg" onClick={() => setNewDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo colaborador
            </Button>
          </div>
        )}
      </header>

      <div className="colaboradores-empresa-stats">
        {statCards.map((card) => {
          const Icon = card.icon;
          const Tag = card.onClick ? "button" : "div";
          return (
            <Tag
              key={card.key}
              type={card.onClick ? "button" : undefined}
              onClick={card.onClick}
              className={cn(
                "colaboradores-empresa-stat",
                card.onClick && "colaboradores-empresa-stat--clickable",
                card.active && "colaboradores-empresa-stat--active"
              )}
            >
              <div className={cn("colaboradores-empresa-stat-icon", `colaboradores-empresa-stat-icon--${card.tone}`)}>
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <div className="colaboradores-empresa-stat-body">
                <p className="colaboradores-empresa-stat-value">{card.value}</p>
                <p className="colaboradores-empresa-stat-title">{card.title}</p>
                <p className="colaboradores-empresa-stat-hint">{card.hint}</p>
              </div>
            </Tag>
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
              placeholder="Buscar por nome, CPF, função ou protocolo"
              aria-label="Buscar colaboradores"
              className="colaboradores-empresa-search-input"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              const value = e.target.value;
              setStatus(value);
              pushCurrentFilters({ status: value || undefined });
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

          <select
            value={clinicalExamType}
            onChange={(e) => {
              const value = e.target.value;
              setClinicalExamType(value);
              pushCurrentFilters({ clinicalExamType: value || undefined });
            }}
            aria-label="Filtrar por tipo de exame"
            className="colaboradores-empresa-select"
          >
            <option value="">Tipo de exame</option>
            <option value="ADMISSIONAL">Admissional</option>
            <option value="PERIODICO">Periódico</option>
            <option value="DEMISSIONAL">Demissional</option>
            <option value="RETORNO_TRABALHO">Retorno ao trabalho</option>
            <option value="MUDANCA_FUNCAO">Mudança de função</option>
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

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="colaboradores-empresa-clear-btn rounded-lg"
            onClick={clearFilters}
            disabled={!hasActiveFilters && !q}
          >
            Limpar
          </Button>
        </div>

        {moreFiltersOpen && (
          <div className="colaboradores-empresa-filters-advanced">
            <select
              value={jobTitle}
              onChange={(e) => {
                setJobTitle(e.target.value);
                pushCurrentFilters({ jobTitle: e.target.value || undefined });
              }}
              aria-label="Filtrar por função"
              className="colaboradores-empresa-select"
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
              onChange={(e) => {
                setDepartment(e.target.value);
                pushCurrentFilters({ department: e.target.value || undefined });
              }}
              aria-label="Filtrar por setor"
              className="colaboradores-empresa-select"
            >
              <option value="">Setor</option>
              {departments.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <DateRangePicker
              dateFrom={dateFrom}
              dateTo={dateTo}
              onChange={(from, to) => {
                setDateFrom(from ?? "");
                setDateTo(to ?? "");
                pushCurrentFilters({ dateFrom: from, dateTo: to });
              }}
              placeholder="Período de cadastro"
            />

            <select
              value={periodicDue}
              onChange={(e) => {
                setPeriodicDue(e.target.value);
                pushCurrentFilters({ periodicDue: e.target.value || undefined });
              }}
              aria-label="Filtrar por próximo periódico"
              className="colaboradores-empresa-select"
            >
              <option value="">Próximo periódico</option>
              <option value="true">A vencer (30 dias)</option>
            </select>

            <select
              value={docsPending}
              onChange={(e) => {
                setDocsPending(e.target.value);
                pushCurrentFilters({ docsPending: e.target.value || undefined });
              }}
              aria-label="Filtrar por documento pendente"
              className="colaboradores-empresa-select"
            >
              <option value="">Documento pendente</option>
              <option value="true">Com pendência</option>
            </select>
          </div>
        )}

        {activeChips.length > 0 && (
          <div className="colaboradores-empresa-chips">
            <FilterChips chips={activeChips} onRemove={removeChip} onClearAll={clearFilters} />
          </div>
        )}
      </div>

      <div className="colaboradores-empresa-list-header">
        <p className="colaboradores-empresa-result-count">{resultLabel}</p>
      </div>

      <div className="colaboradores-empresa-table-wrap relative">
        {isPending && <LoadingState overlay label="Atualizando colaboradores..." />}

        {initialItems.length === 0 ? (
          <EmptyState
            icon={Users}
            compact
            className="colaboradores-empresa-empty"
            title={hasActiveFilters ? "Nenhum resultado para os filtros" : "Nenhum colaborador cadastrado"}
            description={
              hasActiveFilters
                ? "Ajuste os filtros ou limpe a busca para ver mais colaboradores."
                : "Cadastre o primeiro colaborador ou importe uma planilha para começar."
            }
            action={
              canManage
                ? {
                    label: hasActiveFilters ? "Limpar filtros" : "Adicionar colaborador",
                    onClick: hasActiveFilters ? clearFilters : () => setNewDialogOpen(true),
                  }
                : undefined
            }
            secondaryAction={
              canManage && !hasActiveFilters
                ? { label: "Importar planilha", onClick: () => setImportOpen(true), variant: "outline" }
                : undefined
            }
          />
        ) : (
          <>
            <div className="colaboradores-empresa-table-scroll hidden md:block">
              <table className="colaboradores-empresa-table">
                <thead>
                  <tr>
                    <th>Colaborador</th>
                    <th>CPF</th>
                    <th>Último exame</th>
                    <th>Próximo periódico</th>
                    <th>Pendências</th>
                    <th>Status</th>
                    <th className="colaboradores-empresa-th-actions">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {initialItems.map((c) => {
                    const periodic = getPeriodicExamBadge(c.nextPeriodicDate);
                    const periodicHint = formatPeriodicHint(c.nextPeriodicDate);
                    return (
                      <tr key={c.id} className="colaboradores-empresa-row">
                        <td>
                          <div className="colaboradores-empresa-name">{c.fullName}</div>
                          <div className="colaboradores-empresa-role">
                            {collaboratorRoleLine(c.jobTitle, c.department)}
                          </div>
                        </td>
                        <td className="colaboradores-empresa-cpf">{c.cpfFormatted}</td>
                        <td>
                          {c.lastExamLabel ? (
                            <>
                              <div className="colaboradores-empresa-exam-type">{c.lastExamLabel}</div>
                              {c.lastExamDate && (
                                <div className="colaboradores-empresa-exam-date">
                                  {format(new Date(c.lastExamDate), "dd/MM/yyyy", { locale: ptBR })}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="colaboradores-empresa-muted">—</span>
                          )}
                        </td>
                        <td>
                          {c.nextPeriodicDate ? (
                            <>
                              <div className="colaboradores-empresa-periodic-date">
                                {format(new Date(c.nextPeriodicDate), "dd/MM/yyyy", { locale: ptBR })}
                              </div>
                              <div
                                className={cn(
                                  "colaboradores-empresa-periodic-hint",
                                  periodic.tone === "danger" && "is-danger",
                                  periodic.tone === "warning" && "is-warning"
                                )}
                              >
                                {periodicHint}
                              </div>
                            </>
                          ) : (
                            <div>
                              <div className="colaboradores-empresa-muted">Não definido</div>
                              {canManage && (
                                <Link
                                  href={`/dashboard/colaboradores/${c.id}`}
                                  className="colaboradores-empresa-inline-action"
                                >
                                  Definir periodicidade
                                </Link>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          {c.pendingDocsCount > 0 ? (
                            <Badge variant="outline" className="colaboradores-empresa-pending-badge">
                              {pendingLabel(c.pendingDocsCount)}
                            </Badge>
                          ) : (
                            <span className="colaboradores-empresa-muted">Sem pendências</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={c.status} type="collaborator" />
                        </td>
                        <td className="colaboradores-empresa-td-actions">
                          <CollaboratorActionMenu
                            variant="empresa"
                            onViewDetails={() => router.push(`/dashboard/colaboradores/${c.id}`)}
                            onViewProfile={() => router.push(`/dashboard/colaboradores/${c.id}`)}
                            onSchedule={() =>
                              router.push(`/dashboard/encaminhamentos/novo?patientId=${c.id}`)
                            }
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
              {initialItems.map((c) => (
                <article key={c.id} className="colaboradores-empresa-mobile-card">
                  <div className="colaboradores-empresa-mobile-card-head">
                    <div>
                      <p className="colaboradores-empresa-name">{c.fullName}</p>
                      <p className="colaboradores-empresa-role">
                        {collaboratorRoleLine(c.jobTitle, c.department)}
                      </p>
                    </div>
                    <StatusBadge status={c.status} type="collaborator" />
                  </div>
                  <dl className="colaboradores-empresa-mobile-meta">
                    <div>
                      <dt>CPF</dt>
                      <dd>{c.cpfFormatted}</dd>
                    </div>
                    <div>
                      <dt>Último exame</dt>
                      <dd>{c.lastExamLabel ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Pendências</dt>
                      <dd>{c.pendingDocsCount > 0 ? pendingLabel(c.pendingDocsCount) : "Sem pendências"}</dd>
                    </div>
                  </dl>
                  <div className="colaboradores-empresa-mobile-actions">
                    <Link
                      href={`/dashboard/colaboradores/${c.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg")}
                    >
                      Ver perfil
                    </Link>
                    <Link
                      href={`/dashboard/encaminhamentos/novo?patientId=${c.id}`}
                      className={cn(buttonVariants({ variant: "brand", size: "sm" }), "rounded-lg")}
                    >
                      Encaminhar
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      {totalPages > 1 && (
        <div className="colaboradores-empresa-pagination">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={initialPage <= 1 || isPending}
            onClick={() => applyFilters({ page: String(initialPage - 1) })}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="colaboradores-empresa-pagination-label">
            Página {initialPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={initialPage >= totalPages || isPending}
            onClick={() => applyFilters({ page: String(initialPage + 1) })}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <CollaboratorImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <NewCollaboratorDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        companies={companies}
        defaultCompanyId={companies[0]?.id}
        isEmpresaPortal
        onSuccess={(id, createReferral) => {
          if (createReferral) {
            router.push(`/dashboard/encaminhamentos/novo?patientId=${id}`);
          } else {
            router.push(`/dashboard/colaboradores/${id}`);
          }
          router.refresh();
        }}
      />
    </PageModule>
  );
}
