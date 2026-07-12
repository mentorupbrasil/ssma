"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, Pencil, Power, ChevronLeft, ChevronRight } from "lucide-react";
import type { ExamStatus } from "@prisma/client";
import type { ExamDetailSerialized, ExamListItem } from "@/lib/exams";
import {
  EXAM_CATEGORY_LABELS,
  EXAM_STATUS_LABELS,
  EXAM_PAGE_SIZE_OPTIONS,
} from "@/lib/exams";
import { getExamDetail, toggleExamStatus } from "@/actions/exams";
import { PageModule } from "@/components/dashboard/PageModule";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SystemActionMenu, type SystemActionItem } from "@/components/dashboard/SystemActionMenu";
import { SystemModalShell } from "@/components/dashboard/SystemModalShell";
import { LoadingState } from "@/components/ui/loading-state";
import { ExamFormDialog } from "./ExamDialogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ExamesClientProps = {
  initialItems: ExamListItem[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  canManage: boolean;
  filters: {
    q?: string;
    category?: string;
    status?: string;
    pageSize?: string;
  };
};

function statusLabel(status: ExamStatus) {
  if (status === "ATIVO") return "Ativo";
  if (status === "INATIVO") return "Inativo";
  return EXAM_STATUS_LABELS[status] ?? status;
}

export function ExamesClient({
  initialItems,
  initialTotal,
  initialPage,
  pageSize,
  canManage,
  filters,
}: ExamesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(filters.q ?? "");
  const [category, setCategory] = useState(filters.category ?? "");
  const [status, setStatus] = useState(filters.status ?? "");

  const [formOpen, setFormOpen] = useState(false);
  const [editExam, setEditExam] = useState<ExamDetailSerialized | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<ExamListItem | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(initialTotal / pageSize));
  const rangeFrom = initialTotal === 0 ? 0 : (initialPage - 1) * pageSize + 1;
  const rangeTo = Math.min(initialPage * pageSize, initialTotal);
  const hasFilters = Boolean(filters.q || filters.category || filters.status);

  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>, opts?: { resetPage?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) params.delete(key);
        else params.set(key, value);
      });
      if (opts?.resetPage !== false && !("page" in updates)) {
        params.delete("page");
      }
      startTransition(() => {
        router.push(`/dashboard/exames?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  useEffect(() => {
    setQ(filters.q ?? "");
    setCategory(filters.category ?? "");
    setStatus(filters.status ?? "");
  }, [filters.q, filters.category, filters.status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = q.trim();
      const current = filters.q ?? "";
      if (next === current) return;
      updateFilters({ q: next || undefined });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [q, filters.q, updateFilters]);

  const openCreate = () => {
    setEditExam(null);
    setFormOpen(true);
  };

  const openEdit = async (id: string) => {
    setEditLoading(true);
    const result = await getExamDetail(id);
    setEditLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setEditExam(result.exam);
    setFormOpen(true);
  };

  const handleToggle = async (item: ExamListItem, nextStatus: "ATIVO" | "INATIVO") => {
    setStatusLoading(true);
    const result = await toggleExamStatus({ examId: item.id, status: nextStatus });
    setStatusLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(nextStatus === "ATIVO" ? "Exame ativado." : "Exame desativado.");
    setDeactivateTarget(null);
    router.refresh();
  };

  const buildActions = (item: ExamListItem): SystemActionItem[] => {
    if (!canManage) return [];
    const items: SystemActionItem[] = [
      {
        label: "Editar",
        hint: "Alterar cadastro do exame",
        icon: Pencil,
        iconTone: "docs",
        onClick: () => void openEdit(item.id),
        disabled: editLoading,
      },
    ];
    if (item.status === "INATIVO") {
      items.push({
        label: "Ativar",
        hint: "Disponibilizar para novos usos",
        icon: Power,
        iconTone: "done",
        onClick: () => void handleToggle(item, "ATIVO"),
        disabled: statusLoading,
      });
    } else {
      items.push({
        label: "Desativar",
        hint: "Indisponível para novos usos",
        icon: Power,
        iconTone: "cancel",
        onClick: () => setDeactivateTarget(item),
        disabled: statusLoading,
      });
    }
    return items;
  };

  const resultLabel = hasFilters
    ? `${initialTotal} exame${initialTotal === 1 ? "" : "s"} encontrado${initialTotal === 1 ? "" : "s"}`
    : `${initialTotal} exame${initialTotal === 1 ? "" : "s"} cadastrado${initialTotal === 1 ? "" : "s"}`;

  return (
    <PageModule className="exames-catalogo">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Exames</h1>
          <p className="colaboradores-empresa-subtitle">
            Gerencie os exames disponíveis para atendimentos e contratos da Unimetra.
          </p>
        </div>
        {canManage && (
          <div className="colaboradores-empresa-header-actions">
            <Button
              type="button"
              variant="brand"
              size="sm"
              className="h-9 rounded-lg"
              onClick={openCreate}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Novo exame
            </Button>
          </div>
        )}
      </header>

      <div className="exames-catalogo-filters">
        <div className="exames-catalogo-search">
          <Search className="exames-catalogo-search-icon" aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar exame pelo nome"
            className="exames-catalogo-search-input"
            aria-label="Buscar exame pelo nome"
          />
        </div>
        <select
          className="exames-catalogo-select"
          value={category || ""}
          onChange={(e) => {
            const value = e.target.value;
            setCategory(value);
            updateFilters({ category: value || undefined });
          }}
          aria-label="Categoria"
        >
          <option value="">Todas as categorias</option>
          {Object.entries(EXAM_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="exames-catalogo-select"
          value={status || ""}
          onChange={(e) => {
            const value = e.target.value;
            setStatus(value);
            updateFilters({ status: value || undefined });
          }}
          aria-label="Status"
        >
          <option value="">Todos</option>
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Inativos</option>
        </select>
      </div>

      <div className="exames-catalogo-shell relative">
        {isPending && <LoadingState overlay label="Atualizando..." />}

        <div className="exames-catalogo-result-bar">
          <p>{resultLabel}</p>
        </div>

        {initialItems.length === 0 ? (
          <EmptyState
            compact
            className="border-0 bg-transparent shadow-none"
            title={hasFilters ? "Nenhum exame encontrado" : "Nenhum exame cadastrado"}
            description={
              hasFilters
                ? "Ajuste a busca ou os filtros utilizados."
                : "Cadastre os exames oferecidos pela Unimetra para utilizá-los nos atendimentos e contratos."
            }
            action={
              !hasFilters && canManage
                ? { label: "Novo exame", onClick: openCreate }
                : undefined
            }
          />
        ) : (
          <>
            <div className="exames-catalogo-table-scroll hidden lg:block">
              <table className="exames-catalogo-table">
                <thead>
                  <tr>
                    <th>Exame</th>
                    <th>Categoria</th>
                    <th>Status</th>
                    <th>Atualizado em</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {initialItems.map((item) => (
                    <tr key={item.id} className="exames-catalogo-row">
                      <td>
                        <span className="exames-catalogo-name" title={item.name}>
                          {item.name}
                        </span>
                      </td>
                      <td>
                        <span className="exames-catalogo-category">
                          {EXAM_CATEGORY_LABELS[item.category]}
                        </span>
                      </td>
                      <td>
                        <span
                          className={cn(
                            "exames-catalogo-status",
                            item.status === "ATIVO"
                              ? "exames-catalogo-status--active"
                              : "exames-catalogo-status--inactive"
                          )}
                        >
                          <span className="exames-catalogo-status-dot" aria-hidden />
                          {statusLabel(item.status)}
                        </span>
                      </td>
                      <td className="exames-catalogo-date">
                        {format(new Date(item.updatedAt), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="exames-catalogo-td-actions">
                        {canManage ? (
                          <SystemActionMenu items={buildActions(item)} />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="exames-catalogo-mobile lg:hidden">
              {initialItems.map((item) => (
                <div key={item.id} className="exames-catalogo-mobile-card">
                  <div className="min-w-0 flex-1 text-center">
                    <p className="exames-catalogo-name" title={item.name}>
                      {item.name}
                    </p>
                    <p className="exames-catalogo-mobile-meta">
                      {EXAM_CATEGORY_LABELS[item.category]}
                    </p>
                    <div className="mt-1.5 flex justify-center">
                      <span
                        className={cn(
                          "exames-catalogo-status",
                          item.status === "ATIVO"
                            ? "exames-catalogo-status--active"
                            : "exames-catalogo-status--inactive"
                        )}
                      >
                        <span className="exames-catalogo-status-dot" aria-hidden />
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <p className="exames-catalogo-mobile-meta mt-1">
                      Atualizado em{" "}
                      {format(new Date(item.updatedAt), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  {canManage && (
                    <div className="shrink-0">
                      <SystemActionMenu items={buildActions(item)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {initialTotal > 0 && (
          <div className="exames-catalogo-pagination">
            <div className="exames-catalogo-pagination-left">
              <label className="exames-catalogo-page-size">
                <span>Linhas por página</span>
                <select
                  value={String(pageSize)}
                  onChange={(e) =>
                    updateFilters({ pageSize: e.target.value, page: undefined })
                  }
                  aria-label="Linhas por página"
                >
                  {EXAM_PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <p className="exames-catalogo-range">
                {rangeFrom}–{rangeTo} de {initialTotal}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={initialPage <= 1 || isPending}
                onClick={() =>
                  updateFilters({ page: String(initialPage - 1) }, { resetPage: false })
                }
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={initialPage >= totalPages || isPending}
                onClick={() =>
                  updateFilters({ page: String(initialPage + 1) }, { resetPage: false })
                }
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ExamFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditExam(null);
        }}
        exam={editExam}
        onSuccess={(meta) => {
          if (meta?.category) {
            updateFilters({
              category: meta.category,
              q: undefined,
              page: undefined,
            });
          } else {
            router.refresh();
          }
        }}
      />

      <SystemModalShell
        open={!!deactivateTarget}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
        title="Desativar exame?"
        description="Este exame deixará de ficar disponível para novos atendimentos e contratos. Os registros anteriores não serão alterados."
        badges={[{ label: "Confirmação", variant: "status" }]}
        footer={
          <div className="collaborator-modal-actions">
            <Button
              variant="outline"
              className="collaborator-modal-btn"
              onClick={() => setDeactivateTarget(null)}
              disabled={statusLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              disabled={statusLoading || !deactivateTarget}
              onClick={() =>
                deactivateTarget && void handleToggle(deactivateTarget, "INATIVO")
              }
            >
              {statusLoading ? "Desativando..." : "Desativar exame"}
            </Button>
          </div>
        }
      >
        <p className="exam-modal-item-text text-center text-sm text-slate-600">
          {deactivateTarget?.name}
        </p>
      </SystemModalShell>
    </PageModule>
  );
}
