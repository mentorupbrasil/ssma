"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Search,
  MoreHorizontal,
  Eye,
  MessageCircle,
  ArrowRightCircle,
  RefreshCw,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Plus,
} from "lucide-react";
import type { PreReferralStatus } from "@prisma/client";
import type { PreReferralListItem, PreReferralDetailSerialized } from "@/lib/pre-referrals";
import {
  PRE_REFERRAL_STAT_CARDS,
  PRE_REFERRAL_STATUS_TABS,
  PRE_REFERRAL_SOURCE_LABELS,
  buildPreReferralWhatsAppMessage,
  getMissingPreReferralFields,
} from "@/lib/pre-referrals";
import { PRE_REFERRAL_CLINICAL_EXAM_LABELS } from "@/types";
import {
  getPreReferralDetail,
  logPreReferralWhatsApp,
  updatePreReferralStatusWithNotes,
} from "@/actions/pre-referrals";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTable } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPhone } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { PreReferralDetailContent } from "./PreReferralDetailContent";
import {
  PreReferralStatusDialog,
  PreReferralNoteDialog,
  PreReferralConvertDialog,
} from "./PreReferralDialogs";

type Props = {
  items: PreReferralListItem[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts: Partial<Record<PreReferralStatus, number>>;
  dbReady: boolean;
  loadError?: string;
  filters: {
    q?: string;
    status?: string;
    queue?: string;
    dateFrom?: string;
    dateTo?: string;
    clinicalExamType?: string;
    source?: string;
  };
};

export function PreEncaminhamentosClient(props: Props) {
  const {
    items,
    total,
    page,
    pageSize,
    statusCounts,
    dbReady,
    loadError,
    filters,
  } = props;

  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(filters.q ?? "");
  const [statusFilter, setStatusFilter] = useState(filters.status ?? "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");
  const [clinicalExamType, setClinicalExamType] = useState(filters.clinicalExamType ?? "");
  const [source, setSource] = useState(filters.source ?? "");

  const activeTab = filters.queue === "active" ? "QUEUE" : filters.status ?? "ALL";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PreReferralDetailSerialized | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "ALL") params.delete(key);
        else params.set(key, value);
      });
      if (!updates.page) params.delete("page");
      if (updates.status) params.delete("queue");
      if (updates.queue) params.delete("status");
      startTransition(() => router.push(`/dashboard/pre-encaminhamentos?${params.toString()}`));
    },
    [router, searchParams]
  );

  const handleSearch = () => {
    updateFilters({
      q,
      status: statusFilter || undefined,
      dateFrom,
      dateTo,
      clinicalExamType,
      source,
    });
  };

  const clearFilters = () => {
    setQ("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setClinicalExamType("");
    setSource("");
    startTransition(() => router.push("/dashboard/pre-encaminhamentos"));
  };

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    const result = await getPreReferralDetail(id);
    setDetailLoading(false);
    if (result.success) setDetail(result.request);
    else {
      setDetailError(result.error);
      setDetail(null);
    }
  }, []);

  const openDetail = (id: string) => {
    setSelectedId(id);
    loadDetail(id);
  };

  const refreshDetail = () => {
    if (selectedId) loadDetail(selectedId);
    router.refresh();
  };

  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    if (idFromUrl && idFromUrl !== selectedId) openDetail(idFromUrl);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const getWhatsAppUrl = (item: PreReferralListItem) => {
    const message = buildPreReferralWhatsAppMessage({
      protocol: item.protocol,
      companyName: item.companyName,
      employeeName: item.employeeName,
      clinicalExamType: item.clinicalExamType as never,
      missingFields: getMissingPreReferralFields(item),
    });
    return `https://wa.me/55${item.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  };

  const handleWhatsApp = async (item: PreReferralListItem) => {
    await logPreReferralWhatsApp(item.id);
    window.open(getWhatsAppUrl(item), "_blank", "noopener,noreferrer");
    router.refresh();
  };

  return (
    <div className="referrals-module">
      <PageHeader
        title="Pré-encaminhamentos"
        description="Solicitações rápidas do site — leads para análise e conversão em encaminhamento oficial"
      >
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/encaminhamentos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Encaminhamentos
            </Button>
          </Link>
          <Link href="/dashboard/encaminhamentos/novo">
            <Button variant="brand" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Criar encaminhamento manual
            </Button>
          </Link>
        </div>
      </PageHeader>

      {!dbReady && (
        <div className="referral-db-warning">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-900">
            Banco pendente de atualização. Execute o deploy ou{" "}
            <code className="rounded bg-amber-100 px-1">npx prisma migrate deploy</code>.
          </p>
        </div>
      )}

      {loadError && (
        <div className="referral-error-state dashboard-surface">
          <p className="font-medium text-slate-700">{loadError}</p>
        </div>
      )}

      {dbReady && !loadError && (
        <>
          <div className="referral-stat-grid referral-stat-grid-5">
            {PRE_REFERRAL_STAT_CARDS.map((card) => (
              <button
                key={card.status}
                type="button"
                className={cn(
                  "referral-stat-card",
                  activeTab === card.status && "referral-stat-card-active"
                )}
                onClick={() => updateFilters({ status: card.status, queue: undefined })}
              >
                <span className="referral-stat-count">{statusCounts[card.status] ?? 0}</span>
                <span className="referral-stat-label">{card.label}</span>
              </button>
            ))}
          </div>

          <div className="referral-tabs">
            {PRE_REFERRAL_STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={cn("referral-tab", activeTab === tab.value && "referral-tab-active")}
                onClick={() =>
                  updateFilters({
                    status: tab.value === "ALL" || tab.value === "QUEUE" ? undefined : tab.value,
                    queue: tab.value === "QUEUE" ? "active" : undefined,
                  })
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="referral-filters dashboard-surface">
            <div className="referral-filters-grid referral-filters-grid-pre-ext">
              <div className="relative col-span-full lg:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-9"
                  placeholder="Buscar por protocolo, empresa, responsável, colaborador, telefone ou CPF"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Status</Label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="referral-select w-full"
                >
                  <option value="">Todos</option>
                  {PRE_REFERRAL_STAT_CARDS.map((c) => (
                    <option key={c.status} value={c.status}>{c.label}</option>
                  ))}
                  <option value="DUPLICADO">Duplicado</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Tipo de exame</Label>
                <select
                  value={clinicalExamType}
                  onChange={(e) => setClinicalExamType(e.target.value)}
                  className="referral-select w-full"
                >
                  <option value="">Todos</option>
                  {Object.entries(PRE_REFERRAL_CLINICAL_EXAM_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Origem</Label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="referral-select w-full"
                >
                  <option value="">Todas</option>
                  {Object.entries(PRE_REFERRAL_SOURCE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Data inicial</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="referral-date-input w-full" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Data final</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="referral-date-input w-full" />
              </div>
            </div>
            <div className="referral-filters-actions">
              <Button variant="brand" size="sm" onClick={handleSearch} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Filtrar"}
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters}>Limpar filtros</Button>
            </div>
          </div>

          <DataTable className={cn(isPending && "opacity-60")}>
            {items.length === 0 ? (
              <EmptyState
                compact
                className="border-0 bg-transparent"
                title="Nenhum pré-encaminhamento encontrado"
                description="As solicitações enviadas pelo formulário público aparecerão aqui para análise e conversão em encaminhamento oficial."
                secondaryAction={{
                  label: "Ver formulário público",
                  href: "/encaminhamento-online",
                  variant: "outline",
                }}
                action={{
                  label: "Criar encaminhamento manual",
                  href: "/dashboard/encaminhamentos/novo",
                }}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead className="hidden md:table-cell">Responsável</TableHead>
                    <TableHead className="hidden sm:table-cell">WhatsApp</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead className="hidden lg:table-cell">Tipo de exame</TableHead>
                    <TableHead className="hidden sm:table-cell">Solicitação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.id}
                      className="referral-table-row cursor-pointer"
                      onClick={() => openDetail(item.id)}
                    >
                      <TableCell className="font-semibold text-[var(--brand-green)]">{item.protocol}</TableCell>
                      <TableCell>{item.companyName}</TableCell>
                      <TableCell className="hidden md:table-cell">{item.responsibleName}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatPhone(item.whatsapp)}</TableCell>
                      <TableCell>{item.employeeName}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {PRE_REFERRAL_CLINICAL_EXAM_LABELS[item.clinicalExamType as keyof typeof PRE_REFERRAL_CLINICAL_EXAM_LABELS]}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell><StatusBadge status={item.status} type="preReferral" /></TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" aria-label="Ações">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetail(item.id)}>
                              <Eye className="mr-2 h-4 w-4" /> Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleWhatsApp(item)}>
                              <MessageCircle className="mr-2 h-4 w-4" /> Falar no WhatsApp
                            </DropdownMenuItem>
                            {item.status === "NOVO" && (
                              <DropdownMenuItem
                                onClick={async () => {
                                  await updatePreReferralStatusWithNotes(item.id, "EM_ANALISE");
                                  router.refresh();
                                }}
                              >
                                <RefreshCw className="mr-2 h-4 w-4" /> Marcar em análise
                              </DropdownMenuItem>
                            )}
                            {item.status !== "CONVERTIDO" && item.status !== "CANCELADO" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    openDetail(item.id);
                                    setConvertDialogOpen(true);
                                  }}
                                >
                                  <ArrowRightCircle className="mr-2 h-4 w-4" /> Converter
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    if (!confirm("Cancelar esta solicitação?")) return;
                                    await updatePreReferralStatusWithNotes(item.id, "CANCELADO", "Cancelado pela equipe");
                                    router.refresh();
                                  }}
                                >
                                  <XCircle className="mr-2 h-4 w-4" /> Cancelar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DataTable>

          {total > pageSize && (
            <div className="referral-pagination">
              <p className="text-sm text-slate-500">
                {total} registro{total !== 1 ? "s" : ""} · Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1 || isPending} onClick={() => updateFilters({ page: String(page - 1) })}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages || isPending} onClick={() => updateFilters({ page: String(page + 1) })}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="referral-detail-sheet w-full overflow-y-auto sm:max-w-2xl lg:max-w-3xl">
          <SheetHeader className="border-b pb-4">
            <SheetTitle>{detail?.protocol ?? "Pré-encaminhamento"}</SheetTitle>
            <SheetDescription>
              {detail ? `${detail.companyName} · ${detail.employeeName}` : "Carregando..."}
            </SheetDescription>
          </SheetHeader>
          {detailLoading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-green)]" />
            </div>
          )}
          {detailError && (
            <div className="referral-error-state">
              <p>{detailError}</p>
            </div>
          )}
          {detail && !detailLoading && (
            <PreReferralDetailContent
              item={detail}
              canManage
              onRefresh={refreshDetail}
              onOpenStatus={() => setStatusDialogOpen(true)}
              onOpenNote={() => setNoteDialogOpen(true)}
              onOpenConvert={() => setConvertDialogOpen(true)}
            />
          )}
        </SheetContent>
      </Sheet>

      {selectedId && detail && (
        <>
          <PreReferralStatusDialog
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            preReferralId={selectedId}
            currentStatus={detail.status}
            onSuccess={refreshDetail}
          />
          <PreReferralNoteDialog
            open={noteDialogOpen}
            onOpenChange={setNoteDialogOpen}
            preReferralId={selectedId}
            onSuccess={refreshDetail}
          />
          <PreReferralConvertDialog
            open={convertDialogOpen}
            onOpenChange={setConvertDialogOpen}
            preReferralId={selectedId}
            onSuccess={(referralId) => {
              refreshDetail();
              router.push(`/dashboard/encaminhamentos?id=${referralId}`);
            }}
          />
        </>
      )}
    </div>
  );
}
