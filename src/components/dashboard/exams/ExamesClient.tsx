"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Copy,
  Power,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  X,
  CheckCircle2,
  Ban,
  ClipboardList,
  FlaskConical,
  Globe,
  type LucideIcon,
} from "lucide-react";
import type { ExamDetailSerialized, ExamListItem } from "@/lib/exams";
import {
  EXAM_STAT_CARDS,
  EXAM_CATEGORY_LABELS,
  EXAM_PREPARATION_LABELS,
  EXAM_STATUS_LABELS,
  EXAM_DEADLINE_TYPE_LABELS,
  examToGuide,
} from "@/lib/exams";
import { ExamPreparationDrawer } from "@/components/public/ExamPreparationDrawer";
import { getExamDetail, toggleExamStatus, duplicateExam } from "@/actions/exams";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PageModule } from "@/components/dashboard/PageModule";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SystemActionMenu, type SystemActionItem } from "@/components/dashboard/SystemActionMenu";
import { LoadingState } from "@/components/ui/loading-state";
import { ExamDetailContent } from "./ExamDetailContent";
import { ExamFormDialog } from "./ExamDialogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STAT_ICONS: Record<string, LucideIcon> = {
  ativos: CheckCircle2,
  inativos: Ban,
  sem_preparo: ClipboardList,
  preparo_obrigatorio: ClipboardList,
  laboratoriais: FlaskConical,
  no_site: Globe,
};

const STAT_TONES: Record<string, "primary" | "warning"> = {
  ativos: "primary",
  inativos: "primary",
  sem_preparo: "primary",
  preparo_obrigatorio: "warning",
  laboratoriais: "primary",
  no_site: "primary",
};

type ExamesClientProps = {
  initialItems: ExamListItem[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  statCounts: Record<string, number>;
  canManage: boolean;
  isEmpresaPortal?: boolean;
  filters: {
    q?: string;
    card?: string;
    category?: string;
    status?: string;
    preparationType?: string;
    showOnWebsite?: string;
    requiresAppointment?: string;
    deadline?: string;
    sort?: string;
  };
};

function PreparationBadge({ type }: { type: ExamListItem["preparationType"] }) {
  const colors: Record<string, string> = {
    SEM_PREPARO: "bg-slate-100 text-slate-700",
    PREPARO_NECESSARIO: "bg-blue-50 text-blue-800",
    JEJUM_NECESSARIO: "bg-amber-50 text-amber-800",
    ATENCAO_ESPECIAL: "bg-orange-50 text-orange-800",
    VERIFICAR_EXAME: "bg-violet-50 text-violet-800",
    ORIENTACAO_ESPECIFICA: "bg-teal-50 text-teal-800",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        colors[type] ?? "bg-slate-100 text-slate-700"
      )}
    >
      {EXAM_PREPARATION_LABELS[type]}
    </span>
  );
}

export function ExamesClient({
  initialItems,
  initialTotal,
  initialPage,
  pageSize,
  statCounts,
  canManage,
  isEmpresaPortal = false,
  filters,
}: ExamesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(filters.q ?? "");
  const [category, setCategory] = useState(filters.category ?? "");
  const [status, setStatus] = useState(filters.status ?? "");
  const [preparationType, setPreparationType] = useState(filters.preparationType ?? "");
  const [showOnWebsite, setShowOnWebsite] = useState(filters.showOnWebsite ?? "");
  const [requiresAppointment, setRequiresAppointment] = useState(filters.requiresAppointment ?? "");
  const [deadline, setDeadline] = useState(filters.deadline ?? "");
  const [sort, setSort] = useState(filters.sort ?? "name");

  const [formOpen, setFormOpen] = useState(false);
  const [editExam, setEditExam] = useState<ExamDetailSerialized | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [prepDrawerOpen, setPrepDrawerOpen] = useState(false);
  const [detailExam, setDetailExam] = useState<ExamDetailSerialized | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loadingExamId, setLoadingExamId] = useState<string | null>(null);

  const activeCard = filters.card ?? "ALL";
  const totalPages = Math.max(1, Math.ceil(initialTotal / pageSize));

  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "ALL") params.delete(key);
        else params.set(key, value);
      });
      if (!updates.page) params.delete("page");
      startTransition(() => {
        router.push(`/dashboard/exames?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handleSearch = () => {
    updateFilters({
      q,
      card: activeCard !== "ALL" ? activeCard : undefined,
      category,
      status,
      preparationType,
      showOnWebsite,
      requiresAppointment,
      deadline,
      sort,
    });
  };

  const clearFilters = () => {
    setQ("");
    setCategory("");
    setStatus("");
    setPreparationType("");
    setShowOnWebsite("");
    setRequiresAppointment("");
    setDeadline("");
    setSort("name");
    startTransition(() => router.push("/dashboard/exames"));
  };

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.q ||
          (filters.card && filters.card !== "ALL") ||
          filters.category ||
          filters.status ||
          filters.preparationType ||
          filters.showOnWebsite ||
          filters.requiresAppointment ||
          filters.deadline ||
          (filters.sort && filters.sort !== "name")
      ),
    [filters]
  );

  const openDetail = async (id: string) => {
    setLoadingExamId(id);
    setDetailExam(null);
    const result = await getExamDetail(id);
    setLoadingExamId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setDetailExam(result.exam);
    if (isEmpresaPortal) {
      setPrepDrawerOpen(true);
    } else {
      setDrawerOpen(true);
    }
  };

  const openEdit = async (id: string) => {
    const result = await getExamDetail(id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setEditExam(result.exam);
    setFormOpen(true);
  };

  const handleToggleStatus = async (item: ExamListItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActionLoading(item.id);
    const newStatus = item.status === "ATIVO" ? "INATIVO" : "ATIVO";
    const result = await toggleExamStatus({ examId: item.id, status: newStatus });
    setActionLoading(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(newStatus === "ATIVO" ? "Exame ativado." : "Exame inativado.");
    router.refresh();
    if (detailExam?.id === item.id) openDetail(item.id);
  };

  const handleDuplicate = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActionLoading(id);
    const result = await duplicateExam(id);
    setActionLoading(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Exame duplicado.");
    router.refresh();
    if (result.examId) openDetail(result.examId);
  };

  const buildExamActions = (item: ExamListItem): SystemActionItem[] => {
    const items: SystemActionItem[] = [
      {
        label: "Ver detalhes",
        icon: Eye,
        iconTone: "view",
        onClick: () => openDetail(item.id),
      },
    ];

    if (canManage) {
      items.push(
        {
          label: "Editar",
          icon: Pencil,
          iconTone: "docs",
          onClick: () => openEdit(item.id),
        },
        {
          label: "Duplicar",
          icon: Copy,
          iconTone: "schedule",
          onClick: () => handleDuplicate(item.id),
          disabled: actionLoading === item.id,
        },
        {
          label: item.status === "ATIVO" ? "Desativar" : "Ativar",
          icon: Power,
          iconTone: item.status === "ATIVO" ? "cancel" : "progress",
          onClick: () => handleToggleStatus(item),
          disabled: actionLoading === item.id,
        }
      );
    }

    if (item.showOnWebsite) {
      items.push({
        label: "Ver no site",
        icon: ExternalLink,
        iconTone: "portal",
        onClick: () =>
          window.open(`/exames?exame=${item.slug}`, "_blank", "noopener,noreferrer"),
      });
    }

    return items;
  };

  useEffect(() => {
    if (searchParams.get("new") === "1" && canManage) {
      setEditExam(null);
      setFormOpen(true);
    }
  }, [searchParams, canManage]);

  useEffect(() => {
    if (!isEmpresaPortal) return;
    const currentQ = searchParams.get("q") ?? "";
    if (q === currentQ) return;

    const timer = window.setTimeout(() => {
      updateFilters({ q: q.trim() || undefined });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [q, isEmpresaPortal, searchParams, updateFilters]);

  useEffect(() => {
    if (isEmpresaPortal) return;
    setQ(filters.q ?? "");
    setCategory(filters.category ?? "");
    setStatus(filters.status ?? "");
    setPreparationType(filters.preparationType ?? "");
    setShowOnWebsite(filters.showOnWebsite ?? "");
    setRequiresAppointment(filters.requiresAppointment ?? "");
    setDeadline(filters.deadline ?? "");
    setSort(filters.sort ?? "name");
  }, [filters, isEmpresaPortal]);

  const clearEmpresaSearch = () => {
    setQ("");
    updateFilters({ q: undefined });
  };

  const empty = initialItems.length === 0 && !hasActiveFilters;
  const resultLabel =
    initialTotal === 1 ? "1 exame no catálogo" : `${initialTotal} exames no catálogo`;

  const openNewExam = () => {
    setEditExam(null);
    setFormOpen(true);
  };

  return (
    <PageModule>
      {isEmpresaPortal ? (
        <PageHeader
          title="Preparos"
          description="Orientações de preparo para orientar colaboradores antes dos exames"
        />
      ) : (
        <header className="colaboradores-empresa-header">
          <div className="colaboradores-empresa-header-copy">
            <h1 className="colaboradores-empresa-title">Exames e preparos</h1>
            <p className="colaboradores-empresa-subtitle">
              Catálogo de exames, preparos e prazos
            </p>
          </div>
          <div className="colaboradores-empresa-header-actions">
            {canManage && (
              <Button variant="brand" size="sm" onClick={openNewExam}>
                <Plus className="mr-2 h-4 w-4" /> Novo exame
              </Button>
            )}
          </div>
        </header>
      )}

      {isEmpresaPortal ? (
        <div className="empresa-exams-panel">
          <div className="empresa-exams-toolbar">
            <div className="empresa-exams-search">
              <Search className="empresa-exams-search-icon" aria-hidden />
              <Input
                placeholder="Buscar exame ou categoria"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateFilters({ q: q.trim() || undefined });
                }}
                className="empresa-exams-search-input"
                aria-label="Buscar exame"
              />
              {q && (
                <button
                  type="button"
                  className="empresa-exams-search-clear"
                  onClick={clearEmpresaSearch}
                  aria-label="Limpar busca"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="empresa-exams-count" aria-live="polite">
              {initialTotal} exame{initialTotal !== 1 ? "s" : ""}
            </p>
          </div>

          {empty ? (
            <EmptyState
              icon={Stethoscope}
              className="border-0 bg-transparent shadow-none"
              title="Nenhum exame disponível"
              description="O catálogo de preparos ainda não foi publicado pela clínica."
            />
          ) : initialItems.length === 0 ? (
            <div className="empresa-exams-empty">
              <p>Nenhum exame encontrado para &ldquo;{filters.q}&rdquo;.</p>
              <Button variant="outline" size="sm" onClick={clearEmpresaSearch}>
                Limpar busca
              </Button>
            </div>
          ) : (
            <div className="relative">
              {isPending && <LoadingState overlay label="Buscando exames..." />}
              <div className="empresa-exams-list">
                {initialItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="empresa-exams-row"
                    disabled={loadingExamId === item.id}
                    onClick={() => openDetail(item.id)}
                  >
                    <span className="empresa-exams-row-icon" aria-hidden>
                      <Stethoscope className="h-4 w-4" />
                    </span>
                    <span className="empresa-exams-row-body">
                      <span className="empresa-exams-row-top">
                        <span className="empresa-exams-row-name">{item.name}</span>
                        <PreparationBadge type={item.preparationType} />
                      </span>
                      {item.shortDescription && (
                        <span className="empresa-exams-row-desc">{item.shortDescription}</span>
                      )}
                      <span className="empresa-exams-row-meta">
                        <span className="empresa-exams-category">
                          {EXAM_CATEGORY_LABELS[item.category]}
                        </span>
                        {item.averageDeadline && (
                          <>
                            <span className="empresa-exams-dot" aria-hidden />
                            <span>Prazo: {item.averageDeadline}</span>
                          </>
                        )}
                      </span>
                    </span>
                    <span className="empresa-exams-row-action" aria-hidden>
                      {loadingExamId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-green)]" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="empresa-exams-pagination">
                  <p className="text-sm text-slate-500">
                    Página {initialPage} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={initialPage <= 1 || isPending}
                      onClick={() => updateFilters({ page: String(initialPage - 1) })}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={initialPage >= totalPages || isPending}
                      onClick={() => updateFilters({ page: String(initialPage + 1) })}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="colaboradores-empresa-stats">
            {EXAM_STAT_CARDS.map((card) => {
              const Icon = STAT_ICONS[card.key] ?? Stethoscope;
              const isActive = activeCard === card.filter;
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => updateFilters({ card: isActive ? "ALL" : card.filter })}
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
                  placeholder="Buscar por nome do exame, categoria ou preparo"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="colaboradores-empresa-search-input"
                  aria-label="Buscar exames"
                />
              </div>

              <select
                className="colaboradores-empresa-select"
                value={category || "ALL"}
                onChange={(e) => {
                  const value = e.target.value === "ALL" ? "" : e.target.value;
                  setCategory(value);
                  updateFilters({ category: value || undefined });
                }}
                aria-label="Filtrar por categoria"
              >
                <option value="ALL">Categoria</option>
                {Object.entries(EXAM_CATEGORY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>

              <select
                className="colaboradores-empresa-select"
                value={status || "ALL"}
                onChange={(e) => {
                  const value = e.target.value === "ALL" ? "" : e.target.value;
                  setStatus(value);
                  updateFilters({ status: value || undefined });
                }}
                aria-label="Filtrar por status"
              >
                <option value="ALL">Status</option>
                {Object.entries(EXAM_STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>

              <select
                className="colaboradores-empresa-select"
                value={preparationType || "ALL"}
                onChange={(e) => {
                  const value = e.target.value === "ALL" ? "" : e.target.value;
                  setPreparationType(value);
                  updateFilters({ preparationType: value || undefined });
                }}
                aria-label="Filtrar por tipo de preparo"
              >
                <option value="ALL">Tipo de preparo</option>
                {Object.entries(EXAM_PREPARATION_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>

              <select
                className="colaboradores-empresa-select"
                value={showOnWebsite || "ALL"}
                onChange={(e) => {
                  const value = e.target.value === "ALL" ? "" : e.target.value;
                  setShowOnWebsite(value);
                  updateFilters({ showOnWebsite: value || undefined });
                }}
                aria-label="Filtrar por exibição no site"
              >
                <option value="ALL">Exibir no site</option>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>

              <select
                className="colaboradores-empresa-select"
                value={requiresAppointment || "ALL"}
                onChange={(e) => {
                  const value = e.target.value === "ALL" ? "" : e.target.value;
                  setRequiresAppointment(value);
                  updateFilters({ requiresAppointment: value || undefined });
                }}
                aria-label="Filtrar por agendamento"
              >
                <option value="ALL">Exigir agendamento</option>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>

              <select
                className="colaboradores-empresa-select"
                value={deadline || "ALL"}
                onChange={(e) => {
                  const value = e.target.value === "ALL" ? "" : e.target.value;
                  setDeadline(value);
                  updateFilters({ deadline: value || undefined });
                }}
                aria-label="Filtrar por prazo de entrega"
              >
                <option value="ALL">Prazo de entrega</option>
                {Object.entries(EXAM_DEADLINE_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>

              <select
                className="colaboradores-empresa-select"
                value={sort}
                onChange={(e) => {
                  const value = e.target.value;
                  setSort(value);
                  updateFilters({ sort: value });
                }}
                aria-label="Ordenar exames"
              >
                <option value="name">Ordenar: Nome</option>
                <option value="category">Ordenar: Categoria</option>
                <option value="status">Ordenar: Status</option>
                <option value="displayOrder">Ordenar: Ordem de exibição</option>
              </select>

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="colaboradores-empresa-clear-btn rounded-md"
                  onClick={clearFilters}
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {empty ? (
            <EmptyState
              icon={Stethoscope}
              className="mt-8 bg-white"
              title="Nenhum exame cadastrado"
              description="Cadastre exames para alimentar encaminhamentos, agenda e página pública de preparos."
              action={
                canManage
                  ? {
                      label: "Novo exame",
                      onClick: openNewExam,
                    }
                  : undefined
              }
            />
          ) : (
            <div className="colaboradores-empresa-table-wrap relative">
              {isPending && <LoadingState overlay label="Atualizando exames..." />}

              <div className="colaboradores-empresa-result-bar">
                <span className="text-xs text-slate-500">{resultLabel}</span>
              </div>

              {initialItems.length === 0 ? (
                <EmptyState
                  icon={Stethoscope}
                  title="Nenhum exame encontrado"
                  description="Ajuste os filtros ou cadastre um novo exame."
                  action={
                    canManage
                      ? { label: "Novo exame", onClick: openNewExam }
                      : undefined
                  }
                />
              ) : (
                <>
                  <div className="colaboradores-empresa-table-scroll hidden md:block">
                    <table className="colaboradores-empresa-table">
                      <thead>
                        <tr>
                          <th>Exame</th>
                          <th>Categoria</th>
                          <th>Tipo de preparo</th>
                          <th>Prazo médio</th>
                          <th>Exibir no site</th>
                          <th>Status</th>
                          <th>Atualizado em</th>
                          <th className="colaboradores-empresa-th-actions">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {initialItems.map((item) => (
                          <tr
                            key={item.id}
                            className="cursor-pointer"
                            onClick={() => openDetail(item.id)}
                          >
                            <td>
                              <div className="font-medium text-slate-900">{item.name}</div>
                            </td>
                            <td>
                              <span className="text-sm text-slate-600">
                                {EXAM_CATEGORY_LABELS[item.category]}
                              </span>
                            </td>
                            <td>
                              <PreparationBadge type={item.preparationType} />
                            </td>
                            <td className="text-sm text-slate-600">
                              {item.averageDeadline ?? "—"}
                            </td>
                            <td>
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                                  item.showOnWebsite
                                    ? "bg-emerald-50 text-emerald-800"
                                    : "bg-slate-100 text-slate-500"
                                )}
                              >
                                {item.showOnWebsite ? "Sim" : "Não"}
                              </span>
                            </td>
                            <td>
                              <StatusBadge status={item.status} type="exam" />
                            </td>
                            <td className="whitespace-nowrap text-sm text-slate-500">
                              {format(new Date(item.updatedAt), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </td>
                            <td
                              className="colaboradores-empresa-td-actions"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SystemActionMenu items={buildExamActions(item)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="colaboradores-empresa-mobile-list md:hidden">
                    {initialItems.map((item) => (
                      <article
                        key={item.id}
                        className="mobile-list-card cursor-pointer"
                        onClick={() => openDetail(item.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mobile-list-card-icon">
                            <Stethoscope className="h-4 w-4" strokeWidth={2} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-[var(--brand-navy)]">
                                {item.name}
                              </p>
                              <StatusBadge status={item.status} type="exam" />
                            </div>
                            <p className="mt-0.5 text-xs text-[var(--dash-text-muted)]">
                              {EXAM_CATEGORY_LABELS[item.category]}
                            </p>
                            {item.averageDeadline && (
                              <p className="mt-1 text-[0.6875rem] text-[var(--dash-text-subtle)]">
                                Prazo: {item.averageDeadline}
                              </p>
                            )}
                            <div
                              className="mt-2 flex items-center justify-between gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <PreparationBadge type={item.preparationType} />
                              <SystemActionMenu items={buildExamActions(item)} />
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}

              {totalPages > 1 && (
                <div className="colaboradores-empresa-pagination">
                  <p className="text-sm text-slate-500">
                    {resultLabel} · Página {initialPage} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={initialPage <= 1 || isPending}
                      onClick={() => updateFilters({ page: String(initialPage - 1) })}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={initialPage >= totalPages || isPending}
                      onClick={() => updateFilters({ page: String(initialPage + 1) })}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalhe do exame</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {detailLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[#16A085]" />
              </div>
            ) : detailExam ? (
              <>
                <ExamDetailContent exam={detailExam} />
                {canManage && (
                  <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
                    <Button variant="brand" size="sm" onClick={() => openEdit(detailExam.id)}>
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(detailExam.id)}
                    >
                      <Copy className="mr-2 h-4 w-4" /> Duplicar
                    </Button>
                    {detailExam.showOnWebsite && detailExam.status === "ATIVO" && (
                      <a
                        href={`/exames?exame=${detailExam.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          <ExternalLink className="mr-2 h-4 w-4" /> Ver no site
                        </Button>
                      </a>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      {isEmpresaPortal && (
        <ExamPreparationDrawer
          exam={detailExam ? examToGuide(detailExam) : null}
          open={prepDrawerOpen}
          onOpenChange={(open) => {
            setPrepDrawerOpen(open);
            if (!open) setDetailExam(null);
          }}
        />
      )}

      {canManage && (
        <ExamFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          exam={editExam}
          onSuccess={(id) => {
            router.refresh();
            if (id) openDetail(id);
          }}
        />
      )}
    </PageModule>
  );
}
