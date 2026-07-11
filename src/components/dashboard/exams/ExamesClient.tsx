"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Search,
  MoreHorizontal,
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
import { FilterMetricGrid } from "@/components/dashboard/FilterMetricGrid";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { LoadingState } from "@/components/ui/loading-state";
import { ExamDetailContent } from "./ExamDetailContent";
import { ExamFormDialog } from "./ExamDialogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  const clearEmpresaSearch = () => {
    setQ("");
    updateFilters({ q: undefined });
  };

  const empty = initialItems.length === 0 && !filters.q && activeCard === "ALL";

  return (
    <PageModule>
      <PageHeader
        title={isEmpresaPortal ? "Preparos" : "Exames e preparos"}
        description={
          isEmpresaPortal
            ? "Orientações de preparo para orientar colaboradores antes dos exames"
            : "Catálogo de exames, preparos e prazos"
        }
      >
        {canManage && (
          <Button
            variant="brand"
            onClick={() => {
              setEditExam(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo exame
          </Button>
        )}
      </PageHeader>

      {!isEmpresaPortal && (
      <FilterMetricGrid
        items={EXAM_STAT_CARDS.map((card) => {
          const isActive = activeCard === card.filter;
          return {
            key: card.key,
            metaKey: `exam:${card.key}`,
            label: card.label,
            value: statCounts[card.key] ?? 0,
            active: isActive,
            onClick: () => updateFilters({ card: isActive ? "ALL" : card.filter }),
          };
        })}
      />
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
      <FilterBar onSearch={handleSearch} onClear={clearFilters} isPending={isPending}>
        <div className="referral-filter-search sm:col-span-2">
            <Search className="referral-filter-search-icon h-4 w-4" />
            <Input
              placeholder={
                isEmpresaPortal
                  ? "Buscar exame ou categoria"
                  : "Buscar por nome do exame, categoria ou preparo"
              }
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <select
            className="referral-filter-select"
            value={category || "ALL"}
            onChange={(e) => setCategory(e.target.value === "ALL" ? "" : e.target.value)}
          >
            <option value="ALL">Categoria</option>
            {Object.entries(EXAM_CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          {!isEmpresaPortal && (
          <>
          <select
            className="referral-filter-select"
            value={status || "ALL"}
            onChange={(e) => setStatus(e.target.value === "ALL" ? "" : e.target.value)}
          >
            <option value="ALL">Status</option>
            {Object.entries(EXAM_STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select
            className="referral-filter-select"
            value={preparationType || "ALL"}
            onChange={(e) =>
              setPreparationType(e.target.value === "ALL" ? "" : e.target.value)
            }
          >
            <option value="ALL">Tipo de preparo</option>
            {Object.entries(EXAM_PREPARATION_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select
            className="referral-filter-select"
            value={showOnWebsite || "ALL"}
            onChange={(e) =>
              setShowOnWebsite(e.target.value === "ALL" ? "" : e.target.value)
            }
          >
            <option value="ALL">Exibir no site</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
          <select
            className="referral-filter-select"
            value={requiresAppointment || "ALL"}
            onChange={(e) =>
              setRequiresAppointment(e.target.value === "ALL" ? "" : e.target.value)
            }
          >
            <option value="ALL">Exigir agendamento</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
          <select
            className="referral-filter-select"
            value={deadline || "ALL"}
            onChange={(e) => setDeadline(e.target.value === "ALL" ? "" : e.target.value)}
          >
            <option value="ALL">Prazo de entrega</option>
            {Object.entries(EXAM_DEADLINE_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          </>
          )}
          {isEmpresaPortal && (
          <select
            className="referral-filter-select"
            value={preparationType || "ALL"}
            onChange={(e) =>
              setPreparationType(e.target.value === "ALL" ? "" : e.target.value)
            }
          >
            <option value="ALL">Tipo de preparo</option>
            {Object.entries(EXAM_PREPARATION_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          )}
          <select
            className="referral-filter-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">Ordenar: Nome</option>
            {!isEmpresaPortal && <option value="category">Ordenar: Categoria</option>}
            {!isEmpresaPortal && <option value="status">Ordenar: Status</option>}
            {!isEmpresaPortal && <option value="displayOrder">Ordenar: Ordem de exibição</option>}
          </select>
      </FilterBar>
      )}

      {!isEmpresaPortal && empty ? (
        <EmptyState
          icon={Stethoscope}
          className="mt-8 bg-white"
          title="Nenhum exame cadastrado"
          description="Cadastre exames para alimentar encaminhamentos, agenda e página pública de preparos."
          action={
            canManage
              ? {
                  label: "Novo exame",
                  onClick: () => {
                    setEditExam(null);
                    setFormOpen(true);
                  },
                }
              : undefined
          }
        />
      ) : !isEmpresaPortal ? (
        <div className="relative mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          {isPending && <LoadingState overlay label="Atualizando exames..." />}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exame</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead className="hidden lg:table-cell">Tipo de preparo</TableHead>
                {!isEmpresaPortal && (
                  <>
                    <TableHead className="hidden sm:table-cell">Prazo médio</TableHead>
                    <TableHead className="hidden lg:table-cell">Exibir no site</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden xl:table-cell">Atualizado em</TableHead>
                    <TableHead className="w-12" />
                  </>
                )}
                {isEmpresaPortal && <TableHead className="text-right">Ver detalhes</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isEmpresaPortal ? 4 : 8}
                    className="py-10 text-center text-slate-500"
                  >
                    Nenhum exame encontrado com os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                initialItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "hover:bg-slate-50/80",
                      !isEmpresaPortal && "cursor-pointer"
                    )}
                    onClick={!isEmpresaPortal ? () => openDetail(item.id) : undefined}
                  >
                    <TableCell>
                      <div className="font-medium text-slate-900">{item.name}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="rounded-full font-normal">
                        {EXAM_CATEGORY_LABELS[item.category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <PreparationBadge type={item.preparationType} />
                    </TableCell>
                    {!isEmpresaPortal && (
                      <>
                    <TableCell className="hidden sm:table-cell text-sm text-slate-600">
                      {item.averageDeadline ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full font-normal",
                          item.showOnWebsite
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 text-slate-500"
                        )}
                      >
                        {item.showOnWebsite ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} type="exam" />
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-slate-500">
                      {format(new Date(item.updatedAt), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetail(item.id)}>
                            <Eye className="mr-2 h-4 w-4" /> Ver detalhes
                          </DropdownMenuItem>
                          {canManage && (
                            <DropdownMenuItem onClick={() => openEdit(item.id)}>
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                          )}
                          {canManage && (
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(item.id)}
                              disabled={actionLoading === item.id}
                            >
                              <Copy className="mr-2 h-4 w-4" /> Duplicar
                            </DropdownMenuItem>
                          )}
                          {canManage && (
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(item)}
                              disabled={actionLoading === item.id}
                            >
                              <Power className="mr-2 h-4 w-4" />
                              {item.status === "ATIVO" ? "Inativar" : "Ativar"}
                            </DropdownMenuItem>
                          )}
                          {item.showOnWebsite && item.status === "ATIVO" && (
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(`/exames?exame=${item.slug}`, "_blank", "noopener,noreferrer")
                              }
                            >
                              <ExternalLink className="mr-2 h-4 w-4" /> Visualizar no site
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                      </>
                    )}
                    {isEmpresaPortal && (
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          disabled={loadingExamId === item.id}
                          onClick={() => openDetail(item.id)}
                        >
                          {loadingExamId === item.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="mr-2 h-4 w-4" />
                          )}
                          Ver detalhes
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <p className="text-sm text-slate-500">
                {initialTotal} exame{initialTotal !== 1 ? "s" : ""} · Página {initialPage} de{" "}
                {totalPages}
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
      ) : null}

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
