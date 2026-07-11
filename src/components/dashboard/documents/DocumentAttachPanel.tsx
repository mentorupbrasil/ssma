"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  Paperclip,
  Upload,
} from "lucide-react";
import type { DocumentListItem } from "@/lib/documents";
import {
  CLINIC_ATTACH_SLOTS,
  matchDocumentToAttachSlot,
} from "@/lib/documents";
import {
  listDocumentsForReferralContext,
  updateDocumentStatus,
} from "@/actions/documents";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type AttachContext = {
  documentId?: string;
  referralId: string | null;
  companyId: string | null;
  companyName: string | null;
  patientId: string | null;
  patientName: string | null;
  protocol: string | null;
};

type DocumentAttachPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: AttachContext | null;
  pendingQueue: AttachContext[];
  onDone: () => void;
  onOpenNext?: (next: AttachContext) => void;
};

async function uploadSlotFile(params: {
  file: File;
  type: string;
  title: string;
  companyId: string | null;
  patientId: string | null;
  referralId: string | null;
  documentId?: string;
  makeAvailable: boolean;
}) {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("type", params.type);
  formData.append("title", params.title);
  formData.append("makeAvailable", params.makeAvailable ? "true" : "false");
  if (params.documentId) formData.append("documentId", params.documentId);
  if (params.companyId) formData.append("companyId", params.companyId);
  if (params.patientId) formData.append("patientId", params.patientId);
  if (params.referralId) formData.append("referralId", params.referralId);

  const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Erro no upload.");
  return data.documentId as string;
}

export function DocumentAttachPanel({
  open,
  onOpenChange,
  context,
  pendingQueue,
  onDone,
  onOpenNext,
}: DocumentAttachPanelProps) {
  const [relatedDocs, setRelatedDocs] = useState<DocumentListItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [liberating, setLiberating] = useState(false);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const loadRelated = useCallback(async (ctx: AttachContext) => {
    if (!ctx.referralId) {
      setRelatedDocs([]);
      return;
    }
    setLoadingDocs(true);
    const result = await listDocumentsForReferralContext(ctx.referralId);
    setLoadingDocs(false);
    if (result.success) {
      setRelatedDocs(result.documents);
    } else {
      setRelatedDocs([]);
      toast.error(result.error);
    }
  }, []);

  useEffect(() => {
    if (open && context) {
      void loadRelated(context);
    }
  }, [open, context, loadRelated]);

  const slotDocs = useMemo(() => {
    const map: Record<string, DocumentListItem | undefined> = {};
    for (const slot of CLINIC_ATTACH_SLOTS) {
      map[slot.key] = relatedDocs.find((d) => matchDocumentToAttachSlot(d) === slot.key && d.hasFile);
    }
    // fallback: current row document if it's ASO without referral docs loaded yet
    if (context?.documentId && !map.aso) {
      const current = relatedDocs.find((d) => d.id === context.documentId);
      if (current?.hasFile && current.type === "ASO") map.aso = current;
    }
    return map;
  }, [relatedDocs, context]);

  const asoDoc = slotDocs.aso;
  const asoReady = Boolean(asoDoc?.hasFile);
  const asoLiberado =
    asoReady &&
    ["DISPONIVEL", "CONCLUIDO", "EM_DIA", "ENVIADO", "ENTREGUE"].includes(asoDoc!.status);

  const nextPending = useMemo(() => {
    if (!context) return null;
    return (
      pendingQueue.find(
        (item) =>
          item.referralId &&
          item.referralId !== context.referralId &&
          (item.documentId !== context.documentId || !context.documentId)
      ) ?? null
    );
  }, [pendingQueue, context]);

  const handleUpload = async (slotKey: string, file: File) => {
    if (!context) return;
    const slot = CLINIC_ATTACH_SLOTS.find((s) => s.key === slotKey);
    if (!slot) return;
    if (!context.companyId) {
      toast.error("Registro sem empresa vinculada.");
      return;
    }

    const patientLabel = context.patientName ?? "Colaborador";
    const title = `${slot.titlePrefix} — ${patientLabel}`;
    const existing = relatedDocs.find((d) => matchDocumentToAttachSlot(d) === slotKey);

    setUploadingKey(slotKey);
    try {
      await uploadSlotFile({
        file,
        type: slot.type,
        title,
        companyId: context.companyId,
        patientId: context.patientId,
        referralId: context.referralId,
        documentId: existing?.id,
        makeAvailable: true,
      });
      toast.success(`${slot.label} anexado.`);
      await loadRelated(context);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no upload.");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleLiberar = async () => {
    if (!asoDoc) {
      toast.error("Anexe o ASO antes de liberar.");
      return;
    }
    setLiberating(true);
    const result = await updateDocumentStatus(asoDoc.id, "DISPONIVEL");
    setLiberating(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Documentação liberada para a empresa.");
    onDone();
    if (context) await loadRelated(context);
  };

  if (!context) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="doc-attach-panel flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b border-slate-200 px-5 py-4 text-left">
          <SheetTitle className="text-base font-semibold text-slate-900">
            Anexar documentação
          </SheetTitle>
          <SheetDescription className="text-sm text-slate-500">
            Vá anexando os arquivos deste colaborador. Depois libere para a empresa.
          </SheetDescription>
        </SheetHeader>

        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Colaborador</dt>
              <dd className="font-medium text-slate-900 text-right">
                {context.patientName ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Empresa</dt>
              <dd className="font-medium text-slate-900 text-right">
                {context.companyName ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Protocolo</dt>
              <dd className="font-mono text-xs text-slate-700 text-right">
                {context.protocol ?? "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex-1 px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Arquivos do atendimento
          </p>

          {loadingDocs ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <ul className="space-y-2">
              {CLINIC_ATTACH_SLOTS.map((slot) => {
                const doc = slotDocs[slot.key];
                const done = Boolean(doc?.hasFile);
                const busy = uploadingKey === slot.key;
                return (
                  <li
                    key={slot.key}
                    className={cn(
                      "rounded-md border px-3 py-3",
                      done ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                          ) : (
                            <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                          )}
                          <p className="text-sm font-medium text-slate-900">
                            {slot.label}
                            {slot.required ? (
                              <span className="ml-1 text-xs font-normal text-slate-400">
                                (obrigatório)
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <p className="mt-0.5 pl-6 text-xs text-slate-500">{slot.hint}</p>
                        {done && doc?.fileName ? (
                          <p className="mt-1 pl-6 truncate text-xs text-emerald-700">
                            {doc.fileName}
                          </p>
                        ) : null}
                      </div>

                      <div className="shrink-0">
                        <input
                          ref={(el) => {
                            fileInputs.current[slot.key] = el;
                          }}
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (file) void handleUpload(slot.key, file);
                          }}
                        />
                        <Button
                          type="button"
                          variant={done ? "outline" : "brand"}
                          size="sm"
                          className="rounded-md"
                          disabled={busy}
                          onClick={() => fileInputs.current[slot.key]?.click()}
                        >
                          {busy ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : done ? (
                            <Upload className="mr-1.5 h-3.5 w-3.5" />
                          ) : (
                            <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          {done ? "Trocar" : "Anexar"}
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-auto space-y-2 border-t border-slate-200 bg-white px-5 py-4">
          <Button
            type="button"
            variant="brand"
            className="w-full rounded-md"
            disabled={!asoReady || asoLiberado || liberating}
            onClick={() => void handleLiberar()}
          >
            {liberating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {asoLiberado ? "Já liberado para a empresa" : "Liberar para a empresa"}
          </Button>

          {nextPending && onOpenNext ? (
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-md"
              onClick={() => onOpenNext(nextPending)}
            >
              Próximo pendente
              <ChevronRight className="ml-1.5 h-4 w-4" />
              <span className="ml-1 truncate text-slate-500">
                {nextPending.patientName ?? "Colaborador"}
              </span>
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
