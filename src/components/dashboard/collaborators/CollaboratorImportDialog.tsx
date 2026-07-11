"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { importCollaboratorsCsv } from "@/actions/collaborators";
import { COLLABORATOR_IMPORT_CSV_SAMPLE } from "@/lib/empresa-portal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type CollaboratorImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CollaboratorImportDialog({ open, onOpenChange }: CollaboratorImportDialogProps) {
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
    onOpenChange(false);
    startTransition(() => router.refresh());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="exam-modal collaborator-modal sm:max-w-md" showCloseButton>
        <header className="exam-modal-head">
          <div className="exam-modal-head-top">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-blue-light,#e6edff)] text-[var(--brand-blue,#2e67ff)]">
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
            </span>
          </div>
          <DialogTitle className="exam-modal-title">Importar planilha</DialogTitle>
          <DialogDescription className="collaborator-modal-subtitle">
            Baixe o modelo CSV, preencha os dados da equipe e envie para atualizar o cadastro
            automaticamente.
          </DialogDescription>
        </header>

        <div className="exam-modal-grid collaborator-modal-grid">
          <div className="exam-modal-item exam-modal-item--wide">
            <p className="exam-modal-item-label">Modelo</p>
            <p className="exam-modal-item-text">
              Use o arquivo modelo com as colunas: nome, CPF, função, setor e demais campos
              obrigatórios.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 rounded-lg"
              onClick={downloadTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar modelo
            </Button>
          </div>
        </div>

        <footer className="exam-modal-footer collaborator-modal-footer">
          <div className="collaborator-modal-actions w-full">
            <Button
              type="button"
              variant="outline"
              className="collaborator-modal-btn"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="brand"
              className="collaborator-modal-btn"
              disabled={pending || uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Importando..." : "Enviar planilha"}
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            aria-label="Selecionar planilha CSV"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
        </footer>
      </DialogContent>
    </Dialog>
  );
}
