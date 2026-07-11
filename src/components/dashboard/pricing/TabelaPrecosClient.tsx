"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Search,
  Tags,
  CheckCircle2,
  Building2,
  CircleSlash,
  SlidersHorizontal,
  Eye,
  Pencil,
  Copy,
  Power,
  Trash2,
  type LucideIcon,
} from "lucide-react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPriceItem,
  deletePriceItem,
  updatePriceItem,
  type PriceListItemInput,
} from "@/actions/pricing";
import {
  PRICE_CATEGORY_LABELS,
  PRICE_CHARGE_LABELS,
  PRICE_STATUS_LABELS,
  formatCurrency,
  effectivePrice,
} from "@/lib/pricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PriceItem = {
  id: string;
  name: string;
  code: string | null;
  category: string;
  defaultPrice: number;
  negotiatedPrice: number | null;
  companyId: string | null;
  chargeType: string;
  status: string;
  notes: string | null;
  validFrom: string | Date | null;
  validUntil: string | Date | null;
  company: { id: string; tradeName: string | null; legalName: string } | null;
  exam: { id: string; name: string } | null;
};

type CompanyOption = { id: string; label: string };

type Stats = {
  total: number;
  active: number;
  companySpecific: number;
  withoutDefault: number;
};

type PriceTab = "padrao" | "empresa";
type StatFilter = "active" | "company" | "without_price" | null;

const EMPTY_FORM: PriceListItemInput = {
  name: "",
  code: "",
  category: "EXAME",
  defaultPrice: 0,
  companyId: null,
  negotiatedPrice: null,
  chargeType: "AVULSA",
  status: "ATIVA",
  notes: "",
};

const STAT_CARDS: {
  key: StatFilter;
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: "primary" | "warning";
  getValue: (stats: Stats) => number;
}[] = [
  {
    key: "active",
    label: "Itens ativos",
    hint: "Com status ativo",
    icon: CheckCircle2,
    tone: "primary",
    getValue: (s) => s.active,
  },
  {
    key: "company",
    label: "Preços por empresa",
    hint: "Negociados",
    icon: Building2,
    tone: "primary",
    getValue: (s) => s.companySpecific,
  },
  {
    key: "without_price",
    label: "Sem preço definido",
    hint: "Padrão zerado",
    icon: CircleSlash,
    tone: "warning",
    getValue: (s) => s.withoutDefault,
  },
];

function formatValidity(item: PriceItem) {
  const from = item.validFrom ? new Date(item.validFrom) : null;
  const until = item.validUntil ? new Date(item.validUntil) : null;
  if (!from && !until) return "—";
  if (from && until) {
    return `${format(from, "dd/MM/yyyy", { locale: ptBR })} – ${format(until, "dd/MM/yyyy", { locale: ptBR })}`;
  }
  if (until) return `Até ${format(until, "dd/MM/yyyy", { locale: ptBR })}`;
  return `Desde ${format(from!, "dd/MM/yyyy", { locale: ptBR })}`;
}

function toDateInput(value: string | Date | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "yyyy-MM-dd");
}

export function TabelaPrecosClient({
  items,
  stats,
  companies,
}: {
  items: PriceItem[];
  stats: Stats;
  companies: CompanyOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [tab, setTab] = useState<PriceTab>("padrao");
  const [statFilter, setStatFilter] = useState<StatFilter>(null);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [scope, setScope] = useState("");
  const [status, setStatus] = useState("");
  const [chargeType, setChargeType] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PriceItem | null>(null);
  const [form, setForm] = useState<PriceListItemInput>(EMPTY_FORM);
  const [detailItem, setDetailItem] = useState<PriceItem | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (tab === "padrao" && item.companyId) return false;
      if (tab === "empresa" && !item.companyId) return false;

      if (statFilter === "active" && item.status !== "ATIVA") return false;
      if (statFilter === "company" && !item.companyId) return false;
      if (statFilter === "without_price") {
        if (item.companyId || item.defaultPrice !== 0) return false;
      }

      if (category && item.category !== category) return false;
      if (status && item.status !== status) return false;
      if (chargeType && item.chargeType !== chargeType) return false;
      if (companyFilter && item.companyId !== companyFilter) return false;

      if (scope === "padrao" && item.companyId) return false;
      if (scope === "empresa" && !item.companyId) return false;

      if (!q.trim()) return true;
      const term = q.toLowerCase();
      const companyName = item.company
        ? `${item.company.tradeName ?? ""} ${item.company.legalName}`.toLowerCase()
        : "";
      return (
        item.name.toLowerCase().includes(term) ||
        item.code?.toLowerCase().includes(term) ||
        item.exam?.name.toLowerCase().includes(term) ||
        companyName.includes(term) ||
        (PRICE_CATEGORY_LABELS[item.category as keyof typeof PRICE_CATEGORY_LABELS] ?? "")
          .toLowerCase()
          .includes(term)
      );
    });
  }, [items, tab, statFilter, category, status, chargeType, companyFilter, scope, q]);

  const hasActiveFilters = Boolean(
    q || category || scope || status || chargeType || companyFilter || statFilter
  );

  const advancedFilterCount = [chargeType, companyFilter].filter(Boolean).length;

  function clearFilters() {
    setQ("");
    setCategory("");
    setScope("");
    setStatus("");
    setChargeType("");
    setCompanyFilter("");
    setStatFilter(null);
    setMoreFiltersOpen(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      companyId: tab === "empresa" ? companyFilter || null : null,
    });
    setOpen(true);
  }

  function openEdit(item: PriceItem) {
    setEditing(item);
    setForm({
      name: item.name,
      code: item.code ?? "",
      category: item.category as PriceListItemInput["category"],
      defaultPrice: item.defaultPrice,
      companyId: item.companyId,
      negotiatedPrice: item.negotiatedPrice,
      chargeType: item.chargeType as PriceListItemInput["chargeType"],
      status: item.status as PriceListItemInput["status"],
      notes: item.notes ?? "",
      examId: item.exam?.id ?? null,
      validFrom: toDateInput(item.validFrom) || null,
      validUntil: toDateInput(item.validUntil) || null,
    });
    setOpen(true);
  }

  function openDuplicateForCompany(item: PriceItem) {
    setEditing(null);
    setForm({
      name: item.name,
      code: item.code ?? "",
      category: item.category as PriceListItemInput["category"],
      defaultPrice: item.defaultPrice,
      companyId: companies[0]?.id ?? null,
      negotiatedPrice: item.negotiatedPrice ?? item.defaultPrice,
      chargeType: item.chargeType as PriceListItemInput["chargeType"],
      status: "ATIVA",
      notes: item.notes ?? "",
      examId: item.exam?.id ?? null,
      validFrom: toDateInput(item.validFrom) || null,
      validUntil: toDateInput(item.validUntil) || null,
    });
    setTab("empresa");
    setOpen(true);
  }

  async function handleSave() {
    const result = editing
      ? await updatePriceItem(editing.id, form)
      : await createPriceItem(form);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(editing ? "Preço atualizado" : "Preço cadastrado");
    setOpen(false);
    startTransition(() => router.refresh());
  }

  async function handleToggleStatus(item: PriceItem) {
    const nextStatus = item.status === "ATIVA" ? "INATIVA" : "ATIVA";
    const result = await updatePriceItem(item.id, {
      name: item.name,
      code: item.code ?? "",
      category: item.category as PriceListItemInput["category"],
      defaultPrice: item.defaultPrice,
      companyId: item.companyId,
      negotiatedPrice: item.negotiatedPrice,
      chargeType: item.chargeType as PriceListItemInput["chargeType"],
      status: nextStatus,
      notes: item.notes ?? "",
      examId: item.exam?.id ?? null,
      validFrom: toDateInput(item.validFrom) || null,
      validUntil: toDateInput(item.validUntil) || null,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(nextStatus === "ATIVA" ? "Preço ativado" : "Preço inativado");
    startTransition(() => router.refresh());
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este item da tabela de preços?")) return;
    const result = await deletePriceItem(id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Item removido");
    startTransition(() => router.refresh());
  }

  const resultLabel =
    filtered.length === 1
      ? "1 preço encontrado"
      : `${filtered.length} preços encontrados`;

  return (
    <PageModule className="tabela-precos-clinica">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Tabela de preços</h1>
          <p className="colaboradores-empresa-subtitle">
            Gerencie valores padrão e preços negociados por empresa.
          </p>
        </div>
        <div className="colaboradores-empresa-header-actions">
          <Button variant="brand" size="sm" className="rounded-lg" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar preço
          </Button>
        </div>
      </header>

      <nav className="comercial-clinica-tabs" aria-label="Escopos da tabela de preços">
        <button
          type="button"
          className={cn(
            "comercial-clinica-tab",
            tab === "padrao" && "comercial-clinica-tab--active"
          )}
          onClick={() => {
            setTab("padrao");
            if (statFilter === "company") setStatFilter(null);
            setCompanyFilter("");
          }}
        >
          Preços padrão
        </button>
        <button
          type="button"
          className={cn(
            "comercial-clinica-tab",
            tab === "empresa" && "comercial-clinica-tab--active"
          )}
          onClick={() => {
            setTab("empresa");
            if (statFilter === "without_price") setStatFilter(null);
          }}
        >
          Preços por empresa
        </button>
      </nav>

      <div className="colaboradores-empresa-stats tabela-precos-clinica-stats">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          const isActive = statFilter === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => {
                const next = isActive ? null : card.key;
                setStatFilter(next);
                if (next === "company") setTab("empresa");
                if (next === "without_price") setTab("padrao");
              }}
              className={cn(
                "colaboradores-empresa-stat colaboradores-empresa-stat--clickable",
                isActive && "colaboradores-empresa-stat--active"
              )}
            >
              <span
                className={cn(
                  "colaboradores-empresa-stat-icon",
                  `colaboradores-empresa-stat-icon--${card.tone}`
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="colaboradores-empresa-stat-body">
                <span className="colaboradores-empresa-stat-value">
                  {card.getValue(stats)}
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
              placeholder="Buscar por serviço, exame, código ou empresa"
              aria-label="Buscar preços"
              className="colaboradores-empresa-search-input"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Categoria"
            className="colaboradores-empresa-select"
          >
            <option value="">Categoria</option>
            {Object.entries(PRICE_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            aria-label="Escopo"
            className="colaboradores-empresa-select"
          >
            <option value="">Escopo</option>
            <option value="padrao">Padrão</option>
            <option value="empresa">Por empresa</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Status"
            className="colaboradores-empresa-select"
          >
            <option value="">Status</option>
            {Object.entries(PRICE_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
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
              value={chargeType}
              onChange={(e) => setChargeType(e.target.value)}
              aria-label="Tipo de cobrança"
              className="colaboradores-empresa-select"
            >
              <option value="">Tipo de cobrança</option>
              {Object.entries(PRICE_CHARGE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              aria-label="Empresa"
              className="colaboradores-empresa-select"
            >
              <option value="">Empresa</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="colaboradores-empresa-table-wrap relative">
        <div className="colaboradores-empresa-result-bar">
          <span className="text-xs text-slate-500">{resultLabel}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Tags}
            compact
            title={
              hasActiveFilters ? "Nenhum preço encontrado" : "Nenhum preço cadastrado"
            }
            description={
              hasActiveFilters
                ? "Ajuste os filtros para localizar preços."
                : "Cadastre os valores padrão dos exames e serviços para utilizar em orçamentos e fechamentos."
            }
            action={
              !hasActiveFilters
                ? { label: "Adicionar primeiro preço", onClick: openCreate }
                : undefined
            }
          />
        ) : (
          <>
            <div className="colaboradores-empresa-table-scroll">
              <table className="colaboradores-empresa-table tabela-precos-clinica-table">
                <thead>
                  <tr>
                    <th>Serviço ou exame</th>
                    <th>Código</th>
                    <th>Categoria</th>
                    <th>Escopo</th>
                    <th>Empresa</th>
                    <th>Valor</th>
                    <th>Vigência</th>
                    <th>Status</th>
                    <th className="colaboradores-empresa-th-actions">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="tabela-precos-clinica-row">
                      <td>
                        <div className="tabela-precos-clinica-service">
                          <span className="tabela-precos-clinica-primary">{item.name}</span>
                          {item.exam && (
                            <span className="tabela-precos-clinica-meta">
                              Exame: {item.exam.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-slate-500">
                        {item.code ?? "—"}
                      </td>
                      <td className="whitespace-nowrap">
                        {PRICE_CATEGORY_LABELS[
                          item.category as keyof typeof PRICE_CATEGORY_LABELS
                        ] ?? item.category}
                      </td>
                      <td className="whitespace-nowrap">
                        {item.companyId ? "Empresa" : "Padrão"}
                      </td>
                      <td>
                        {item.company
                          ? item.company.tradeName ?? item.company.legalName
                          : "—"}
                      </td>
                      <td className="tabela-precos-clinica-value whitespace-nowrap">
                        {formatCurrency(effectivePrice(item))}
                      </td>
                      <td className="whitespace-nowrap text-sm text-slate-600">
                        {formatValidity(item)}
                      </td>
                      <td>
                        <StatusBadge
                          status={item.status}
                          label={
                            PRICE_STATUS_LABELS[
                              item.status as keyof typeof PRICE_STATUS_LABELS
                            ] ?? item.status
                          }
                        />
                      </td>
                      <td className="colaboradores-empresa-td-actions">
                        <SystemActionMenu
                          items={
                            [
                              {
                                label: "Ver detalhes",
                                hint: "Abrir preço",
                                icon: Eye,
                                iconTone: "view",
                                onClick: () => setDetailItem(item),
                              },
                              {
                                label: "Editar preço",
                                hint: "Alterar valores",
                                icon: Pencil,
                                iconTone: "docs",
                                onClick: () => openEdit(item),
                              },
                              {
                                label: "Duplicar para empresa",
                                hint: "Criar preço negociado",
                                icon: Copy,
                                iconTone: "quote",
                                onClick: () => openDuplicateForCompany(item),
                              },
                              {
                                label: item.status === "ATIVA" ? "Inativar" : "Ativar",
                                hint:
                                  item.status === "ATIVA"
                                    ? "Desativar preço"
                                    : "Reativar preço",
                                icon: Power,
                                iconTone: "progress",
                                onClick: () => handleToggleStatus(item),
                                disabled: pending,
                              },
                              {
                                label: "Excluir",
                                hint: "Remover da tabela",
                                icon: Trash2,
                                iconTone: "cancel",
                                onClick: () => handleDelete(item.id),
                              },
                            ] satisfies SystemActionItem[]
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="colaboradores-empresa-mobile-list">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="tabela-precos-clinica-mobile-card"
                  onClick={() => setDetailItem(item)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="tabela-precos-clinica-primary">{item.name}</span>
                    <StatusBadge
                      status={item.status}
                      label={
                        PRICE_STATUS_LABELS[
                          item.status as keyof typeof PRICE_STATUS_LABELS
                        ] ?? item.status
                      }
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {item.companyId ? "Empresa" : "Padrão"} ·{" "}
                    {formatCurrency(effectivePrice(item))}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <Sheet open={!!detailItem} onOpenChange={(o) => !o && setDetailItem(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalhe do preço</SheetTitle>
            <SheetDescription>{detailItem?.name}</SheetDescription>
          </SheetHeader>
          {detailItem && (
            <div className="mt-6 space-y-3 text-sm">
              <DetailRow label="Código" value={detailItem.code ?? "—"} />
              <DetailRow
                label="Categoria"
                value={
                  PRICE_CATEGORY_LABELS[
                    detailItem.category as keyof typeof PRICE_CATEGORY_LABELS
                  ] ?? detailItem.category
                }
              />
              <DetailRow
                label="Escopo"
                value={detailItem.companyId ? "Empresa" : "Padrão"}
              />
              <DetailRow
                label="Empresa"
                value={
                  detailItem.company
                    ? detailItem.company.tradeName ?? detailItem.company.legalName
                    : "—"
                }
              />
              <DetailRow
                label="Valor"
                value={formatCurrency(effectivePrice(detailItem))}
              />
              <DetailRow
                label="Cobrança"
                value={
                  PRICE_CHARGE_LABELS[
                    detailItem.chargeType as keyof typeof PRICE_CHARGE_LABELS
                  ] ?? detailItem.chargeType
                }
              />
              <DetailRow label="Vigência" value={formatValidity(detailItem)} />
              <DetailRow
                label="Status"
                value={
                  PRICE_STATUS_LABELS[
                    detailItem.status as keyof typeof PRICE_STATUS_LABELS
                  ] ?? detailItem.status
                }
              />
              <DetailRow label="Observações" value={detailItem.notes ?? "—"} />
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button size="sm" variant="outline" onClick={() => openEdit(detailItem)}>
                  Editar preço
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openDuplicateForCompany(detailItem)}
                >
                  Duplicar para empresa
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <SystemModalShell
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar preço" : "Adicionar preço"}
        description="Defina valores padrão ou negociados por empresa."
        badges={[
          { label: "Tabela de preços", variant: "category" },
          { label: editing ? "Edição" : "Novo item", variant: "status" },
        ]}
        className="max-w-lg"
        footer={
          <div className="collaborator-modal-actions">
            <Button
              variant="outline"
              className="collaborator-modal-btn"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={handleSave}
              disabled={pending || !form.name.trim()}
            >
              Salvar
            </Button>
          </div>
        }
      >
        <SystemModalField label="Serviço / exame" required wide>
          <input
            id="price-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </SystemModalField>

        <SystemModalField label="Código">
          <input
            id="price-code"
            value={form.code ?? ""}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
        </SystemModalField>

        <SystemModalField label="Categoria">
          <Select
            value={form.category}
            onValueChange={(v) =>
              v && setForm({ ...form, category: v as PriceListItemInput["category"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRICE_CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SystemModalField>

        <SystemModalField label="Tipo de cobrança">
          <Select
            value={form.chargeType}
            onValueChange={(v) =>
              v &&
              setForm({ ...form, chargeType: v as PriceListItemInput["chargeType"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRICE_CHARGE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SystemModalField>

        <SystemModalField label="Status">
          <Select
            value={form.status}
            onValueChange={(v) =>
              v && setForm({ ...form, status: v as PriceListItemInput["status"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRICE_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SystemModalField>

        <SystemModalField label="Preço padrão (R$)">
          <input
            id="price-default"
            type="number"
            step="0.01"
            value={form.defaultPrice || ""}
            onChange={(e) =>
              setForm({ ...form, defaultPrice: parseFloat(e.target.value) || 0 })
            }
          />
        </SystemModalField>

        <SystemModalField label="Empresa específica">
          <Select
            value={form.companyId ?? "none"}
            onValueChange={(v) =>
              setForm({
                ...form,
                companyId: v === "none" ? null : v,
                negotiatedPrice: v === "none" ? null : form.negotiatedPrice,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Padrão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Preço padrão</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SystemModalField>

        {form.companyId && (
          <SystemModalField label="Preço negociado (R$)" wide>
            <input
              id="price-negotiated"
              type="number"
              step="0.01"
              value={form.negotiatedPrice ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  negotiatedPrice: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
            />
          </SystemModalField>
        )}

        <SystemModalField label="Vigência — início">
          <input
            id="price-valid-from"
            type="date"
            value={form.validFrom ?? ""}
            onChange={(e) => setForm({ ...form, validFrom: e.target.value || null })}
          />
        </SystemModalField>

        <SystemModalField label="Vigência — fim">
          <input
            id="price-valid-until"
            type="date"
            value={form.validUntil ?? ""}
            onChange={(e) => setForm({ ...form, validUntil: e.target.value || null })}
          />
        </SystemModalField>

        <SystemModalField label="Observações comerciais" wide>
          <textarea
            id="price-notes"
            rows={3}
            value={form.notes ?? ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </SystemModalField>
      </SystemModalShell>
    </PageModule>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[60%] text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}
