"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";
import {
  listCompanyPackageCatalog,
  saveCompanyExamPackage,
  type CompanyPackageCatalogItem,
} from "@/actions/pricing";
import {
  SystemModalField,
  SystemModalShell,
} from "@/components/dashboard/SystemModalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/pricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type DraftRow = {
  examId: string;
  name: string;
  category: CompanyPackageCatalogItem["category"];
  examCategoryLabel: string;
  defaultPrice: number | null;
  negotiatedPrice: string;
  useDefault: boolean;
};

function formatPrice(value: number | null) {
  if (value == null || value <= 0) return "Não definido";
  return formatCurrency(value);
}

function toDateInput(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function CompanyExamPackageDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  initialValidFrom,
  initialValidUntil,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  initialValidFrom?: string | null;
  initialValidUntil?: string | null;
  onSuccess: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState<CompanyPackageCatalogItem[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<Map<string, DraftRow>>(new Map());
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setQ("");
    setCategory("");
    setValidFrom(toDateInput(initialValidFrom));
    setValidUntil(toDateInput(initialValidUntil));

    void listCompanyPackageCatalog(companyId)
      .then((items) => {
        if (cancelled) return;
        setCatalog(items);
        const next = new Map<string, DraftRow>();
        for (const item of items) {
          if (!item.inPackage) continue;
          next.set(item.examId, {
            examId: item.examId,
            name: item.name,
            category: item.category,
            examCategoryLabel: item.examCategoryLabel,
            defaultPrice: item.defaultPrice,
            negotiatedPrice:
              item.negotiatedPrice != null
                ? String(item.negotiatedPrice)
                : item.defaultPrice != null
                  ? String(item.defaultPrice)
                  : "",
            useDefault:
              item.negotiatedPrice == null ||
              (item.defaultPrice != null && item.negotiatedPrice === item.defaultPrice),
          });
        }
        setSelected(next);
      })
      .catch(() => {
        if (!cancelled) toast.error("Não foi possível carregar o catálogo de exames.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, companyId, initialValidFrom, initialValidUntil]);

  const categories = useMemo(() => {
    const set = new Set(catalog.map((c) => c.examCategoryLabel).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [catalog]);

  const filtered = useMemo(() => {
    return catalog.filter((item) => {
      if (category && item.examCategoryLabel !== category) return false;
      if (!q.trim()) return true;
      const term = q.toLowerCase();
      return (
        item.name.toLowerCase().includes(term) ||
        item.examCategoryLabel.toLowerCase().includes(term)
      );
    });
  }, [catalog, category, q]);

  function toggleExam(item: CompanyPackageCatalogItem) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(item.examId)) {
        next.delete(item.examId);
        return next;
      }
      next.set(item.examId, {
        examId: item.examId,
        name: item.name,
        category: item.category,
        examCategoryLabel: item.examCategoryLabel,
        defaultPrice: item.defaultPrice,
        negotiatedPrice: item.defaultPrice != null ? String(item.defaultPrice) : "",
        useDefault: item.defaultPrice != null,
      });
      return next;
    });
  }

  function updateDraft(examId: string, patch: Partial<DraftRow>) {
    setSelected((prev) => {
      const current = prev.get(examId);
      if (!current) return prev;
      const next = new Map(prev);
      next.set(examId, { ...current, ...patch });
      return next;
    });
  }

  function handleSave() {
    if (selected.size === 0) {
      toast.error("Selecione ao menos um exame para o pacote.");
      return;
    }

    const items = Array.from(selected.values()).map((row) => ({
      examId: row.examId,
      name: row.name,
      category: row.category,
      defaultPrice: row.defaultPrice,
      negotiatedPrice: row.negotiatedPrice ? parseFloat(row.negotiatedPrice) : null,
      useDefault: row.useDefault,
    }));

    startTransition(async () => {
      const result = await saveCompanyExamPackage({
        companyId,
        validFrom: validFrom || null,
        validUntil: validUntil || null,
        items,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Pacote salvo com ${result.saved} exame(s).`);
      onOpenChange(false);
      onSuccess();
    });
  }

  const hasPackage = catalog.some((c) => c.inPackage);

  return (
    <SystemModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={hasPackage ? "Editar pacote" : "Montar pacote"}
      description={`Selecione os exames incluídos no contrato de ${companyName} e defina os valores negociados.`}
      badges={[
        { label: "Pacote contratado", variant: "category" },
        { label: `${selected.size} selecionado(s)`, variant: "status" },
      ]}
      className="empresa-pacote-modal"
      footer={
        <div className="collaborator-modal-actions">
          <Button
            variant="outline"
            className="collaborator-modal-btn"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            variant="brand"
            className="collaborator-modal-btn"
            onClick={handleSave}
            disabled={pending || loading}
          >
            {pending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      }
    >
      <SystemModalField label="Vigência — início">
        <input
          type="date"
          value={validFrom}
          onChange={(e) => setValidFrom(e.target.value)}
        />
      </SystemModalField>
      <SystemModalField label="Vigência — fim">
        <input
          type="date"
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
        />
      </SystemModalField>

      <div className="exam-modal-item exam-modal-item--wide empresa-pacote-filters">
        <div className="tabela-precos-search">
          <Search className="tabela-precos-search-icon" aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar exame"
            className="tabela-precos-search-input"
          />
        </div>
        <select
          className="tabela-precos-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filtrar por categoria"
        >
          <option value="">Categoria</option>
          {categories.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="exam-modal-item exam-modal-item--wide">
        {loading ? (
          <p className="text-sm text-slate-500">Carregando exames…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum exame encontrado.</p>
        ) : (
          <div className="empresa-pacote-list">
            {filtered.map((item) => {
              const draft = selected.get(item.examId);
              const checked = Boolean(draft);
              return (
                <div
                  key={item.examId}
                  className={cn(
                    "empresa-pacote-row",
                    checked && "empresa-pacote-row--selected"
                  )}
                >
                  <label className="empresa-pacote-check">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleExam(item)}
                    />
                    <span>
                      <span className="empresa-pacote-name">{item.name}</span>
                      <span className="empresa-pacote-meta">
                        {item.examCategoryLabel} · Padrão {formatPrice(item.defaultPrice)}
                      </span>
                    </span>
                  </label>

                  {draft && (
                    <div className="empresa-pacote-price-fields">
                      <label className="empresa-pacote-use-default">
                        <input
                          type="checkbox"
                          checked={draft.useDefault}
                          disabled={draft.defaultPrice == null}
                          onChange={(e) => {
                            const useDefault = e.target.checked;
                            updateDraft(item.examId, {
                              useDefault,
                              negotiatedPrice:
                                useDefault && draft.defaultPrice != null
                                  ? String(draft.defaultPrice)
                                  : draft.negotiatedPrice,
                            });
                          }}
                        />
                        Usar preço padrão
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="empresa-pacote-price-input"
                        disabled={draft.useDefault && draft.defaultPrice != null}
                        value={draft.negotiatedPrice}
                        onChange={(e) =>
                          updateDraft(item.examId, {
                            negotiatedPrice: e.target.value,
                            useDefault: false,
                          })
                        }
                        placeholder="Preço negociado"
                        aria-label={`Preço negociado de ${item.name}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SystemModalShell>
  );
}
