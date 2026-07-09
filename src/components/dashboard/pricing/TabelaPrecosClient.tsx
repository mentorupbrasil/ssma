"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Tags } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PlatformPositioningBanner } from "@/components/dashboard/PlatformPositioningBanner";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<"all" | "default" | string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PriceItem | null>(null);
  const [form, setForm] = useState<PriceListItemInput>(EMPTY_FORM);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (scope === "default" && item.companyId) return false;
      if (scope !== "all" && scope !== "default" && item.companyId !== scope) return false;
      if (!q.trim()) return true;
      const term = q.toLowerCase();
      return (
        item.name.toLowerCase().includes(term) ||
        item.code?.toLowerCase().includes(term) ||
        item.company?.legalName.toLowerCase().includes(term)
      );
    });
  }, [items, q, scope]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      companyId: scope !== "all" && scope !== "default" ? scope : null,
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
    });
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tabela de preços"
        description="Preços padrão e negociados por empresa — base para orçamentos, fechamento e financeiro"
        actions={
          <Button variant="brand" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo preço
          </Button>
        }
      />

      <PlatformPositioningBanner compact />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Itens cadastrados" value={stats.total} icon={Tags} />
        <StatCard title="Ativos" value={stats.active} icon={Tags} />
        <StatCard title="Por empresa" value={stats.companySpecific} icon={Tags} />
        <StatCard title="Sem preço padrão" value={stats.withoutDefault} icon={Tags} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-end">
        <div className="flex-1">
          <Label htmlFor="price-search">Buscar</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="price-search"
              className="pl-9"
              placeholder="Serviço, código ou empresa..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full lg:w-64">
          <Label>Escopo</Label>
          <Select value={scope} onValueChange={(v) => v && setScope(v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="default">Preços padrão</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Nenhum preço encontrado"
          description="Cadastre preços padrão por exame/serviço e tabelas específicas por empresa para alimentar orçamentos e fechamentos."
          action={{ label: "Cadastrar preço", onClick: openCreate }}
          secondaryAction={{ label: "Ver orçamentos", href: "/dashboard/orcamentos", variant: "outline" }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Escopo</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Cobrança</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    {item.exam && <p className="text-xs text-slate-500">Exame: {item.exam.name}</p>}
                    {item.code && <p className="text-xs text-slate-400">Cód. {item.code}</p>}
                  </TableCell>
                  <TableCell>{PRICE_CATEGORY_LABELS[item.category as keyof typeof PRICE_CATEGORY_LABELS]}</TableCell>
                  <TableCell>
                    {item.company
                      ? item.company.tradeName ?? item.company.legalName
                      : "Padrão da clínica"}
                  </TableCell>
                  <TableCell className="font-semibold text-[var(--brand-navy)]">
                    {formatCurrency(effectivePrice(item))}
                  </TableCell>
                  <TableCell>{PRICE_CHARGE_LABELS[item.chargeType as keyof typeof PRICE_CHARGE_LABELS]}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar preço" : "Novo preço"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="price-name">Serviço / exame</Label>
              <Input
                id="price-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Categoria</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => v && setForm({ ...form, category: v as PriceListItemInput["category"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRICE_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de cobrança</Label>
                <Select
                  value={form.chargeType}
                  onValueChange={(v) => v && setForm({ ...form, chargeType: v as PriceListItemInput["chargeType"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRICE_CHARGE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="price-default">Preço padrão (R$)</Label>
                <Input
                  id="price-default"
                  type="number"
                  step="0.01"
                  value={form.defaultPrice || ""}
                  onChange={(e) => setForm({ ...form, defaultPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Empresa específica</Label>
                <Select
                  value={form.companyId ?? "none"}
                  onValueChange={(v) =>
                    setForm({ ...form, companyId: v === "none" ? null : v, negotiatedPrice: null })
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Padrão" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Preço padrão</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.companyId && (
              <div>
                <Label htmlFor="price-negotiated">Preço negociado (R$)</Label>
                <Input
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
              </div>
            )}
            <div>
              <Label htmlFor="price-notes">Observações comerciais</Label>
              <Textarea
                id="price-notes"
                rows={3}
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <Button className="w-full" variant="brand" onClick={handleSave} disabled={pending || !form.name.trim()}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
