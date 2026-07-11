"use client";

import { useCallback, useEffect, useMemo, useState, useTransition, Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, Pencil, Power, ChevronLeft, ChevronRight } from "lucide-react";
import type { ExamCategory, ExamStatus } from "@prisma/client";
import type { ExamDetailSerialized, ExamListItem } from "@/lib/exams";
import { EXAM_CATEGORY_LABELS, EXAM_STATUS_LABELS } from "@/lib/exams";
import { getExamDetail, toggleExamStatus } from "@/actions/exams";
import { PageModule } from "@/components/dashboard/PageModule";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SystemActionMenu, type SystemActionItem } from "@/components/dashboard/SystemActionMenu";
import {
  SystemModalShell,
} from "@/components/dashboard/SystemModalShell";
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
  };
};

const CATEGORY_ORDER = Object.keys(EXAM_CATEGORY_LABELS) as ExamCategory[];

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
  const hasActiveFilters = Boolean(filters.q || filters.category || filters.status);
  const emptyCatalog = initialItems.length === 0 && !hasActiveFilters;
  const emptyFiltered = initialItems.length === 0 && hasActiveFilters;

  const grouped = useMemo(() => {
    const map = new Map<ExamCategory, ExamListItem[]>();
    for (const item of initialItems) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    }
    return CATEGORY_ORDER.filter((key) => map.has(key)).map((key) => ({
      category: key,
      label: EXAM_CATEGORY_LABELS[key],
      items: map.get(key)!,
    }));
  }, [initialItems]);

  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) params.delete(key);
        else params.set(key, value);
      });
      if (!("page" in updates)) params.delete("page");
      params.set("sort", "category");
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
  }, [filters]);

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

  const resultLabel = hasActiveFilters
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

      <div className="exames-catalogo-table-shell relative">
        {isPending && <LoadingState overlay label="Atualizando..." />}

        <div className="exames-catalogo-result-bar">
          <p>{resultLabel}</p>
        </div>

        {emptyCatalog ? (
          <EmptyState
            compact
            className="border-0 bg-transparent shadow-none"
            title="Nenhum exame cadastrado"
            description="Cadastre os exames oferecidos pela Unimetra para utilizá-los nos atendimentos e contratos."
            action={
              canManage
                ? { label: "Novo exame", onClick: openCreate }
                : undefined
            }
          />
        ) : emptyFiltered ? (
          <EmptyState
            compact
            className="border-0 bg-transparent shadow-none"
            title="Nenhum exame encontrado"
            description="Ajuste a busca ou os filtros utilizados."
          />
        ) : (
          <>
            <div className="exames-catalogo-table-scroll hidden md:block">
              <table className="exames-catalogo-table">
                <colgroup>
                  <col className="exames-catalogo-col-name" />
                  <col className="exames-catalogo-col-status" />
                  <col className="exames-catalogo-col-date" />
                  <col className="exames-catalogo-col-actions" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Exame</th>
                    <th>Status</th>
                    <th className="hidden lg:table-cell">Atualizado em</th>
                    <th className="exames-catalogo-th-actions">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.map((group) => (
                    <Fragment key={group.category}>
                      <tr className="exames-catalogo-group-row">
                        <td colSpan={4}>
                          <span className="exames-catalogo-group-label">
                            {group.label.toUpperCase()}
                          </span>
                          <span className="exames-catalogo-group-count">
                            {" "}
                            · {group.items.length} exame
                            {group.items.length === 1 ? "" : "s"}
                          </span>
                        </td>
                      </tr>
                      {group.items.map((item) => (
                        <tr key={item.id} className="exames-catalogo-row">
                          <td>
                            <span className="exames-catalogo-name" title={item.name}>
                              {item.name}
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
                          <td className="exames-catalogo-date hidden lg:table-cell">
                            {format(new Date(item.updatedAt), "dd/MM/yyyy", { locale: ptBR })}
                          </td>
                          <td className="exames-catalogo-td-actions">
                            {canManage && <SystemActionMenu items={buildActions(item)} />}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="exames-catalogo-mobile md:hidden">
              {grouped.map((group) => (
                <div key={group.category} className="exames-catalogo-mobile-group">
                  <p className="exames-catalogo-mobile-group-title">
                    {group.label.toUpperCase()} · {group.items.length} exame
                    {group.items.length === 1 ? "" : "s"}
                  </p>
                  {group.items.map((item) => (
                    <div key={item.id} className="exames-catalogo-mobile-card">
                      <div className="min-w-0 flex-1">
                        <p className="exames-catalogo-name" title={item.name}>
                          {item.name}
                        </p>
                        <p className="exames-catalogo-mobile-meta">{group.label}</p>
                        <span
                          className={cn(
                            "exames-catalogo-status mt-1.5",
                            item.status === "ATIVO"
                              ? "exames-catalogo-status--active"
                              : "exames-catalogo-status--inactive"
                          )}
                        >
                          <span className="exames-catalogo-status-dot" aria-hidden />
                          {statusLabel(item.status)}
                        </span>
                      </div>
                      {canManage && <SystemActionMenu items={buildActions(item)} />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}

        {initialTotal > pageSize && (
          <div className="exames-catalogo-pagination">
            <p className="text-sm text-slate-500">
              Página {initialPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={initialPage <= 1 || isPending}
                onClick={() => updateFilters({ page: String(initialPage - 1) })}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
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

      <ExamFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditExam(null);
        }}
        exam={editExam}
        onSuccess={() => router.refresh()}
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
        <p className="exam-modal-item-text text-sm text-slate-600">
          {deactivateTarget?.name}
        </p>
      </SystemModalShell>
    </PageModule>
  );
}
