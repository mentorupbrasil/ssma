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
} from "lucide-react";
import type { ExamDetailSerialized, ExamListItem } from "@/lib/exams";
import {
  EXAM_STAT_CARDS,
  EXAM_CATEGORY_LABELS,
  EXAM_PREPARATION_LABELS,
  EXAM_STATUS_LABELS,
  EXAM_DEADLINE_TYPE_LABELS,
} from "@/lib/exams";
import { getExamDetail, toggleExamStatus, duplicateExam } from "@/actions/exams";
import { PageHeader } from "@/components/dashboard/PageHeader";
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
  const [detailExam, setDetailExam] = useState<ExamDetailSerialized | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetailExam(null);
    const result = await getExamDetail(id);
    setDetailLoading(false);
    if (!result.success) {
      toast.error(result.error);
      setDrawerOpen(false);
      return;
    }
    setDetailExam(result.exam);
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

  const empty = initialItems.length === 0 && !filters.q && activeCard === "ALL";

  return (
    <div className="referrals-module">
      <PageHeader title="Exames" description="Catálogo de exames, preparos e prazos">
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

      <div className="referral-stat-grid referral-stat-grid-3 lg:grid-cols-6">
        {EXAM_STAT_CARDS.map((card) => {
          const isActive = activeCard === card.filter;
          return (
            <button
              key={card.key}
              type="button"
              className={cn("referral-stat-card text-left", isActive && "referral-stat-card-active")}
              onClick={() =>
                updateFilters({ card: isActive ? "ALL" : card.filter })
              }
            >
              <span className="referral-stat-count">{statCounts[card.key] ?? 0}</span>
              <span className="referral-stat-label">{card.label}</span>
            </button>
          );
        })}
      </div>

      <FilterBar className="mt-6" onSearch={handleSearch} onClear={clearFilters} isPending={isPending}>
        <div className="referral-filter-search sm:col-span-2">
            <Search className="referral-filter-search-icon h-4 w-4" />
            <Input
              placeholder="Buscar por nome do exame, categoria ou preparo"
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
          <select
            className="referral-filter-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">Ordenar: Nome</option>
            <option value="category">Ordenar: Categoria</option>
            <option value="status">Ordenar: Status</option>
            <option value="displayOrder">Ordenar: Ordem de exibição</option>
          </select>
      </FilterBar>

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
                  onClick: () => {
                    setEditExam(null);
                    setFormOpen(true);
                  },
                }
              : undefined
          }
        />
      ) : (
        <div className="relative mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          {isPending && <LoadingState overlay label="Atualizando exames..." />}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exame</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead className="hidden lg:table-cell">Tipo de preparo</TableHead>
                <TableHead className="hidden sm:table-cell">Prazo médio</TableHead>
                <TableHead className="hidden lg:table-cell">Exibir no site</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden xl:table-cell">Atualizado em</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-slate-500">
                    Nenhum exame encontrado com os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                initialItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-slate-50/80"
                    onClick={() => openDetail(item.id)}
                  >
                    <TableCell>
                      <div className="font-medium text-slate-900">{item.name}</div>
                      {item.shortDescription && (
                        <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                          {item.shortDescription}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="rounded-full font-normal">
                        {EXAM_CATEGORY_LABELS[item.category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <PreparationBadge type={item.preparationType} />
                    </TableCell>
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
    </div>
  );
}
