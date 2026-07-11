"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

function fileExtLabel(fileName: string | null | undefined) {
  if (!fileName) return "Arquivo";
  const ext = fileName.split(".").pop()?.toUpperCase();
  return ext || "Arquivo";
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
  const [errorKey, setErrorKey] = useState<string | null>(null);
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
      setErrorKey(null);
      void loadRelated(context);
    }
  }, [open, context, loadRelated]);

  const slotDocs = useMemo(() => {
    const map: Record<string, DocumentListItem | undefined> = {};
    for (const slot of CLINIC_ATTACH_SLOTS) {
      map[slot.key] = relatedDocs.find((d) => matchDocumentToAttachSlot(d) === slot.key && d.hasFile);
    }
    if (context?.documentId && !map.aso) {
      const current = relatedDocs.find((d) => d.id === context.documentId);
      if (current?.hasFile && current.type === "ASO") map.aso = current;
    }
    return map;
  }, [relatedDocs, context]);

  const attachedCount = useMemo(
    () => CLINIC_ATTACH_SLOTS.filter((slot) => Boolean(slotDocs[slot.key]?.hasFile)).length,
    [slotDocs]
  );
  const totalSlots = CLINIC_ATTACH_SLOTS.length;
  const progressPct = Math.round((attachedCount / totalSlots) * 100);

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

    setErrorKey(null);
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
      setErrorKey(slotKey);
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
        showCloseButton
        overlayClassName="doc-attach-overlay bg-slate-900/20 backdrop-blur-[1px] supports-backdrop-filter:backdrop-blur-[1px]"
        className="doc-attach-panel gap-0 bg-white p-0 shadow-[ -8px_0_24px_rgba(15,23,42,0.06)] sm:max-w-[420px]"
      >
        <SheetHeader className="doc-attach-header shrink-0 space-y-1 border-b border-slate-200 px-5 py-4 pr-12 text-left">
          <SheetTitle className="text-[19px] font-semibold tracking-tight text-slate-900">
            Anexar documentação
          </SheetTitle>
          <SheetDescription className="text-[12px] leading-relaxed text-slate-500">
            Adicione os documentos do atendimento e libere-os para a empresa após a conferência.
          </SheetDescription>
        </SheetHeader>

        <div className="doc-attach-body min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <section className="doc-attach-meta" aria-label="Dados do atendimento">
            <h3 className="doc-attach-section-label">Dados do atendimento</h3>
            <dl className="doc-attach-meta-card">
              <div className="doc-attach-meta-row">
                <dt>Colaborador</dt>
                <dd>{context.patientName ?? "Não informado"}</dd>
              </div>
              <div className="doc-attach-meta-row">
                <dt>Empresa</dt>
                <dd>{context.companyName ?? "Não informado"}</dd>
              </div>
              <div className="doc-attach-meta-row">
                <dt>Protocolo</dt>
                <dd className="font-mono text-[12px]">
                  {context.protocol?.trim() ? context.protocol : "Não informado"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="doc-attach-files" aria-label="Documentos do atendimento">
            <div className="doc-attach-progress-head">
              <h3 className="doc-attach-section-label mb-0">Documentos do atendimento</h3>
              <p className="doc-attach-progress-count" aria-live="polite">
                {attachedCount} de {totalSlots} anexados
              </p>
            </div>
            <div
              className="doc-attach-progress-track"
              role="progressbar"
              aria-valuenow={attachedCount}
              aria-valuemin={0}
              aria-valuemax={totalSlots}
              aria-label={`${attachedCount} de ${totalSlots} documentos anexados`}
            >
              <div className="doc-attach-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>

            {loadingDocs ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                <span className="sr-only">Carregando documentos</span>
              </div>
            ) : (
              <ul className="doc-attach-list">
                {CLINIC_ATTACH_SLOTS.map((slot) => {
                  const doc = slotDocs[slot.key];
                  const done = Boolean(doc?.hasFile);
                  const busy = uploadingKey === slot.key;
                  const hasError = errorKey === slot.key && !done;
                  const statusLabel = busy
                    ? "Enviando"
                    : hasError
                      ? "Erro no envio"
                      : done
                        ? "Anexado"
                        : "Pendente";

                  return (
                    <li
                      key={slot.key}
                      className={cn(
                        "doc-attach-row",
                        done && "doc-attach-row--done",
                        busy && "doc-attach-row--busy",
                        hasError && "doc-attach-row--error"
                      )}
                    >
                      <div
                        className={cn(
                          "doc-attach-icon",
                          done && "doc-attach-icon--done",
                          hasError && "doc-attach-icon--error"
                        )}
                        aria-hidden
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : done ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : hasError ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>

                      <div className="doc-attach-row-copy min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="doc-attach-row-title">{slot.label}</p>
                          {slot.required ? (
                            <span className="doc-attach-badge doc-attach-badge--required">
                              Obrigatório
                            </span>
                          ) : (
                            <span className="doc-attach-badge doc-attach-badge--optional">
                              Opcional
                            </span>
                          )}
                          <span
                            className={cn(
                              "doc-attach-badge",
                              busy && "doc-attach-badge--pending",
                              hasError && "doc-attach-badge--error",
                              done && "doc-attach-badge--done",
                              !busy && !hasError && !done && "doc-attach-badge--pending"
                            )}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        {done && doc?.fileName ? (
                          <p className="doc-attach-row-meta truncate">
                            {doc.fileName}
                            <span className="text-slate-400"> · {fileExtLabel(doc.fileName)}</span>
                          </p>
                        ) : (
                          <p className="doc-attach-row-meta">{slot.hint}</p>
                        )}
                      </div>

                      <div className="doc-attach-row-actions shrink-0">
                        <input
                          ref={(el) => {
                            fileInputs.current[slot.key] = el;
                          }}
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          aria-label={`Selecionar arquivo para ${slot.label}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (file) void handleUpload(slot.key, file);
                          }}
                        />

                        {done && doc ? (
                          <div className="flex items-center gap-1">
                            <a
                              href={`/api/documents/${doc.id}/file`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex"
                            >
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="doc-attach-btn-secondary h-8 rounded-lg px-2.5 text-xs"
                                aria-label={`Visualizar ${slot.label}`}
                              >
                                <Eye className="mr-1 h-3.5 w-3.5" />
                                Ver
                              </Button>
                            </a>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="size-8 rounded-lg text-slate-500"
                                    aria-label={`Mais ações de ${slot.label}`}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                  disabled={busy}
                                  onClick={() => fileInputs.current[slot.key]?.click()}
                                >
                                  <Upload className="mr-2 h-3.5 w-3.5" />
                                  Substituir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="doc-attach-btn-attach h-8 rounded-lg px-2.5 text-xs"
                            disabled={busy}
                            aria-label={
                              busy ? `Enviando ${slot.label}` : `Anexar ${slot.label}`
                            }
                            onClick={() => fileInputs.current[slot.key]?.click()}
                          >
                            {busy ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {busy ? "Enviando" : "Anexar"}
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="doc-attach-footer shrink-0 border-t border-slate-200 bg-white px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-9 flex-1 rounded-lg text-sm"
              onClick={() => onOpenChange(false)}
            >
              Salvar como rascunho
            </Button>
            <Button
              type="button"
              variant="brand"
              className="h-9 flex-1 rounded-lg text-sm shadow-none"
              disabled={!asoReady || asoLiberado || liberating}
              onClick={() => void handleLiberar()}
            >
              {liberating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {asoLiberado ? "Já liberado" : "Liberar para empresa"}
            </Button>
          </div>
          {!asoReady ? (
            <p className="mt-2 text-[11px] leading-snug text-slate-500">
              Anexe o ASO obrigatório para liberar a documentação à empresa.
            </p>
          ) : asoLiberado ? (
            <p className="mt-2 text-[11px] leading-snug text-emerald-700">
              Documentação já disponibilizada para a empresa no portal.
            </p>
          ) : null}

          {nextPending && onOpenNext ? (
            <Button
              type="button"
              variant="ghost"
              className="mt-2 h-8 w-full justify-between rounded-lg px-2 text-xs text-slate-600"
              onClick={() => onOpenNext(nextPending)}
            >
              <span>Próximo pendente</span>
              <span className="inline-flex items-center gap-1 truncate font-medium text-slate-800">
                {nextPending.patientName ?? "Colaborador"}
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              </span>
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
