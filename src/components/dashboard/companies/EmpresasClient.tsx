"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  FileText,
  DollarSign,
  MessageCircle,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import type { CompanyListItem } from "@/lib/companies";
import {
  COMPANY_STAT_CARDS,
  COMPANY_DOCUMENT_SUMMARY_LABELS,
  buildCompanyWhatsAppMessage,
} from "@/lib/companies";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTable } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { LoadingState } from "@/components/ui/loading-state";
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
import { NewCompanyDialog } from "./CompanyDialogs";
import { formatCNPJ, formatPhone } from "@/lib/helpers";
import { cn } from "@/lib/utils";

type EmpresasClientProps = {
  initialItems: CompanyListItem[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  statCounts: Record<string, number>;
  cities: string[];
  canManage: boolean;
  canCommercial: boolean;
  filters: {
    q?: string;
    status?: string;
    city?: string;
    size?: string;
    contractType?: string;
    pending?: string;
    dateFrom?: string;
    dateTo?: string;
  };
};

export function EmpresasClient({
  initialItems,
  initialTotal,
  initialPage,
  pageSize,
  statCounts,
  cities,
  canManage,
  canCommercial,
  filters,
}: EmpresasClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(filters.q ?? "");
  const [city, setCity] = useState(filters.city ?? "");
  const [size, setSize] = useState(filters.size ?? "");
  const [contractType, setContractType] = useState(filters.contractType ?? "");
  const [pending, setPending] = useState(filters.pending ?? "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  const activeStatus = filters.status ?? "ALL";
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
        router.push(`/dashboard/empresas?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handleSearch = () => {
    updateFilters({
      q,
      city,
      size,
      contractType,
      pending,
      dateFrom,
      dateTo,
      status: activeStatus,
    });
  };

  const clearFilters = () => {
    setQ("");
    setCity("");
    setSize("");
    setContractType("");
    setPending("");
    setDateFrom("");
    setDateTo("");
    startTransition(() => router.push("/dashboard/empresas"));
  };

  useEffect(() => {
    if (searchParams.get("new") === "1" && canManage) {
      setNewDialogOpen(true);
    }
  }, [searchParams, canManage]);

  const getWhatsAppUrl = (item: CompanyListItem) => {
    const phone = item.whatsapp;
    if (!phone) return null;
    const name = item.tradeName ?? item.legalName;
    const message = buildCompanyWhatsAppMessage(name);
    return `https://wa.me/55${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  };

  const docSummaryBadge = (summary: CompanyListItem["documentSummary"]) => {
    const label = COMPANY_DOCUMENT_SUMMARY_LABELS[summary];
    const statusMap = {
      EM_DIA: "EM_DIA",
      PENDENTE: "PENDENTE",
      VENCIDO: "VENCIDO",
      NONE: "ARQUIVADO",
    } as const;
    return <StatusBadge status={statusMap[summary]} type="document" />;
  };

  return (
    <div className="referrals-module">
      <PageHeader title="Empresas" description="Gestão de empresas clientes">
        {canManage && (
          <Button variant="brand" onClick={() => setNewDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova empresa
          </Button>
        )}
      </PageHeader>

      <div className="referral-stat-grid referral-stat-grid-5">
        {COMPANY_STAT_CARDS.map((card) => {
          const isActive = activeStatus === card.filter;
          return (
            <button
              key={card.key}
              type="button"
              className={cn("referral-stat-card text-left", isActive && "referral-stat-card-active")}
              onClick={() =>
                updateFilters({ status: isActive ? "ALL" : card.filter })
              }
            >
              <span className="referral-stat-count">{statCounts[card.key] ?? 0}</span>
              <span className="referral-stat-label">{card.label}</span>
            </button>
          );
        })}
      </div>

      <FilterBar
        className="mt-6"
        onSearch={handleSearch}
        onClear={clearFilters}
        isPending={isPending}
      >
        <div className="referral-filter-search sm:col-span-2">
            <Search className="referral-filter-search-icon h-4 w-4" />
            <Input
              placeholder="Buscar por razão social, nome fantasia, CNPJ, responsável ou telefone"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <select
            value={activeStatus === "ALL" ? "" : activeStatus}
            onChange={(e) => updateFilters({ status: e.target.value || "ALL" })}
            className="form-select h-9"
          >
            <option value="">Status</option>
            <option value="ATIVA">Ativa</option>
            <option value="INATIVA">Inativa</option>
            <option value="PENDENTE">Pendente</option>
            <option value="BLOQUEADA">Bloqueada</option>
          </select>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="form-select h-9">
            <option value="">Cidade</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={size} onChange={(e) => setSize(e.target.value)} className="form-select h-9">
            <option value="">Porte</option>
            <option value="PEQUENA">Pequena</option>
            <option value="MEDIA">Média</option>
            <option value="GRANDE">Grande</option>
          </select>
          <select
            value={contractType}
            onChange={(e) => setContractType(e.target.value)}
            className="form-select h-9"
          >
            <option value="">Tipo de contrato</option>
            <option value="AVULSO">Avulso</option>
            <option value="MENSAL">Mensal</option>
            <option value="ANUAL">Anual</option>
            <option value="EM_NEGOCIACAO">Em negociação</option>
          </select>
          <select
            value={pending}
            onChange={(e) => setPending(e.target.value)}
            className="form-select h-9"
          >
            <option value="">Possui pendência</option>
            <option value="true">Sim</option>
          </select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="Cadastro de" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="Cadastro até" />
      </FilterBar>

      <div className="relative mt-6">
        {isPending && <LoadingState overlay label="Atualizando empresas..." />}

        {initialItems.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhuma empresa cadastrada"
            description="Cadastre a primeira empresa para iniciar encaminhamentos, documentos e portal empresarial."
            action={
              canManage
                ? { label: "Nova empresa", onClick: () => setNewDialogOpen(true) }
                : undefined
            }
          />
        ) : (
          <DataTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="hidden md:table-cell">WhatsApp</TableHead>
                  <TableHead className="hidden lg:table-cell">Cidade/UF</TableHead>
                  <TableHead>Colaboradores</TableHead>
                  <TableHead className="hidden sm:table-cell">Encaminh.</TableHead>
                  <TableHead className="hidden md:table-cell">Documentos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialItems.map((c) => {
                  const waUrl = getWhatsAppUrl(c);
                  return (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => router.push(`/dashboard/empresas/${c.id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-[#0F3D4A]">{c.legalName}</p>
                          {c.tradeName && (
                            <p className="text-xs text-slate-500">{c.tradeName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatCNPJ(c.cnpj)}</TableCell>
                      <TableCell className="text-sm">{c.responsibleName ?? "—"}</TableCell>
                      <TableCell className="hidden text-sm md:table-cell">
                        {c.whatsapp ? formatPhone(c.whatsapp) : "—"}
                      </TableCell>
                      <TableCell className="hidden text-sm lg:table-cell">
                        {[c.city, c.state].filter(Boolean).join("/") || "—"}
                      </TableCell>
                      <TableCell className="text-center">{c.employeeCount}</TableCell>
                      <TableCell className="hidden text-center sm:table-cell">
                        {c.openReferrals > 0 ? (
                          <span className="font-medium text-amber-700">{c.openReferrals}</span>
                        ) : (
                          c.referralCount
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {docSummaryBadge(c.documentSummary)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} type="company" />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/empresas/${c.id}`)}>
                              <Eye className="mr-2 h-4 w-4" /> Ver detalhes
                            </DropdownMenuItem>
                            {canManage && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/dashboard/encaminhamentos/novo?companyId=${c.id}`)
                                  }
                                >
                                  <FileText className="mr-2 h-4 w-4" /> Novo encaminhamento
                                </DropdownMenuItem>
                                {canCommercial && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(`/dashboard/orcamentos?companyId=${c.id}`)
                                    }
                                  >
                                    <DollarSign className="mr-2 h-4 w-4" /> Novo orçamento
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            {waUrl && (
                              <DropdownMenuItem
                                onClick={() => window.open(waUrl, "_blank", "noopener,noreferrer")}
                              >
                                <MessageCircle className="mr-2 h-4 w-4" /> Abrir WhatsApp
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/dashboard/empresas/${c.id}?tab=portal`)
                              }
                            >
                              <ExternalLink className="mr-2 h-4 w-4" /> Portal da empresa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DataTable>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={initialPage <= 1}
              onClick={() => updateFilters({ page: String(initialPage - 1), status: activeStatus })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-500">
              Página {initialPage} de {totalPages} ({initialTotal} empresas)
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={initialPage >= totalPages}
              onClick={() => updateFilters({ page: String(initialPage + 1), status: activeStatus })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <NewCompanyDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        onSuccess={(id) => {
          router.push(`/dashboard/empresas/${id}`);
          router.refresh();
        }}
      />
    </div>
  );
}
