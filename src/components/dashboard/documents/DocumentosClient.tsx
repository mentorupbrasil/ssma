"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Download,
  Upload,
  MessageCircle,
  Archive,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Shield,
  Paperclip,
  RefreshCw,
} from "lucide-react";
import type { DocumentDetailSerialized, DocumentListItem } from "@/lib/documents";
import {
  DOCUMENT_STAT_CARDS,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  buildDocumentWhatsAppMessage,
  normalizeDocumentStatus,
} from "@/lib/documents";
import {
  getDocumentDetail,
  updateDocumentStatus,
  removeDocumentFile,
  deleteDocument,
} from "@/actions/documents";
import type { DocumentFormOptions } from "@/lib/documents";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DocumentDetailContent } from "./DocumentDetailContent";
import { DocumentFormDialog } from "./DocumentDialogs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DocumentStatus } from "@prisma/client";

type FormOptions = DocumentFormOptions;

type DocumentosClientProps = {
  initialItems: DocumentListItem[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  statCounts: Record<string, number>;
  canManage: boolean;
  formOptions: FormOptions;
  filters: Record<string, string | undefined>;
};

const STATUS_ACTIONS: DocumentStatus[] = [
  "PENDENTE",
  "EM_EMISSAO",
  "DISPONIVEL",
  "ENVIADO",
  "VENCIDO",
  "ARQUIVADO",
  "CANCELADO",
];

function ValidityIndicator({ label }: { label: string | null }) {
  if (!label) return null;
  const cls =
    label === "Vencido"
      ? "text-red-600"
      : label === "A vencer"
        ? "text-amber-600"
        : "text-emerald-600";
  return <span className={cn("text-xs font-medium", cls)}>{label}</span>;
}

export function DocumentosClient({
  initialItems,
  initialTotal,
  initialPage,
  pageSize,
  statCounts,
  canManage,
  formOptions,
  filters,
}: DocumentosClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(filters.q ?? "");
  const [type, setType] = useState(filters.type ?? "");
  const [status, setStatus] = useState(filters.status ?? "");
  const [companyId, setCompanyId] = useState(filters.companyId ?? "");
  const [patientId, setPatientId] = useState(filters.patientId ?? "");
  const [referralId, setReferralId] = useState(filters.referralId ?? "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");
  const [validity, setValidity] = useState(filters.validity ?? "");
  const [sensitive, setSensitive] = useState(filters.sensitive ?? "");
  const [sort, setSort] = useState(filters.sort ?? "");

  const [formOpen, setFormOpen] = useState(false);
  const [attachMode, setAttachMode] = useState(false);
  const [editDoc, setEditDoc] = useState<DocumentDetailSerialized | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailDoc, setDetailDoc] = useState<DocumentDetailSerialized | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentListItem | null>(null);

  const activeCard = filters.card ?? "ALL";
  const totalPages = Math.max(1, Math.ceil(initialTotal / pageSize));

  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "ALL") params.delete(key);
        else params.set(key, value);
      });
      if (!updates.page) params.delete("page");
      startTransition(() => {
        router.push(`/dashboard/documentos?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handleSearch = () => {
    updateFilters({
      q,
      card: activeCard !== "ALL" ? activeCard : undefined,
      type,
      status,
      companyId,
      patientId,
      referralId,
      dateFrom,
      dateTo,
      validity,
      sensitive,
      sort,
    });
  };

  const clearFilters = () => {
    setQ("");
    setType("");
    setStatus("");
    setCompanyId("");
    setPatientId("");
    setReferralId("");
    setDateFrom("");
    setDateTo("");
    setValidity("");
    setSensitive("");
    setSort("");
    startTransition(() => router.push("/dashboard/documentos"));
  };

  const openDetail = async (id: string) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetailDoc(null);
    const result = await getDocumentDetail(id);
    setDetailLoading(false);
    if (!result.success) {
      toast.error(result.error);
      setDrawerOpen(false);
      return;
    }
    setDetailDoc(result.document);
  };

  const refreshDetail = async (id: string) => {
    const result = await getDocumentDetail(id);
    if (result.success) setDetailDoc(result.document);
    router.refresh();
  };

  const handleStatusChange = async (item: DocumentListItem, newStatus: DocumentStatus) => {
    setActionLoading(item.id);
    const result = await updateDocumentStatus(item.id, newStatus);
    setActionLoading(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Status atualizado.");
    router.refresh();
    if (detailDoc?.id === item.id) refreshDetail(item.id);
  };

  const handleArchive = async (item: DocumentListItem) => {
    await handleStatusChange(item, "ARQUIVADO");
  };

  const handleRemoveFile = async (item: DocumentListItem) => {
    if (!confirm("Remover o arquivo deste documento? O registro será mantido como pendente.")) return;
    setActionLoading(item.id);
    const result = await removeDocumentFile(item.id);
    setActionLoading(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Arquivo removido.");
    router.refresh();
    if (detailDoc?.id === item.id) refreshDetail(item.id);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id);
    const result = await deleteDocument(deleteTarget.id);
    setActionLoading(null);
    setDeleteTarget(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Documento removido.");
    setDrawerOpen(false);
    router.refresh();
  };

  const openWhatsApp = (item: DocumentListItem) => {
    const msg = buildDocumentWhatsAppMessage({
      title: item.title,
      type: item.type,
      companyName: item.companyName,
      patientName: item.patientName,
      protocol: item.protocol,
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const openForm = (attach = false) => {
    setEditDoc(null);
    setAttachMode(attach);
    setFormOpen(true);
  };

  const openEdit = async (id: string) => {
    const result = await getDocumentDetail(id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setEditDoc(result.document);
    setAttachMode(false);
    setFormOpen(true);
  };

  useEffect(() => {
    if (searchParams.get("new") === "1" && canManage) openForm(false);
    if (searchParams.get("attach") === "1" && canManage) openForm(true);
  }, [searchParams, canManage]);

  const hasActiveFilters =
    !!filters.q ||
    !!filters.type ||
    !!filters.status ||
    !!filters.companyId ||
    activeCard !== "ALL";

  const empty = initialItems.length === 0 && !hasActiveFilters;

  return (
    <div className="referrals-module">
      <PageHeader
        title="Documentos"
        description="ASO, PCMSO, laudos e demais documentos ocupacionais"
      >
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => openForm(true)}>
              <Paperclip className="mr-2 h-4 w-4" /> Anexar arquivo
            </Button>
            <Button variant="brand" onClick={() => openForm(false)}>
              <Plus className="mr-2 h-4 w-4" /> Novo documento
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="referral-stat-grid referral-stat-grid-3 lg:grid-cols-6">
        {DOCUMENT_STAT_CARDS.map((card) => {
          const isActive = activeCard === card.filter;
          return (
            <button
              key={card.key}
              type="button"
              className={cn("referral-stat-card text-left", isActive && "referral-stat-card-active")}
              onClick={() => updateFilters({ card: isActive ? "ALL" : card.filter })}
            >
              <span className="referral-stat-count">{statCounts[card.key] ?? 0}</span>
              <span className="referral-stat-label">{card.label}</span>
            </button>
          );
        })}
      </div>

      <div className="referral-filters mt-6">
        <div className="referral-filters-grid">
          <div className="referral-filter-search sm:col-span-2">
            <Search className="referral-filter-search-icon h-4 w-4" />
            <Input
              placeholder="Buscar por título, empresa, colaborador, protocolo ou tipo de documento"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <select
            className="referral-filter-select"
            value={type || "ALL"}
            onChange={(e) => setType(e.target.value === "ALL" ? "" : e.target.value)}
          >
            <option value="ALL">Tipo de documento</option>
            {Object.entries(DOCUMENT_TYPE_LABELS)
              .filter(([k]) => !["LAUDO", "PROPOSTA", "ENCAMINHAMENTO"].includes(k))
              .map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
          </select>
          <select
            className="referral-filter-select"
            value={status || "ALL"}
            onChange={(e) => setStatus(e.target.value === "ALL" ? "" : e.target.value)}
          >
            <option value="ALL">Status</option>
            {Object.entries(DOCUMENT_STATUS_LABELS)
              .filter(([k]) =>
                ["PENDENTE", "EM_EMISSAO", "DISPONIVEL", "ENVIADO", "VENCIDO", "ARQUIVADO", "CANCELADO"].includes(k)
              )
              .map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
          </select>
          <select
            className="referral-filter-select"
            value={companyId || "ALL"}
            onChange={(e) => setCompanyId(e.target.value === "ALL" ? "" : e.target.value)}
          >
            <option value="ALL">Empresa</option>
            {formOptions.companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.tradeName ?? c.legalName}
              </option>
            ))}
          </select>
          <select
            className="referral-filter-select"
            value={patientId || "ALL"}
            onChange={(e) => setPatientId(e.target.value === "ALL" ? "" : e.target.value)}
          >
            <option value="ALL">Colaborador</option>
            {formOptions.patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName}
              </option>
            ))}
          </select>
          <select
            className="referral-filter-select"
            value={referralId || "ALL"}
            onChange={(e) => setReferralId(e.target.value === "ALL" ? "" : e.target.value)}
          >
            <option value="ALL">Encaminhamento</option>
            {formOptions.referrals.map((r) => (
              <option key={r.id} value={r.id}>
                {r.protocol}
              </option>
            ))}
          </select>
          <Input
            type="date"
            className="referral-filter-select h-10"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title="Período — início"
          />
          <Input
            type="date"
            className="referral-filter-select h-10"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            title="Período — fim"
          />
          <select
            className="referral-filter-select"
            value={validity || "ALL"}
            onChange={(e) => setValidity(e.target.value === "ALL" ? "" : e.target.value)}
          >
            <option value="ALL">Validade</option>
            <option value="em_dia">Em dia</option>
            <option value="a_vencer">A vencer (30 dias)</option>
            <option value="vencido">Vencido</option>
          </select>
          <select
            className="referral-filter-select"
            value={sensitive || "ALL"}
            onChange={(e) => setSensitive(e.target.value === "ALL" ? "" : e.target.value)}
          >
            <option value="ALL">Documento sensível</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
          <select
            className="referral-filter-select"
            value={sort || "createdAt"}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="createdAt">Ordenar: Data</option>
            <option value="validUntil">Ordenar: Validade</option>
            <option value="status">Ordenar: Status</option>
            <option value="company">Ordenar: Empresa</option>
          </select>
        </div>
        <div className="referral-filters-actions">
          <Button variant="brand" onClick={handleSearch} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Filtrar
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>
      </div>

      {empty ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <FolderOpen className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-800">Nenhum documento cadastrado</h3>
          <p className="mt-2 text-sm text-slate-500">
            Anexe documentos ocupacionais, ASOs, laudos e arquivos vinculados às empresas e
            colaboradores.
          </p>
          {canManage && (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={() => openForm(true)}>
                <Paperclip className="mr-2 h-4 w-4" /> Anexar arquivo
              </Button>
              <Button variant="brand" onClick={() => openForm(false)}>
                <Plus className="mr-2 h-4 w-4" /> Novo documento
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="relative mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          {isPending && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60">
              <Loader2 className="h-6 w-6 animate-spin text-[#16A085]" />
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                <TableHead className="hidden lg:table-cell">Vínculo</TableHead>
                <TableHead className="hidden sm:table-cell">Empresa</TableHead>
                <TableHead className="hidden xl:table-cell">Colaborador</TableHead>
                <TableHead className="hidden lg:table-cell">Protocolo</TableHead>
                <TableHead className="hidden sm:table-cell">Data</TableHead>
                <TableHead className="hidden md:table-cell">Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-slate-500">
                    Nenhum documento encontrado com os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                initialItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-slate-50/80"
                    onClick={() => openDetail(item.id)}
                  >
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-slate-900">{item.title}</div>
                          {item.fileName ? (
                            <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                              {item.fileName}
                            </div>
                          ) : (
                            <div className="mt-0.5 text-xs text-amber-600">Sem arquivo</div>
                          )}
                        </div>
                        {item.sensitive && (
                          <span title="Sensível">
                            <Shield className="h-4 w-4 shrink-0 text-violet-500" aria-hidden />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="rounded-full font-normal">
                        {DOCUMENT_TYPE_LABELS[item.type] ?? item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-slate-600">
                      {item.linkLabel}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-slate-600">
                      {item.companyName ?? "—"}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-slate-600">
                      {item.patientName ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm font-mono text-slate-500">
                      {item.protocol ?? "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-slate-600">
                      {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.validUntil ? (
                        <div>
                          <div className="text-sm text-slate-600">
                            {format(new Date(item.validUntil), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                          <ValidityIndicator label={item.validityLabel} />
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={normalizeDocumentStatus(item.status)}
                        type="document"
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetail(item.id)}>
                            <Eye className="mr-2 h-4 w-4" /> Ver detalhes
                          </DropdownMenuItem>
                          {item.hasFile && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(`/api/documents/${item.id}/file`, "_blank")
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" /> Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  window.location.href = `/api/documents/${item.id}/file?action=download`;
                                }}
                              >
                                <Download className="mr-2 h-4 w-4" /> Baixar
                              </DropdownMenuItem>
                            </>
                          )}
                          {canManage && (
                            <>
                              <DropdownMenuItem onClick={() => openEdit(item.id)}>
                                <Upload className="mr-2 h-4 w-4" /> Anexar/Substituir
                              </DropdownMenuItem>
                              {item.status === "DISPONIVEL" && (
                                <DropdownMenuItem onClick={() => openWhatsApp(item)}>
                                  <MessageCircle className="mr-2 h-4 w-4" /> Enviar WhatsApp
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <RefreshCw className="mr-2 h-4 w-4" /> Alterar status
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {STATUS_ACTIONS.map((s) => (
                                    <DropdownMenuItem
                                      key={s}
                                      onClick={() => handleStatusChange(item, s)}
                                      disabled={actionLoading === item.id}
                                    >
                                      {DOCUMENT_STATUS_LABELS[s]}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuItem
                                onClick={() => handleArchive(item)}
                                disabled={actionLoading === item.id}
                              >
                                <Archive className="mr-2 h-4 w-4" /> Arquivar
                              </DropdownMenuItem>
                              {item.hasFile && (
                                <DropdownMenuItem
                                  onClick={() => handleRemoveFile(item)}
                                  disabled={actionLoading === item.id}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Remover arquivo
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeleteTarget(item)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Remover documento
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <p className="text-sm text-slate-500">
                {initialTotal} documento{initialTotal !== 1 ? "s" : ""} · Página {initialPage} de{" "}
                {totalPages}
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
      )}

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalhe do documento</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {detailLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#16A085]" />
              </div>
            ) : detailDoc ? (
              <>
                <DocumentDetailContent document={detailDoc} />
                <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
                  {detailDoc.hasFile && (
                    <>
                      <a
                        href={`/api/documents/${detailDoc.id}/file`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        <Eye className="mr-2 h-4 w-4" /> Visualizar
                      </a>
                      <a
                        href={`/api/documents/${detailDoc.id}/file?action=download`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        <Download className="mr-2 h-4 w-4" /> Baixar
                      </a>
                    </>
                  )}
                  {canManage && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => openEdit(detailDoc.id)}>
                        <Upload className="mr-2 h-4 w-4" /> Substituir arquivo
                      </Button>
                      {detailDoc.status === "DISPONIVEL" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openWhatsApp({
                              id: detailDoc.id,
                              title: detailDoc.title,
                              type: detailDoc.type,
                              companyName: detailDoc.companyName,
                              patientName: detailDoc.patientName,
                              protocol: detailDoc.protocol,
                              fileName: detailDoc.fileName,
                              linkLabel: detailDoc.linkLabel,
                              createdAt: detailDoc.createdAt,
                              validUntil: detailDoc.validUntil,
                              validityLabel: detailDoc.validityLabel,
                              status: detailDoc.status,
                              sensitive: detailDoc.sensitive,
                              hasFile: detailDoc.hasFile,
                            })
                          }
                        >
                          <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      {canManage && (
        <DocumentFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          document={editDoc}
          formOptions={formOptions}
          attachOnly={attachMode}
          onSuccess={(id) => {
            router.refresh();
            if (id) openDetail(id);
          }}
        />
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover documento?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O registro e o arquivo serão excluídos
              permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!!actionLoading}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
