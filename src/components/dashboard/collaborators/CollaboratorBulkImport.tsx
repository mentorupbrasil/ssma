"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import { importCollaboratorsCsv } from "@/actions/collaborators";
import {
  COLLABORATOR_IMPORT_CSV_SAMPLE,
} from "@/lib/empresa-portal";
import { Button } from "@/components/ui/button";

export function CollaboratorBulkImport() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const downloadTemplate = () => {
    const blob = new Blob([`\uFEFF${COLLABORATOR_IMPORT_CSV_SAMPLE}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo-colaboradores-unimetra.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    const csvText = await file.text();
    const result = await importCollaboratorsCsv(csvText);
    setUploading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(
      `Importação concluída: ${result.created} novos, ${result.updated} atualizados${
        result.skipped ? `, ${result.skipped} ignorados` : ""
      }.`
    );
    startTransition(() => router.refresh());
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-green-light)] text-[var(--brand-green)]">
            <FileSpreadsheet className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--brand-navy)]">Importar colaboradores em massa</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              Baixe o modelo CSV, preencha os dados da equipe e envie para atualizar o cadastro da empresa automaticamente.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="rounded-xl" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Baixar modelo
          </Button>
          <Button
            type="button"
            variant="brand"
            className="rounded-xl"
            disabled={pending || uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Importando..." : "Enviar planilha"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}
