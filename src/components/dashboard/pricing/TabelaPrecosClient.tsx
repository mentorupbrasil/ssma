"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Pencil, Power, Upload, Tags } from "lucide-react";
import { PageModule } from "@/components/dashboard/PageModule";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  SystemActionMenu,
  type SystemActionItem,
} from "@/components/dashboard/SystemActionMenu";
import {
  SystemModalField,
  SystemModalShell,
} from "@/components/dashboard/SystemModalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  upsertCatalogPrice,
  toggleCatalogPriceStatus,
  batchUpdateCatalogPrices,
  importCatalogPricesFromRows,
  type PriceCatalogRow,
} from "@/actions/pricing";
import {
  PRICE_STATUS_LABELS,
  formatCurrency,
} from "@/lib/pricing";
import type { PriceListStatus } from "@prisma/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

function formatPrice(value: number | null) {
  if (value == null || value <= 0) return "Não definido";
  return formatCurrency(value);
}

export function TabelaPrecosClient({ defaults }: { defaults: PriceCatalogRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<PriceCatalogRow | null>(null);
  const [priceValue, setPriceValue] = useState("");
  const [editStatus, setEditStatus] = useState<PriceListStatus>("ATIVA");

  const [batchOpen, setBatchOpen] = useState(false);
  const [batchPrice, setBatchPrice] = useState("");

  const filteredDefaults = useMemo(() => {
    return defaults.filter((item) => {
      if (category && item.categoryLabel !== category) return false;
      if (status && item.status !== status) return false;
      if (!q.trim()) return true;
      const term = q.toLowerCase();
      return (
        item.name.toLowerCase().includes(term) ||
        item.code?.toLowerCase().includes(term) ||
        item.categoryLabel.toLowerCase().includes(term)
      );
    });
  }, [defaults, category, status, q]);

  const categoryOptions = useMemo(() => {
    const set = new Set(defaults.map((item) => item.categoryLabel).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [defaults]);

  const total = filteredDefaults.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredDefaults.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeFrom = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeTo = Math.min(safePage * pageSize, total);

  const hasFilters = Boolean(q || category || status);
  const allPageSelected =
    pageRows.length > 0 && pageRows.every((r) => selected.has(r.key));

  function clearFilters() {
    setQ("");
    setCategory("");
    setStatus("");
    setPage(1);
  }

  function toggleSelect(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelectPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageRows.forEach((r) => next.delete(r.key));
      } else {
        pageRows.forEach((r) => next.add(r.key));
      }
      return next;
    });
  }

  function openEdit(row: PriceCatalogRow) {
    setEditRow(row);
    setPriceValue(row.defaultPrice != null ? String(row.defaultPrice) : "");
    setEditStatus(row.status);
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    if (!editRow) return;
    const parsed = priceValue ? parseFloat(priceValue) : null;

    const result = await upsertCatalogPrice({
      priceId: editRow.priceId,
      examId: editRow.examId,
      name: editRow.name,
      category: editRow.category,
      defaultPrice: parsed,
      status: editStatus,
    });

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Preço padrão atualizado.");
    setEditOpen(false);
    setEditRow(null);
    startTransition(() => router.refresh());
  }

  async function handleToggle(row: PriceCatalogRow) {
    const result = await toggleCatalogPriceStatus({
      priceId: row.priceId,
      examId: row.examId,
      name: row.name,
      category: row.category,
      currentStatus: row.status,
      defaultPrice: row.defaultPrice,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(row.status === "ATIVA" ? "Item desativado." : "Item ativado.");
    startTransition(() => router.refresh());
  }

  async function handleBatchUpdate() {
    const price = parseFloat(batchPrice);
    if (!(price > 0)) {
      toast.error("Informe um preço válido.");
      return;
    }

    const items = filteredDefaults
      .filter((r) => selected.has(r.key))
      .map((r) => ({
        priceId: r.priceId,
        examId: r.examId,
        name: r.name,
        category: r.category,
        defaultPrice: price,
      }));

    const result = await batchUpdateCatalogPrices({ items });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`${result.updated} preço(s) atualizado(s).`);
    setBatchOpen(false);
    setBatchPrice("");
    setSelected(new Set());
    startTransition(() => router.refresh());
  }

  async function handleImportFile(file: File) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast.error("Planilha vazia.");
      return;
    }

    const rows: { name: string; price: number; category?: string }[] = [];
    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(/[;,\t]/).map((p) => p.trim().replace(/^"|"$/g, ""));
      if (i === 0 && /nome|item|exame|servi/i.test(parts[0] ?? "")) continue;
      const name = parts[0];
      const price = parseFloat((parts[1] ?? "").replace(/\./g, "").replace(",", "."));
      const categoryPart = parts[2];
      if (!name) continue;
      rows.push({
        name,
        price: Number.isFinite(price) ? price : 0,
        category: categoryPart || undefined,
      });
    }

    const result = await importCatalogPricesFromRows(rows);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`Importação: ${result.updated} atualizado(s), ${result.skipped} ignorado(s).`);
    startTransition(() => router.refresh());
  }

  function rowActions(row: PriceCatalogRow): SystemActionItem[] {
    return [
      {
        label: "Editar",
        hint: "Definir ou alterar preço padrão",
        icon: Pencil,
        iconTone: "docs",
        onClick: () => openEdit(row),
      },
      {
        label: row.status === "ATIVA" ? "Desativar" : "Ativar",
        hint: row.status === "ATIVA" ? "Tornar inativo" : "Reativar item",
        icon: Power,
        iconTone: row.status === "ATIVA" ? "cancel" : "done",
        onClick: () => void handleToggle(row),
        disabled: pending,
      },
    ];
  }

  return (
    <PageModule className="tabela-precos-clinica">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Tabela de preços</h1>
          <p className="colaboradores-empresa-subtitle">
            Cadastre e atualize os preços padrão dos exames e serviços da Unimetra.
          </p>
        </div>
        <div className="colaboradores-empresa-header-actions">
          <button
            type="button"
            className="tabela-precos-import-link"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            Importar planilha
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,.tsv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = "";
            }}
          />
          <Button
            variant="brand"
            size="sm"
            className="rounded-lg"
            onClick={() => {
              if (selected.size === 0) {
                toast.message("Selecione um ou mais itens na tabela.");
                return;
              }
              setBatchOpen(true);
            }}
          >
            Atualizar preços
          </Button>
        </div>
      </header>

      <div className="tabela-precos-filters">
        <div className="tabela-precos-search">
          <Search className="tabela-precos-search-icon" aria-hidden />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar item"
            className="tabela-precos-search-input"
          />
        </div>
        <select
          className="tabela-precos-select"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          aria-label="Categoria"
        >
          <option value="">Categoria</option>
          {categoryOptions.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="tabela-precos-select"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Status"
        >
          <option value="">Status</option>
          {Object.entries(PRICE_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {hasFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            Limpar
          </Button>
        )}
        {selected.size > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setBatchOpen(true)}
          >
            Atualizar {selected.size} selecionado(s)
          </Button>
        )}
      </div>

      <div className="colaboradores-empresa-table-wrap relative">
        <div className="colaboradores-empresa-result-bar">
          <span className="text-xs text-slate-500">
            {total === 1 ? "1 item" : `${total} itens`}
          </span>
        </div>

        {pageRows.length === 0 ? (
          <EmptyState
            icon={Tags}
            compact
            title={hasFilters ? "Nenhum item encontrado" : "Nenhum item na tabela"}
            description={
              hasFilters
                ? "Ajuste a busca ou os filtros."
                : "Cadastre exames no módulo Exames para listá-los aqui automaticamente."
            }
          />
        ) : (
          <>
            <div className="hidden lg:block overflow-x-hidden">
              <table className="colaboradores-empresa-table tabela-precos-clinica-table">
                <thead>
                  <tr>
                    <th className="tabela-precos-check-col">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectPage}
                        aria-label="Selecionar página"
                      />
                    </th>
                    <th>Item</th>
                    <th>Categoria</th>
                    <th>Preço padrão</th>
                    <th>Status</th>
                    <th>Atualizado em</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((item) => (
                    <tr key={item.key} className="tabela-precos-clinica-row">
                      <td className="tabela-precos-check-col">
                        <input
                          type="checkbox"
                          checked={selected.has(item.key)}
                          onChange={() => toggleSelect(item.key)}
                          aria-label={`Selecionar ${item.name}`}
                        />
                      </td>
                      <td>
                        <span className="tabela-precos-clinica-primary">{item.name}</span>
                      </td>
                      <td>{item.categoryLabel}</td>
                      <td
                        className={cn(
                          "tabela-precos-clinica-value",
                          item.defaultPrice == null && "tabela-precos-undefined"
                        )}
                      >
                        {formatPrice(item.defaultPrice)}
                      </td>
                      <td>
                        <StatusBadge
                          status={item.status}
                          label={PRICE_STATUS_LABELS[item.status] ?? item.status}
                        />
                      </td>
                      <td className="whitespace-nowrap text-sm text-slate-600">
                        {format(new Date(item.updatedAt), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="colaboradores-empresa-td-actions">
                        <SystemActionMenu items={rowActions(item)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden space-y-2 p-3">
              {pageRows.map((item) => (
                <div key={item.key} className="tabela-precos-clinica-mobile-card">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selected.has(item.key)}
                      onChange={() => toggleSelect(item.key)}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="tabela-precos-clinica-primary">{item.name}</span>
                      <p className="text-xs text-slate-500">{item.categoryLabel}</p>
                      <p
                        className={cn(
                          "mt-1 text-sm font-semibold",
                          item.defaultPrice == null && "tabela-precos-undefined"
                        )}
                      >
                        {formatPrice(item.defaultPrice)}
                      </p>
                    </div>
                    <SystemActionMenu items={rowActions(item)} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {total > 0 && (
          <div className="tabela-precos-pagination">
            <label className="tabela-precos-page-size">
              <span>Linhas</span>
              <select
                value={String(pageSize)}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value, 10));
                  setPage(1);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-slate-500">
              {rangeFrom}–{rangeTo} de {total}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      <SystemModalShell
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Editar preço padrão"
        description={editRow?.name}
        badges={[
          { label: "Tabela de preços", variant: "category" },
          { label: "Padrão Unimetra", variant: "status" },
        ]}
        footer={
          <div className="collaborator-modal-actions">
            <Button variant="outline" className="collaborator-modal-btn" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button variant="brand" className="collaborator-modal-btn" onClick={() => void handleSaveEdit()}>
              Salvar
            </Button>
          </div>
        }
      >
        <SystemModalField label="Preço padrão (R$)" required wide>
          <input
            type="number"
            step="0.01"
            min="0"
            value={priceValue}
            onChange={(e) => setPriceValue(e.target.value)}
            placeholder="Deixe vazio para Não definido"
          />
        </SystemModalField>
        <SystemModalField label="Status">
          <select
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value as PriceListStatus)}
          >
            {Object.entries(PRICE_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </SystemModalField>
      </SystemModalShell>

      <SystemModalShell
        open={batchOpen}
        onOpenChange={setBatchOpen}
        title="Atualizar preços em lote"
        description={`${selected.size} item(ns) selecionado(s). O mesmo valor será aplicado a todos.`}
        badges={[{ label: "Lote", variant: "status" }]}
        footer={
          <div className="collaborator-modal-actions">
            <Button variant="outline" className="collaborator-modal-btn" onClick={() => setBatchOpen(false)}>
              Cancelar
            </Button>
            <Button variant="brand" className="collaborator-modal-btn" onClick={() => void handleBatchUpdate()}>
              Aplicar
            </Button>
          </div>
        }
      >
        <SystemModalField label="Novo preço padrão (R$)" required wide>
          <input
            type="number"
            step="0.01"
            min="0"
            value={batchPrice}
            onChange={(e) => setBatchPrice(e.target.value)}
          />
        </SystemModalField>
      </SystemModalShell>
    </PageModule>
  );
}
