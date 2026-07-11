"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Download,
  Eye,
  FileClock,
  FileDown,
  FolderOpen,
  Loader2,
  Search,
} from "lucide-react";
import type { DocumentDetailSerialized, DocumentListItem } from "@/lib/documents";
import { DOCUMENT_TYPE_LABELS } from "@/lib/documents";
import {
  documentStatCardsForEmpresa,
  empresaDocumentDisplayStatus,
  EMPRESA_DOCUMENT_STATUS_FILTER_OPTIONS,
} from "@/lib/empresa-portal";
import { getDocumentDetail } from "@/actions/documents";
import { PageModule } from "@/components/dashboard/PageModule";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useBreadcrumbSegmentLabel } from "@/components/dashboard/BreadcrumbLabelProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DocumentDetailContent } from "./DocumentDetailContent";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type EmpresaDocumentosClientProps = {
  initialItems: DocumentListItem[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  statCounts: Record<string, number>;
  filters: {
    q?: string;
    card?: string;
    type?: string;
    status?: string;
  };
};

function linkedToLabel(item: DocumentListItem): string {
  if (item.patientName) return item.patientName;
  if (item.companyName) return item.companyName;
  return "—";
}

export function EmpresaDocumentosClient({
  initialItems,
  initialTotal,
  initialPage,
  pageSize,
  statCounts,
  filters,
}: EmpresaDocumentosClientProps) {
  useBreadcrumbSegmentLabel("documentos", "Documentos");

  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(filters.q ?? "");
  const [type, setType] = useState(filters.type ?? "");
  const [status, setStatus] = useState(filters.status ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<DocumentDetailSerialized | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCard = filters.card ?? "ALL";
  const totalPages = Math.max(1, Math.ceil(initialTotal / pageSize));
  const resultLabel =
    initialTotal === 1 ? "1 documento encontrado" : `${initialTotal} documentos encontrados`;

  const updateFilters = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (!value || value === "ALL") params.delete(key);
      else params.set(key, value);
    });
    if (!patch.page) params.delete("page");
    startTransition(() => router.push(`/dashboard/documentos?${params.toString()}`));
  };

  const clearFilters = () => {
    setQ("");
    setType("");
    setStatus("");
    startTransition(() => router.push("/dashboard/documentos"));
  };

  const hasActiveFilters = Boolean(filters.q || filters.card || filters.type || filters.status);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const next = q.trim();
      if ((filters.q ?? "") === next) return;
      updateFilters({ q: next || undefined });
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

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

  const viewUrl = (id: string) => `/api/documents/${id}/file`;
  const downloadUrl = (id: string) => `/api/documents/${id}/file?action=download`;

  const statCards = useMemo(() => {
    const icons = {
      para_baixar: FileDown,
      aguardando: FileClock,
      mes: FolderOpen,
    } as const;
    const tones = {
      para_baixar: "primary" as const,
      aguardando: "warning" as const,
      mes: "primary" as const,
    };
    return documentStatCardsForEmpresa().map((card) => ({
      ...card,
      value: statCounts[card.key] ?? 0,
      icon: icons[card.key as keyof typeof icons] ?? FolderOpen,
      tone: tones[card.key as keyof typeof tones] ?? ("primary" as const),
      hint:
        card.key === "para_baixar"
          ? "Arquivos liberados"
          : card.key === "aguardando"
            ? "Sem arquivo anexado"
            : "Com arquivo neste mês",
    }));
  }, [statCounts]);

  return (
    <PageModule className="documentos-empresa">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Documentos</h1>
          <p className="colaboradores-empresa-subtitle">
            Consulte ASOs, laudos e arquivos liberados pela Unimetra.
          </p>
        </div>
      </header>

      <div className="colaboradores-empresa-stats documentos-empresa-stats">
        {statCards.map((card) => {
          const Icon = card.icon;
          const isActive = activeCard === card.filter;
          return (
            <button
              key={card.key}
              type="button"
              className={cn(
                "colaboradores-empresa-stat colaboradores-empresa-stat--clickable",
                isActive && "colaboradores-empresa-stat--active"
              )}
              onClick={() =>
                updateFilters({ card: isActive ? undefined : card.filter })
              }
            >
              <span
                className={cn(
                  "colaboradores-empresa-stat-icon",
                  card.tone === "warning"
                    ? "colaboradores-empresa-stat-icon--warning"
                    : "colaboradores-empresa-stat-icon--primary"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="colaboradores-empresa-stat-body">
                <span className="colaboradores-empresa-stat-value">{card.value}</span>
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
              placeholder="Buscar por colaborador, empresa ou documento"
              aria-label="Buscar documentos"
              className="colaboradores-empresa-search-input"
            />
          </div>

          <select
            value={type}
            onChange={(e) => {
              const value = e.target.value;
              setType(value);
              updateFilters({ type: value || undefined });
            }}
            aria-label="Filtrar por tipo"
            className="colaboradores-empresa-select"
          >
            <option value="">Tipo</option>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              const value = e.target.value;
              setStatus(value);
              updateFilters({ status: value || undefined });
            }}
            aria-label="Filtrar por status"
            className="colaboradores-empresa-select"
          >
            {EMPRESA_DOCUMENT_STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="colaboradores-empresa-clear-btn rounded-lg"
              onClick={clearFilters}
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      <div className="colaboradores-empresa-table-wrap relative">
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-green)]" />
          </div>
        )}

        {initialItems.length === 0 ? (
          <EmptyState
            compact
            className="colaboradores-empresa-empty"
            title="Nenhum documento encontrado"
            description={
              activeCard === "AGUARDANDO_ARQUIVO"
                ? "Não há documentos aguardando liberação no momento."
                : "Quando a Unimetra liberar ASOs ou laudos, eles aparecerão aqui."
            }
          />
        ) : (
          <>
            <div className="colaboradores-empresa-result-bar">
              <p className="colaboradores-empresa-result-count">{resultLabel}</p>
            </div>
            <div className="colaboradores-empresa-table-scroll documentos-empresa-table-scroll">
              <table className="colaboradores-empresa-table documentos-empresa-table">
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Vinculado a</th>
                    <th>Tipo</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th className="colaboradores-empresa-th-actions">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {initialItems.map((item) => {
                    const display = empresaDocumentDisplayStatus(item);
                    return (
                      <tr key={item.id} className="colaboradores-empresa-row">
                        <td>
                          <button
                            type="button"
                            className="colaboradores-empresa-name hover:underline"
                            onClick={() => openDetail(item.id)}
                          >
                            {item.title}
                          </button>
                        </td>
                        <td>
                          <span className="colaboradores-empresa-role">{linkedToLabel(item)}</span>
                        </td>
                        <td>{DOCUMENT_TYPE_LABELS[item.type] ?? item.type}</td>
                        <td>
                          {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td>
                          <StatusBadge
                            status={display.toneStatus}
                            type="document"
                            label={display.label}
                          />
                        </td>
                        <td className="colaboradores-empresa-td-actions">
                          {item.hasFile ? (
                            <div className="documentos-empresa-actions">
                              <a
                                href={viewUrl(item.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  buttonVariants({ variant: "outline", size: "sm" }),
                                  "rounded-lg"
                                )}
                              >
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                Visualizar
                              </a>
                              <a
                                href={downloadUrl(item.id)}
                                download
                                className={cn(
                                  buttonVariants({ variant: "brand", size: "sm" }),
                                  "rounded-lg"
                                )}
                              >
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                                Baixar PDF
                              </a>
                            </div>
                          ) : (
                            <span className="colaboradores-empresa-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {initialTotal > pageSize && (
        <div className="colaboradores-empresa-pagination">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={initialPage <= 1 || isPending}
            onClick={() => updateFilters({ page: String(initialPage - 1) })}
          >
            Anterior
          </Button>
          <span className="colaboradores-empresa-pagination-label">
            Página {initialPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={initialPage >= totalPages || isPending}
            onClick={() => updateFilters({ page: String(initialPage + 1) })}
          >
            Próxima
          </Button>
        </div>
      )}

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
                <div className="documentos-empresa-actions">
                  <a
                    href={viewUrl(detail.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "outline" }), "rounded-lg flex-1")}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar
                  </a>
                  <a
                    href={downloadUrl(detail.id)}
                    download
                    className={cn(buttonVariants({ variant: "brand" }), "rounded-lg flex-1")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar PDF
                  </a>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </PageModule>
  );
}
