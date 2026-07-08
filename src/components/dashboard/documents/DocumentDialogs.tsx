"use client";

import { useEffect, useRef, useState } from "react";
import { createDocument, updateDocument } from "@/actions/documents";
import type { DocumentFormOptions } from "@/lib/documents";
import type { DocumentDetailSerialized } from "@/lib/documents";
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  ASO_CLINICAL_TYPE_LABELS,
  CLINICAL_DOCUMENT_TYPES,
} from "@/lib/documents";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Upload, Loader2, FileText } from "lucide-react";
import type { DocumentStatus, DocumentType } from "@prisma/client";

type FormOptions = DocumentFormOptions;

type DocumentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document?: DocumentDetailSerialized | null;
  formOptions: FormOptions;
  attachOnly?: boolean;
  onSuccess: (documentId?: string) => void;
};

const DOCUMENT_TYPES = Object.entries(DOCUMENT_TYPE_LABELS).filter(
  ([k]) => !["LAUDO", "PROPOSTA", "ENCAMINHAMENTO"].includes(k)
) as [DocumentType, string][];

const INITIAL_STATUSES: DocumentStatus[] = [
  "PENDENTE",
  "EM_EMISSAO",
  "DISPONIVEL",
];

const ASO_TYPES = Object.entries(ASO_CLINICAL_TYPE_LABELS);

const defaultForm = {
  title: "",
  type: "ASO" as DocumentType,
  status: "PENDENTE" as DocumentStatus,
  issuedAt: "",
  validUntil: "",
  sensitive: false,
  availableOnPortal: false,
  companyId: "",
  patientId: "",
  referralId: "",
  examId: "",
  quoteId: "",
  notes: "",
  clientNotes: "",
  asoClinicalType: "",
  asoExamDate: "",
  asoProfessionalName: "",
};

async function uploadFile(
  file: File,
  payload: Record<string, string>,
  makeAvailable: boolean
) {
  const formData = new FormData();
  formData.append("file", file);
  Object.entries(payload).forEach(([k, v]) => {
    if (v) formData.append(k, v);
  });
  formData.append("makeAvailable", makeAvailable ? "true" : "false");

  const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Erro no upload.");
  return data.documentId as string;
}

export function DocumentFormDialog({
  open,
  onOpenChange,
  document,
  formOptions,
  attachOnly = false,
  onSuccess,
}: DocumentFormDialogProps) {
  const isEdit = !!document;
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (!open) {
      setFile(null);
      return;
    }
    if (document) {
      setForm({
        title: document.title,
        type: document.type,
        status: document.status,
        issuedAt: document.issuedAt ? document.issuedAt.slice(0, 10) : "",
        validUntil: document.validUntil ? document.validUntil.slice(0, 10) : "",
        sensitive: document.sensitive,
        availableOnPortal: document.availableOnPortal,
        companyId: document.companyId ?? "",
        patientId: document.patientId ?? "",
        referralId: document.referralId ?? "",
        examId: document.examId ?? "",
        quoteId: document.quoteId ?? "",
        notes: document.notes ?? "",
        clientNotes: document.clientNotes ?? "",
        asoClinicalType: document.asoClinicalType ?? "",
        asoExamDate: document.asoExamDate ? document.asoExamDate.slice(0, 10) : "",
        asoProfessionalName: document.asoProfessionalName ?? "",
      });
    } else {
      setForm({ ...defaultForm, sensitive: false });
    }
  }, [open, document]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "type" && CLINICAL_DOCUMENT_TYPES.includes(value as DocumentType)) {
        next.sensitive = true;
      }
      return next;
    });
  };

  const filteredPatients = form.companyId
    ? formOptions.patients.filter((p) => p.companyId === form.companyId)
    : formOptions.patients;

  const buildPayload = (makeAvailable: boolean) => ({
    title: form.title,
    type: form.type,
    status: makeAvailable ? "DISPONIVEL" as DocumentStatus : form.status,
    issuedAt: form.issuedAt || null,
    validUntil: form.validUntil || null,
    sensitive: form.sensitive,
    availableOnPortal: form.availableOnPortal,
    companyId: form.companyId || null,
    patientId: form.patientId || null,
    referralId: form.referralId || null,
    examId: form.examId || null,
    quoteId: form.quoteId || null,
    notes: form.notes,
    clientNotes: form.clientNotes,
    asoClinicalType: (form.asoClinicalType || null) as import("@prisma/client").ClinicalExamType | null,
    asoExamDate: form.asoExamDate || null,
    asoProfessionalName: form.asoProfessionalName,
    makeAvailable,
  });

  const handleSave = async (makeAvailable = false) => {
    if (!form.title.trim()) {
      toast.error("Informe o título do documento.");
      return;
    }
    if (attachOnly && !file && !isEdit) {
      toast.error("Selecione um arquivo para anexar.");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        const result = await updateDocument(document!.id, buildPayload(makeAvailable));
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        if (file) {
          await uploadFile(
            file,
            { documentId: document!.id },
            makeAvailable
          );
        }
        toast.success("Documento atualizado.");
        onOpenChange(false);
        onSuccess(document!.id);
        return;
      }

      if (file) {
        const createResult = await createDocument(buildPayload(false));
        if (!createResult.success) {
          toast.error(createResult.error);
          return;
        }
        await uploadFile(file, { documentId: createResult.documentId }, makeAvailable);
        toast.success(makeAvailable ? "Documento disponibilizado." : "Documento salvo.");
        onOpenChange(false);
        onSuccess(createResult.documentId);
        return;
      }

      const result = await createDocument(buildPayload(makeAvailable));
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Documento criado.");
      onOpenChange(false);
      onSuccess(result.documentId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar documento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {attachOnly ? "Anexar arquivo" : isEdit ? "Editar documento" : "Novo documento"}
          </DialogTitle>
          <DialogDescription>
            {attachOnly
              ? "Envie um arquivo PDF, imagem ou documento permitido (máx. 15 MB)."
              : "Cadastre documentos ocupacionais com ou sem arquivo anexado."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Dados principais
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Título do documento</Label>
                <Input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Ex.: ASO — Carlos Eduardo Santos"
                />
              </div>
              <div>
                <Label>Tipo de documento</Label>
                <select
                  className="mt-1 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  value={form.type}
                  onChange={(e) => set("type", e.target.value as DocumentType)}
                >
                  {DOCUMENT_TYPES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Status inicial</Label>
                <select
                  className="mt-1 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  value={form.status}
                  onChange={(e) => set("status", e.target.value as DocumentStatus)}
                >
                  {INITIAL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {DOCUMENT_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Data de emissão</Label>
                <Input
                  type="date"
                  value={form.issuedAt}
                  onChange={(e) => set("issuedAt", e.target.value)}
                />
              </div>
              <div>
                <Label>Data de validade</Label>
                <Input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => set("validUntil", e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.sensitive}
                  onCheckedChange={(c) => set("sensitive", c === true)}
                />
                Documento sensível
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.availableOnPortal}
                  onCheckedChange={(c) => set("availableOnPortal", c === true)}
                />
                Disponibilizar no portal empresarial
              </label>
            </div>
          </div>

          {form.type === "ASO" && (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Dados do ASO
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Tipo de ASO</Label>
                  <select
                    className="mt-1 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    value={form.asoClinicalType}
                    onChange={(e) => set("asoClinicalType", e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {ASO_TYPES.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Data do exame</Label>
                  <Input
                    type="date"
                    value={form.asoExamDate}
                    onChange={(e) => set("asoExamDate", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Profissional responsável</Label>
                  <Input
                    value={form.asoProfessionalName}
                    onChange={(e) => set("asoProfessionalName", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vínculos</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Empresa</Label>
                <select
                  className="mt-1 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  value={form.companyId}
                  onChange={(e) => set("companyId", e.target.value)}
                >
                  <option value="">Nenhuma</option>
                  {formOptions.companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.tradeName ?? c.legalName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Colaborador</Label>
                <select
                  className="mt-1 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  value={form.patientId}
                  onChange={(e) => set("patientId", e.target.value)}
                >
                  <option value="">Nenhum</option>
                  {filteredPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Encaminhamento</Label>
                <select
                  className="mt-1 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  value={form.referralId}
                  onChange={(e) => set("referralId", e.target.value)}
                >
                  <option value="">Nenhum</option>
                  {formOptions.referrals.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.protocol}
                      {r.patient ? ` — ${r.patient.fullName}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Exame</Label>
                <select
                  className="mt-1 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  value={form.examId}
                  onChange={(e) => set("examId", e.target.value)}
                >
                  <option value="">Nenhum</option>
                  {formOptions.exams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label>Orçamento</Label>
                <select
                  className="mt-1 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  value={form.quoteId}
                  onChange={(e) => set("quoteId", e.target.value)}
                >
                  <option value="">Nenhum</option>
                  {formOptions.quotes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.quoteNumber} — {q.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Arquivo</p>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center transition hover:border-[#16A085]/40 hover:bg-emerald-50/30"
            >
              {file ? (
                <>
                  <FileText className="h-8 w-8 text-[#16A085]" />
                  <p className="mt-2 text-sm font-medium text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · Clique para trocar
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {attachOnly ? "Selecione o arquivo" : "Anexar arquivo (opcional)"}
                  </p>
                  <p className="text-xs text-slate-500">PDF, imagens ou documentos · máx. 15 MB</p>
                </>
              )}
            </button>
            <div>
              <Label>Observação</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
                placeholder="Observação interna"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar documento
          </Button>
          <Button variant="brand" onClick={() => handleSave(true)} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar e disponibilizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
