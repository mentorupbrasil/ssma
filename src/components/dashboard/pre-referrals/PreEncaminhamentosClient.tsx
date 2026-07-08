"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Search,
  MoreHorizontal,
  Eye,
  ArrowRightCircle,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import type { PreReferralStatus } from "@prisma/client";
import type { PreReferralListItem } from "@/lib/pre-referrals";
import {
  PRE_REFERRAL_STAT_CARDS,
  PRE_REFERRAL_STATUS_TABS,
} from "@/lib/pre-referrals";
import { PRE_REFERRAL_CLINICAL_EXAM_LABELS } from "@/types";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable } from "@/components/dashboard/DataTable";
import { PreReferralStatusForm } from "@/components/dashboard/PreReferralStatusForm";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPhone } from "@/lib/helpers";
import { cn } from "@/lib/utils";

type PreEncaminhamentosClientProps = {
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
    dateFrom?: string;
    dateTo?: string;
  };
};

export function PreEncaminhamentosClient({
  items,
  total,
  page,
  pageSize,
  statusCounts,
  dbReady,
  loadError,
  filters,
}: PreEncaminhamentosClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(filters.q ?? "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");
  const activeStatus = filters.status ?? "ALL";
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "ALL") params.delete(key);
        else params.set(key, value);
      });
      if (!updates.page) params.delete("page");
      startTransition(() => {
        router.push(`/dashboard/pre-encaminhamentos?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handleSearch = () => {
    updateFilters({ q, dateFrom, dateTo, status: activeStatus });
  };

  const clearFilters = () => {
    setQ("");
    setDateFrom("");
    setDateTo("");
    startTransition(() => router.push("/dashboard/pre-encaminhamentos"));
  };

  const getWhatsAppUrl = (item: PreReferralListItem) => {
    const digits = item.whatsapp.replace(/\D/g, "");
    if (!digits) return null;
    const message = `Olá! Sobre o pré-encaminhamento ${item.protocol}:\n\nEmpresa: ${item.companyName}\nColaborador: ${item.employeeName}\n\nRecebemos sua solicitação e em breve entraremos em contato.`;
    return `https://wa.me/55${digits}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="referrals-module">
      <PageHeader
        title="Pré-encaminhamentos"
        description="Solicitações rápidas do site — leads para análise e conversão em encaminhamento oficial"
      >
        <Link href="/dashboard/encaminhamentos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Encaminhamentos
          </Button>
        </Link>
      </PageHeader>

      {!dbReady && (
        <div className="referral-db-warning">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900">Banco de dados pendente de atualização</p>
            <p className="mt-1 text-sm text-amber-800">
              A tabela de pré-encaminhamentos ainda não existe no Neon. No próximo deploy, as
              migrations serão aplicadas automaticamente. Se o erro persistir, execute{" "}
              <code className="rounded bg-amber-100 px-1">npx prisma migrate deploy</code> com a{" "}
              <code className="rounded bg-amber-100 px-1">DATABASE_URL</code> de produção.
            </p>
          </div>
        </div>
      )}

      {loadError && (
        <div className="referral-error-state dashboard-surface">
          <p className="font-medium text-slate-700">{loadError}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => router.refresh()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {dbReady && !loadError && (
        <>
          <div className="referral-stat-grid referral-stat-grid-3">
            {PRE_REFERRAL_STAT_CARDS.map((card) => (
              <button
                key={card.status}
                type="button"
                className={cn(
                  "referral-stat-card",
                  activeStatus === card.status && "referral-stat-card-active"
                )}
                onClick={() => updateFilters({ status: card.status })}
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
                className={cn(
                  "referral-tab",
                  activeStatus === tab.value && "referral-tab-active"
                )}
                onClick={() =>
                  updateFilters({ status: tab.value === "ALL" ? undefined : tab.value })
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="referral-filters dashboard-surface">
            <div className="referral-filters-grid referral-filters-grid-pre">
              <div className="relative col-span-full sm:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-9"
                  placeholder="Buscar por protocolo, empresa, colaborador ou CPF"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
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
            </div>
            <div className="referral-filters-actions">
              <Button variant="brand" size="sm" onClick={handleSearch} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Filtrar"}
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>
          </div>

          <DataTable className={cn(isPending && "opacity-60")}>
            {items.length === 0 ? (
              <div className="referral-empty-state">
                <p className="font-medium text-slate-700">Nenhum pré-encaminhamento encontrado</p>
                <p className="text-sm text-slate-500">
                  Quando empresas enviarem pelo formulário público, aparecerão aqui.
                </p>
                <Link href="/encaminhamento-online" className="mt-4">
                  <Button variant="outline" size="sm">
                    Ver formulário público
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead className="hidden md:table-cell">Função</TableHead>
                    <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                    <TableHead className="hidden sm:table-cell">WhatsApp</TableHead>
                    <TableHead className="hidden sm:table-cell">Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const waUrl = getWhatsAppUrl(item);
                    return (
                      <TableRow
                        key={item.id}
                        className="referral-table-row cursor-pointer"
                        onClick={() =>
                          router.push(`/dashboard/pre-encaminhamentos/${item.id}`)
                        }
                      >
                        <TableCell className="font-semibold text-[var(--brand-green)]">
                          {item.protocol}
                        </TableCell>
                        <TableCell>{item.companyName}</TableCell>
                        <TableCell>{item.employeeName}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {item.employeeRole}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {
                            PRE_REFERRAL_CLINICAL_EXAM_LABELS[
                              item.clinicalExamType as keyof typeof PRE_REFERRAL_CLINICAL_EXAM_LABELS
                            ]
                          }
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {formatPhone(item.whatsapp)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <PreReferralStatusForm
                            requestId={item.id}
                            currentStatus={item.status}
                          />
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
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/pre-encaminhamentos/${item.id}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalhes
                              </DropdownMenuItem>
                              {item.status !== "CONVERTIDO" && item.status !== "CANCELADO" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/dashboard/pre-encaminhamentos/${item.id}`)
                                  }
                                >
                                  <ArrowRightCircle className="mr-2 h-4 w-4" />
                                  Converter
                                </DropdownMenuItem>
                              )}
                              {waUrl && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    window.open(waUrl, "_blank", "noopener,noreferrer")
                                  }
                                >
                                  <MessageCircle className="mr-2 h-4 w-4" />
                                  WhatsApp
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
            )}
          </DataTable>

          {total > pageSize && (
            <div className="referral-pagination">
              <p className="text-sm text-slate-500">
                {total} registro{total !== 1 ? "s" : ""} · Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isPending}
                  onClick={() => updateFilters({ page: String(page - 1) })}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isPending}
                  onClick={() => updateFilters({ page: String(page + 1) })}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
