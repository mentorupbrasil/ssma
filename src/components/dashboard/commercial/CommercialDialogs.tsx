"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createQuote, updateQuote } from "@/actions/commercial";
import { listPricesForQuote } from "@/actions/pricing";
import type { QuoteDetailSerialized } from "@/lib/commercial";
import { SUGGESTED_QUOTE_SERVICES } from "@/lib/commercial";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type CompanyOption = {
  id: string;
  legalName: string;
  tradeName: string | null;
  cnpj: string;
  city: string | null;
  state: string | null;
  responsibleName: string | null;
  whatsapp: string | null;
  email: string | null;
};

type QuoteItemForm = {
  serviceName: string;
  category: string;
  quantity: string;
  unitPrice: string;
  notes: string;
};

type QuoteFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote?: QuoteDetailSerialized | null;
  companies: CompanyOption[];
  sourceLeadId?: string;
  prefill?: Partial<{
    companyName: string;
    responsibleName: string;
    phone: string;
    email: string;
    companyId: string;
  }>;
  onSuccess: (quoteId?: string) => void;
};

const emptyItem = (): QuoteItemForm => ({
  serviceName: "",
  category: "",
  quantity: "1",
  unitPrice: "",
  notes: "",
});

export function QuoteFormDialog({
  open,
  onOpenChange,
  quote,
  companies,
  sourceLeadId,
  prefill,
  onSuccess,
}: QuoteFormDialogProps) {
  const isEdit = !!quote;
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [items, setItems] = useState<QuoteItemForm[]>([emptyItem()]);
  const [priceCatalog, setPriceCatalog] = useState<{ name: string; price: number; category: string | null }[]>([]);

  useEffect(() => {
    if (!open) return;
    listPricesForQuote(companyId || null).then(setPriceCatalog).catch(() => setPriceCatalog([]));
  }, [open, companyId]);

  useEffect(() => {
    if (!open) return;
    if (quote) {
      setCompanyId(quote.companyId ?? "");
      setCompanyName(quote.companyName);
      setResponsibleName(quote.responsibleName ?? "");
      setPhone(quote.phone ?? "");
      setEmail(quote.email ?? "");
      setCnpj(quote.cnpj ?? "");
      setCity(quote.city ?? "");
      setState(quote.state ?? "");
      setValidUntil(quote.validUntil ? quote.validUntil.slice(0, 10) : "");
      setPaymentTerms(quote.paymentTerms ?? "");
      setInternalNotes(quote.internalNotes ?? "");
      setClientNotes(quote.clientNotes ?? "");
      setItems(
        quote.items.length
          ? quote.items.map((i) => ({
              serviceName: i.serviceName,
              category: i.category ?? "",
              quantity: String(i.quantity),
              unitPrice: i.unitPrice != null ? String(i.unitPrice) : "",
              notes: i.notes ?? "",
            }))
          : [emptyItem()]
      );
    } else {
      setCompanyId(prefill?.companyId ?? "");
      setCompanyName(prefill?.companyName ?? "");
      setResponsibleName(prefill?.responsibleName ?? "");
      setPhone(prefill?.phone ?? "");
      setEmail(prefill?.email ?? "");
      setCnpj("");
      setCity("");
      setState("");
      setValidUntil("");
      setPaymentTerms("");
      setInternalNotes("");
      setClientNotes("");
      setItems([emptyItem()]);
    }
  }, [open, quote, prefill]);

  const onCompanySelect = (id: string) => {
    setCompanyId(id);
    const c = companies.find((x) => x.id === id);
    if (!c) return;
    setCompanyName(c.tradeName ?? c.legalName);
    setResponsibleName(c.responsibleName ?? "");
    setPhone(c.whatsapp ?? "");
    setEmail(c.email ?? "");
    setCnpj(c.cnpj);
    setCity(c.city ?? "");
    setState(c.state ?? "");
  };

  const applyPriceToItem = (idx: number, serviceName: string) => {
    const match = priceCatalog.find(
      (p) => p.name.toLowerCase() === serviceName.toLowerCase()
    ) ?? priceCatalog.find((p) =>
      p.name.toLowerCase().includes(serviceName.toLowerCase()) ||
      serviceName.toLowerCase().includes(p.name.toLowerCase())
    );
    if (!match) return;
    const next = [...items];
    next[idx] = {
      ...next[idx],
      serviceName: match.name,
      unitPrice: String(match.price),
      category: match.category ?? next[idx].category,
    };
    setItems(next);
  };

  const addFromCatalog = (name: string, price: number, category: string | null) => {
    setItems((prev) => [
      ...prev.filter((i) => i.serviceName.trim()),
      {
        serviceName: name,
        category: category ?? "",
        quantity: "1",
        unitPrice: String(price),
        notes: "",
      },
    ]);
  };

  const buildPayload = (sendOnSave: boolean) => ({
    companyId: companyId || null,
    companyName,
    responsibleName,
    phone,
    email,
    cnpj,
    city,
    state,
    validUntil: validUntil || null,
    paymentTerms,
    internalNotes,
    clientNotes,
    sourceLeadId,
    sendOnSave,
    items: items
      .filter((i) => i.serviceName.trim())
      .map((i) => ({
        serviceName: i.serviceName,
        category: i.category || undefined,
        quantity: parseInt(i.quantity, 10) || 1,
        unitPrice: i.unitPrice ? parseFloat(i.unitPrice) : null,
        notes: i.notes || undefined,
      })),
  });

  const handleSave = async (sendOnSave = false) => {
    setLoading(true);
    const payload = buildPayload(sendOnSave);
    const result = isEdit
      ? await updateQuote(quote!.id, payload)
      : await createQuote(payload);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Orçamento atualizado." : "Orçamento criado.");
    onOpenChange(false);
    const savedQuoteId = isEdit
      ? quote?.id
      : "quoteId" in result && typeof result.quoteId === "string"
        ? result.quoteId
        : undefined;
    onSuccess(savedQuoteId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar orçamento" : "Novo orçamento"}</DialogTitle>
          <DialogDescription>Preencha os dados da proposta comercial.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Empresa existente</Label>
              <select
                className="mt-1 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                value={companyId}
                onChange={(e) => onCompanySelect(e.target.value)}
              >
                <option value="">Nova empresa / digitar manualmente</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tradeName ?? c.legalName}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>Nome da empresa *</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div>
              <Label>Responsável</Label>
              <Input value={responsibleName} onChange={(e) => setResponsibleName(e.target.value)} />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <Label>UF</Label>
              <Input value={state} onChange={(e) => setState(e.target.value)} maxLength={2} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Itens do orçamento</Label>
              <div className="flex gap-2">
                {priceCatalog.length > 0 && (
                  <select
                    className="h-9 rounded-lg border border-slate-200 px-2 text-xs"
                    defaultValue=""
                    onChange={(e) => {
                      const opt = priceCatalog.find((p) => p.name === e.target.value);
                      if (opt) addFromCatalog(opt.name, opt.price, opt.category);
                      e.target.value = "";
                    }}
                  >
                    <option value="">+ Da tabela de preços</option>
                    {priceCatalog.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} — R$ {p.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => setItems((p) => [...p, emptyItem()])}>
                  <Plus className="mr-1 h-4 w-4" /> Item
                </Button>
              </div>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 p-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    list="quote-services"
                    placeholder="Serviço"
                    value={item.serviceName}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...item, serviceName: e.target.value };
                      setItems(next);
                    }}
                    onBlur={(e) => applyPriceToItem(idx, e.target.value)}
                    className="flex-1"
                  />
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
                <datalist id="quote-services">
                  {priceCatalog.map((p) => (
                    <option key={p.name} value={p.name} />
                  ))}
                  {SUGGESTED_QUOTE_SERVICES.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Qtd"
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...item, quantity: e.target.value };
                      setItems(next);
                    }}
                  />
                  <Input
                    placeholder="Valor unit."
                    value={item.unitPrice}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...item, unitPrice: e.target.value };
                      setItems(next);
                    }}
                  />
                  <Input
                    placeholder="Obs. item"
                    value={item.notes}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...item, notes: e.target.value };
                      setItems(next);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Validade da proposta</Label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
            <div>
              <Label>Condição de pagamento</Label>
              <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Observações para o cliente</Label>
              <Textarea value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} rows={2} />
            </div>
            <div className="sm:col-span-2">
              <Label>Observações internas</Label>
              <Textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={2} />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="brand" onClick={() => handleSave(false)} disabled={loading}>
            Salvar rascunho
          </Button>
          <Button variant="brand" onClick={() => handleSave(true)} disabled={loading}>
            Salvar e enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RejectQuoteDialog({
  open,
  onOpenChange,
  quoteId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("SEM_INTERESSE");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    setLoading(true);
    const { updateQuoteStatusCommercial } = await import("@/actions/commercial");
    const result = await updateQuoteStatusCommercial(quoteId, "RECUSADO", {
      rejectReason: reason as "VALOR" | "SEM_RESPOSTA" | "OUTRO_FORNECEDOR" | "SEM_INTERESSE" | "OUTRO",
      notes,
    });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Orçamento marcado como recusado.");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recusar orçamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Motivo</Label>
            <select
              className="mt-1 flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="VALOR">Valor</option>
              <option value="SEM_RESPOSTA">Cliente não respondeu</option>
              <option value="OUTRO_FORNECEDOR">Contratou outro fornecedor</option>
              <option value="SEM_INTERESSE">Sem interesse no momento</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>
          <div>
            <Label>Observação</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleReject} disabled={loading}>Confirmar recusa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
