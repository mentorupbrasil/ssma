"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Calendar,
  RefreshCw,
  MessageCircle,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
} from "lucide-react";
import type { ReferralStatus } from "@prisma/client";
import type { ReferralListItem, ReferralDetailSerialized } from "@/lib/referrals";
import {
  REFERRAL_STAT_CARDS,
  buildReferralWhatsAppMessage,
} from "@/lib/referrals";
import { CLINICAL_EXAM_LABELS } from "@/types";
import { getReferralDetail } from "@/actions/referrals";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PageModule } from "@/components/dashboard/PageModule";
import { FilterMetricGrid } from "@/components/dashboard/FilterMetricGrid";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTable } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { MobileListCard } from "@/components/dashboard/MobileListCard";
import { buildFilterChips, removeFilterKey } from "@/lib/filter-chips-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ReferralDetailContent } from "./ReferralDetailContent";
import {
  ReferralStatusDialog,
  ReferralScheduleDialog,
  ReferralDocumentDialog,
} from "./ReferralActionDialogs";
import { referralStatCardsForEmpresa, empresaReferralStatusLabel, empresaReferralCardLabel } from "@/lib/empresa-portal";
import { cn } from "@/lib/utils";

type CompanyOption = { id: string; name: string };

type EncaminhamentosClientProps = {
  initialItems: ReferralListItem[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  statusCounts: Record<string, number>;
  companies: CompanyOption[];
  isEmpresa: boolean;
  canManage: boolean;
  embedded?: boolean;
  listPath?: string;
  filters: {
    q?: string;
    status?: string;
    companyId?: string;
    clinicalExamType?: string;
    dateFrom?: string;
    dateTo?: string;
  };
};

export function EncaminhamentosClient({
  initialItems,
  initialTotal,
  initialPage,
  pageSize,
  statusCounts,
  companies,
  isEmpresa,
  canManage,
  embedded = false,
  listPath: listPathProp,
  filters,
}: EncaminhamentosClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const listPath = listPathProp ?? "/dashboard/encaminhamentos";
  const statCards = isEmpresa ? referralStatCardsForEmpresa() : REFERRAL_STAT_CARDS;

  const [q, setQ] = useState(filters.q ?? "");
  const [companyId, setCompanyId] = useState(filters.companyId ?? "");
  const [clinicalExamType, setClinicalExamType] = useState(filters.clinicalExamType ?? "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");

  const activeStatus = filters.status ?? "ALL";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReferralDetailSerialized | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(initialTotal / pageSize));

  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "ALL") params.delete(key);
        else params.set(key, value);
      });
      if (!updates.page) params.delete("page");
      params.delete("tab");
      startTransition(() => {
        router.push(`${listPath}?${params.toString()}`);
      });
    },
    [router, searchParams, listPath]
  );

  const handleSearch = () => {
    updateFilters({ q, companyId, clinicalExamType, dateFrom, dateTo, status: activeStatus });
  };

  const clearFilters = () => {
    setQ("");
    setCompanyId("");
    setClinicalExamType("");
    setDateFrom("");
    setDateTo("");
    startTransition(() => {
      router.push(listPath);
    });
  };

  const activeChips = useMemo(
    () =>
      buildFilterChips([
        { key: "q", value: filters.q, label: (v) => `Busca: ${v}` },
        { key: "status", value: filters.status, label: (v) => `Status: ${isEmpresa ? empresaReferralCardLabel(v) : v}`, skip: (v) => v === "ALL" },
        { key: "companyId", value: filters.companyId, label: (v) => `Empresa: ${companies.find((c) => c.id === v)?.name ?? v}` },
        { key: "clinicalExamType", value: filters.clinicalExamType, label: (v) => `Exame: ${CLINICAL_EXAM_LABELS[v as keyof typeof CLINICAL_EXAM_LABELS] ?? v}` },
        { key: "dateFrom", value: filters.dateFrom, label: (v) => `De ${v}` },
        { key: "dateTo", value: filters.dateTo, label: (v) => `Até ${v}` },
      ]),
    [filters, companies, isEmpresa]
  );

  const removeChip = (key: string) => updateFilters(removeFilterKey(key, filters));

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    const result = await getReferralDetail(id);
    setDetailLoading(false);
    if (result.success) {
      setDetail(result.referral);
    } else {
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
    if (idFromUrl && idFromUrl !== selectedId) {
      openDetail(idFromUrl);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const getWhatsAppUrl = (item: ReferralListItem) => {
    const phone = item.companyWhatsapp ?? item.companyPhone;
    if (!phone) return null;
    const message = buildReferralWhatsAppMessage({
      protocol: item.protocol,
      companyName: item.companyName,
      employeeName: item.employeeName,
      clinicalExamType: item.clinicalExamType,
      status: item.status,
      scheduledAt: item.scheduledAt ? new Date(item.scheduledAt) : null,
    });
    return `https://wa.me/55${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  };

  const body = (
    <>
      {!embedded && (
        <PageHeader
          title="Encaminhamentos"
          description="Gestão de encaminhamentos do portal e solicitações internas"
        >
          <div className="flex flex-wrap gap-2">
            {!isEmpresa && (
              <Link href="/dashboard/pre-encaminhamentos">
                <Button variant="outline">Pré-encaminhamentos</Button>
              </Link>
            )}
            <Link href="/dashboard/encaminhamentos/novo">
              <Button variant="brand">
                <Plus className="mr-2 h-4 w-4" />
                Novo encaminhamento
              </Button>
            </Link>
          </div>
        </PageHeader>
      )}

      <FilterMetricGrid
        items={
          isEmpresa
            ? statCards.map((card) => {
                const isActive = filters.status === card.key;
                return {
                  key: card.key,
                  metaKey: `referral:${card.key}`,
                  label: card.label,
                  description: card.description,
                  value: statusCounts[card.key] ?? 0,
                  active: isActive,
                  onClick: () =>
                    updateFilters({ status: isActive ? undefined : card.key }),
                };
              })
            : statCards.map((card) => {
                const isActive = filters.status === card.status;
                return {
                  key: card.status,
                  metaKey: `referral:${card.status}`,
                  label: card.label,
                  value: statusCounts[card.status] ?? 0,
                  active: isActive,
                  onClick: () =>
                    updateFilters({ status: isActive ? undefined : card.status }),
                };
              })
        }
      />

      <FilterBar onSearch={handleSearch} onClear={clearFilters} isPending={isPending} activeChips={activeChips} onRemoveChip={removeChip} onClearChips={clearFilters}>
        <div className="relative col-span-full sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder={
                isEmpresa
                  ? "Buscar por protocolo ou colaborador"
                  : "Buscar por protocolo, empresa, colaborador ou CPF"
              }
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          {!isEmpresa && (
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="referral-select"
            >
              <option value="">Todas as empresas</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={clinicalExamType}
            onChange={(e) => setClinicalExamType(e.target.value)}
            className="referral-select"
          >
            <option value="">Todos os tipos de exame</option>
            {Object.entries(CLINICAL_EXAM_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="referral-date-input"
            aria-label="Data inicial"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="referral-date-input"
            aria-label="Data final"
          />
      </FilterBar>

      <DataTable className={cn(isPending && "opacity-60")}>
        {initialItems.length === 0 ? (
          <EmptyState
            compact
            className="border-0 bg-transparent"
            title="Nenhum encaminhamento encontrado"
            description={
              isEmpresa
                ? "Encaminhe colaboradores para a clínica ou ajuste os filtros."
                : "Crie um novo encaminhamento ou ajuste os filtros."
            }
            action={{
              label: isEmpresa ? "Agendar exames" : "Novo encaminhamento",
              href: "/dashboard/encaminhamentos/novo",
            }}
          />
        ) : (
          <>
          <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Protocolo</TableHead>
                {!isEmpresa && <TableHead>Empresa</TableHead>}
                <TableHead>Colaborador</TableHead>
                <TableHead className="hidden md:table-cell">Função</TableHead>
                <TableHead className="hidden lg:table-cell">Tipo de exame</TableHead>
                <TableHead className="hidden sm:table-cell">Solicitação</TableHead>
                {!isEmpresa && <TableHead className="hidden lg:table-cell">Agendamento</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead className="hidden xl:table-cell">Responsável</TableHead>
                <TableHead className="w-12">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialItems.map((item) => {
                const waUrl = getWhatsAppUrl(item);
                return (
                  <TableRow
                    key={item.id}
                    className="referral-table-row cursor-pointer"
                    onClick={() => openDetail(item.id)}
                  >
                    <TableCell className="font-semibold text-[var(--brand-green)]">
                      {item.protocol}
                    </TableCell>
                    {!isEmpresa && <TableCell>{item.companyName}</TableCell>}
                    <TableCell>{item.employeeName}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.jobTitle ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {CLINICAL_EXAM_LABELS[item.clinicalExamType]}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {format(new Date(item.requestedDate), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    {!isEmpresa && (
                      <TableCell className="hidden lg:table-cell">
                        {item.scheduledAt
                          ? format(new Date(item.scheduledAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : "Não agendado"}
                      </TableCell>
                    )}
                    <TableCell>
                      <StatusBadge
                        status={item.status}
                        type="referral"
                        label={
                          isEmpresa ? empresaReferralStatusLabel(item.status) : undefined
                        }
                      />
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {item.responsibleName ?? "—"}
                    </TableCell>
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
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalhes
                          </DropdownMenuItem>
                          {canManage && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  openDetail(item.id);
                                  setScheduleDialogOpen(true);
                                }}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                Agendar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  openDetail(item.id);
                                  setStatusDialogOpen(true);
                                }}
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Alterar status
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  openDetail(item.id);
                                  setDocumentDialogOpen(true);
                                }}
                              >
                                <Paperclip className="mr-2 h-4 w-4" />
                                Anexar documento
                              </DropdownMenuItem>
                            </>
                          )}
                          {waUrl && (
                            <DropdownMenuItem
                              onClick={() => window.open(waUrl, "_blank", "noopener,noreferrer")}
                            >
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Enviar WhatsApp
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
          <div className="grid gap-3 p-3 md:hidden">
            {initialItems.map((item) => (
              <MobileListCard
                key={item.id}
                icon={FileText}
                title={item.protocol}
                subtitle={
                  isEmpresa
                    ? item.employeeName
                    : `${item.employeeName} · ${item.companyName}`
                }
                meta={CLINICAL_EXAM_LABELS[item.clinicalExamType as keyof typeof CLINICAL_EXAM_LABELS] ?? item.clinicalExamType}
                badge={
                  <StatusBadge
                    status={item.status}
                    type="referral"
                    label={isEmpresa ? empresaReferralStatusLabel(item.status) : undefined}
                  />
                }
                onClick={() => openDetail(item.id)}
              />
            ))}
          </div>
          </>
        )}
      </DataTable>

      {initialTotal > pageSize && (
        <div className="referral-pagination">
          <p className="text-sm text-slate-500">
            {initialTotal} encaminhamento{initialTotal !== 1 ? "s" : ""} · Página {initialPage} de{" "}
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

      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent
          side="right"
          className="referral-detail-sheet w-full overflow-y-auto sm:max-w-2xl lg:max-w-3xl"
        >
          <SheetHeader className="border-b pb-4">
            <SheetTitle>{detail?.protocol ?? "Encaminhamento"}</SheetTitle>
            <SheetDescription>
              {detail
                ? `${detail.company.tradeName ?? detail.company.legalName} · ${detail.employee.fullName}`
                : "Carregando detalhes..."}
            </SheetDescription>
          </SheetHeader>

          {detailLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-green)]" />
            </div>
          )}

          {detailError && (
            <div className="referral-error-state">
              <p>{detailError}</p>
              <Button variant="outline" size="sm" onClick={() => selectedId && loadDetail(selectedId)}>
                Tentar novamente
              </Button>
            </div>
          )}

          {detail && !detailLoading && (
            <ReferralDetailContent
              referral={detail}
              canManage={canManage}
              onRefresh={refreshDetail}
              onOpenStatus={() => setStatusDialogOpen(true)}
              onOpenSchedule={() => setScheduleDialogOpen(true)}
              onOpenDocument={() => setDocumentDialogOpen(true)}
            />
          )}
        </SheetContent>
      </Sheet>

      {selectedId && detail && (
        <>
          <ReferralStatusDialog
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            referralId={selectedId}
            currentStatus={detail.status}
            onSuccess={refreshDetail}
          />
          <ReferralScheduleDialog
            open={scheduleDialogOpen}
            onOpenChange={setScheduleDialogOpen}
            referralId={selectedId}
            onSuccess={refreshDetail}
          />
          <ReferralDocumentDialog
            open={documentDialogOpen}
            onOpenChange={setDocumentDialogOpen}
            referralId={selectedId}
            onSuccess={refreshDetail}
          />
        </>
      )}
    </>
  );

  if (embedded) return body;

  return <PageModule>{body}</PageModule>;
}
