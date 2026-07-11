"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileCheck,
  FileText,
  FolderOpen,
  Loader2,
  Search,
  X,
} from "lucide-react";
import type { DocumentDetailSerialized, DocumentListItem } from "@/lib/documents";
import { DOCUMENT_TYPE_LABELS } from "@/lib/documents";
import { documentStatCardsForEmpresa } from "@/lib/empresa-portal";
import { getDocumentDetail } from "@/actions/documents";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PageModule } from "@/components/dashboard/PageModule";
import { FilterMetricGrid } from "@/components/dashboard/FilterMetricGrid";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DocumentDetailContent } from "./DocumentDetailContent";
import { toast } from "sonner";

type EmpresaDocumentosClientProps = {
  initialItems: DocumentListItem[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  statCounts: Record<string, number>;
  filters: Record<string, string | undefined>;
};

export function EmpresaDocumentosClient({
  initialItems,
  initialTotal,
  initialPage,
  pageSize,
  statCounts,
  filters,
}: EmpresaDocumentosClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(filters.q ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<DocumentDetailSerialized | null>(null);

  const activeCard = filters.card ?? "ALL";
  const totalPages = Math.max(1, Math.ceil(initialTotal / pageSize));

  const updateFilters = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (!value || value === "ALL") params.delete(key);
      else params.set(key, value);
    });
    if (!patch.page) params.delete("page");
    startTransition(() => router.push(`/dashboard/documentos?${params.toString()}`));
  };

  const handleSearch = () => updateFilters({ q: q.trim() || undefined });
  const clearFilters = () => {
    setQ("");
    startTransition(() => router.push("/dashboard/documentos"));
  };

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    setDetail(null);
    const result = await getDocumentDetail(id);
    setDetailLoading(false);
    if (!result.success) {
      toast.error(result.error);
      setSelectedId(null);
      return;
    }
    setDetail(result.document);
  };

  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    if (idFromUrl && idFromUrl !== selectedId) openDetail(idFromUrl);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const downloadUrl = (id: string) => `/api/documents/${id}/file?action=download`;

  return (
    <PageModule>
      <PageHeader
        title="Documentos"
        description="ASOs, laudos e arquivos anexados pela Unimetra. Se tem arquivo aqui, você pode baixar."
      />

      <div className="empresa-docs-intro">
        <FileCheck className="h-4 w-4 shrink-0 text-emerald-600" />
        <p>
          A clínica anexa o documento e ele aparece aqui automaticamente para sua empresa.
          Use <strong>Baixar</strong> para salvar o PDF no seu computador.
        </p>
      </div>

      <FilterMetricGrid
        items={documentStatCardsForEmpresa().map((card) => {
          const isActive = activeCard === card.filter;
          return {
            key: card.key,
            metaKey: `document:${card.key}`,
            label: card.label,
            value: statCounts[card.key] ?? 0,
            active: isActive,
            onClick: () =>
              updateFilters({ card: isActive ? undefined : card.filter }),
          };
        })}
      />

      <div className="empresa-docs-panel">
        <div className="empresa-docs-toolbar">
          <div className="empresa-docs-search">
            <Search className="empresa-docs-search-icon" />
            <input
              type="search"
              className="empresa-docs-search-input"
              placeholder="Buscar por colaborador, protocolo ou tipo de documento"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            {q && (
              <button
                type="button"
                className="empresa-docs-search-clear"
                onClick={() => {
                  setQ("");
                  updateFilters({ q: undefined });
                }}
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleSearch} disabled={isPending}>
            Buscar
          </Button>
          <span className="empresa-docs-count">
            {initialTotal} documento{initialTotal !== 1 ? "s" : ""}
          </span>
        </div>

        {initialItems.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            className="border-0 shadow-none"
            title="Nenhum documento encontrado"
            description={
              activeCard === "AGUARDANDO_ARQUIVO"
                ? "Não há documentos aguardando arquivo da clínica no momento."
                : "Quando a Unimetra anexar ASOs ou laudos, eles aparecerão aqui para download."
            }
          />
        ) : (
          <div className="empresa-docs-list">
            {initialItems.map((item) => (
              <div key={item.id} className="empresa-docs-row">
                <div className="empresa-docs-row-icon">
                  <FileText className="h-4 w-4" />
                </div>
                <button
                  type="button"
                  className="empresa-docs-row-body"
                  onClick={() => openDetail(item.id)}
                >
                  <div className="empresa-docs-row-top">
                    <span className="empresa-docs-row-name">{item.title}</span>
                    <span className="empresa-docs-category">
                      {DOCUMENT_TYPE_LABELS[item.type] ?? item.type}
                    </span>
                  </div>
                  <p className="empresa-docs-row-desc">
                    {item.patientName ?? "Sem colaborador vinculado"}
                    {item.protocol ? ` · ${item.protocol}` : ""}
                  </p>
                  <div className="empresa-docs-row-meta">
                    <span>{format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                    {item.hasFile ? (
                      <span className="empresa-docs-ready">Arquivo disponível</span>
                    ) : (
                      <span className="empresa-docs-waiting">Aguardando arquivo</span>
                    )}
                  </div>
                </button>
                {item.hasFile ? (
                  <a
                    href={downloadUrl(item.id)}
                    className="empresa-docs-download"
                    download
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="h-4 w-4" />
                    Baixar
                  </a>
                ) : (
                  <span className="empresa-docs-download empresa-docs-download--disabled">
                    <Loader2 className="h-4 w-4 opacity-40" />
                    Pendente
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {initialTotal > pageSize && (
          <div className="empresa-docs-pagination">
            <p className="text-sm text-slate-500">
              Página {initialPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={initialPage <= 1 || isPending}
                onClick={() => updateFilters({ page: String(initialPage - 1) })}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={initialPage >= totalPages || isPending}
                onClick={() => updateFilters({ page: String(initialPage + 1) })}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b pb-4">
            <SheetTitle>{detail?.title ?? "Documento"}</SheetTitle>
          </SheetHeader>
          {detailLoading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-green)]" />
            </div>
          )}
          {detail && !detailLoading && (
            <div className="space-y-4 pt-4">
              <DocumentDetailContent document={detail} compact />
              {detail.fileUrl && (
                <a href={downloadUrl(detail.id)} download className="block">
                  <Button variant="brand" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar documento
                  </Button>
                </a>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </PageModule>
  );
}
