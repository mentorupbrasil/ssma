"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  FileText,
  Calendar,
  FolderOpen,
  Pencil,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import type { CollaboratorListItem } from "@/lib/collaborators";
import { COLLABORATOR_STAT_CARDS, getPeriodicExamBadge } from "@/lib/collaborators";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PageModule } from "@/components/dashboard/PageModule";
import { FilterMetricGrid } from "@/components/dashboard/FilterMetricGrid";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTable } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { DetailDrawer } from "@/components/dashboard/DetailDrawer";
import { MobileListCard } from "@/components/dashboard/MobileListCard";
import { CollaboratorDetailDrawerContent } from "./CollaboratorDetailDrawerContent";
import { getCollaboratorDetail } from "@/actions/collaborators";
import type { CollaboratorDetailSerialized } from "@/lib/collaborators";
import { buildFilterChips, removeFilterKey } from "@/lib/filter-chips-utils";
import { toast } from "sonner";
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
import { NewCollaboratorDialog } from "./CollaboratorDialogs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ColaboradoresClientProps = {
  initialItems: CollaboratorListItem[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  statCounts: Record<string, number>;
  companies: { id: string; name: string }[];
  canManage: boolean;
  filters: Record<string, string | undefined>;
};

export function ColaboradoresClient({
  initialItems,
  initialTotal,
  initialPage,
  pageSize,
  statCounts,
  companies,
  canManage,
  filters,
}: ColaboradoresClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(filters.q ?? "");
  const [companyId, setCompanyId] = useState(filters.companyId ?? "");
  const [jobTitle, setJobTitle] = useState(filters.jobTitle ?? "");
  const [department, setDepartment] = useState(filters.department ?? "");
  const [clinicalExamType, setClinicalExamType] = useState(filters.clinicalExamType ?? "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");
  const [periodicDue, setPeriodicDue] = useState(filters.periodicDue ?? "");
  const [docsPending, setDocsPending] = useState(filters.docsPending ?? "");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerCollaborator, setDrawerCollaborator] = useState<CollaboratorDetailSerialized | null>(null);

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
      startTransition(() => router.push(`/dashboard/colaboradores?${params.toString()}`));
    },
    [router, searchParams]
  );

  const handleSearch = () => {
    updateFilters({
      q,
      companyId,
      jobTitle,
      department,
      clinicalExamType,
      dateFrom,
      dateTo,
      periodicDue,
      docsPending,
      status: activeStatus,
    });
  };

  const clearFilters = () => {
    setQ("");
    setCompanyId("");
    setJobTitle("");
    setDepartment("");
    setClinicalExamType("");
    setDateFrom("");
    setDateTo("");
    setPeriodicDue("");
    setDocsPending("");
    startTransition(() => router.push("/dashboard/colaboradores"));
  };

  const activeChips = useMemo(
    () =>
      buildFilterChips([
        { key: "q", value: filters.q, label: (v) => `Busca: ${v}` },
        { key: "status", value: filters.status, label: (v) => `Status: ${v}`, skip: (v) => v === "ALL" },
        { key: "companyId", value: filters.companyId, label: (v) => `Empresa: ${companies.find((c) => c.id === v)?.name ?? v}` },
        { key: "jobTitle", value: filters.jobTitle, label: (v) => `Função: ${v}` },
        { key: "department", value: filters.department, label: (v) => `Setor: ${v}` },
        { key: "clinicalExamType", value: filters.clinicalExamType, label: (v) => `Exame: ${v}` },
        { key: "periodicDue", value: filters.periodicDue, label: () => "Periódico a vencer" },
        { key: "docsPending", value: filters.docsPending, label: () => "Docs pendentes" },
      ]),
    [filters, companies]
  );

  const removeChip = (key: string) => {
    const next = removeFilterKey(key, filters);
    updateFilters(next);
  };

  const openDetail = async (id: string) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerCollaborator(null);
    const result = await getCollaboratorDetail(id);
    setDrawerLoading(false);
    if (!result.success) {
      toast.error(result.error);
      setDrawerOpen(false);
      return;
    }
    setDrawerCollaborator(result.collaborator);
  };

  useEffect(() => {
    if (searchParams.get("new") === "1" && canManage) setNewDialogOpen(true);
  }, [searchParams, canManage]);

  return (
    <PageModule>
      <PageHeader
        title="Colaboradores"
        description="Colaboradores cadastrados e histórico ocupacional"
      >
        {canManage && (
          <Button variant="brand" onClick={() => setNewDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo colaborador
          </Button>
        )}
      </PageHeader>

      <FilterMetricGrid
        items={COLLABORATOR_STAT_CARDS.map((card) => {
          const isActive = activeStatus === card.filter;
          return {
            key: card.key,
            metaKey: `collaborator:${card.key}`,
            label: card.label,
            value: statCounts[card.key] ?? 0,
            active: isActive,
            onClick: () => updateFilters({ status: isActive ? "ALL" : card.filter }),
          };
        })}
      />

      <FilterBar
        onSearch={handleSearch}
        onClear={clearFilters}
        isPending={isPending}
        activeChips={activeChips}
        onRemoveChip={removeChip}
        onClearChips={clearFilters}
      >
        <div className="referral-filter-search sm:col-span-2">
            <Search className="referral-filter-search-icon h-4 w-4" />
            <Input
              placeholder="Buscar por nome, CPF, empresa, função ou protocolo"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="form-select h-9"
          >
            <option value="">Empresa</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={activeStatus === "ALL" ? "" : activeStatus}
            onChange={(e) => updateFilters({ status: e.target.value || "ALL" })}
            className="form-select h-9"
          >
            <option value="">Status</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
            <option value="AFASTADO">Afastado</option>
            <option value="DESLIGADO">Desligado</option>
            <option value="PENDENTE">Pendente</option>
          </select>
          <Input
            placeholder="Função"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="h-9"
          />
          <Input
            placeholder="Setor"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="h-9"
          />
          <select
            value={clinicalExamType}
            onChange={(e) => setClinicalExamType(e.target.value)}
            className="form-select h-9"
          >
            <option value="">Tipo de exame</option>
            <option value="ADMISSIONAL">Admissional</option>
            <option value="PERIODICO">Periódico</option>
            <option value="DEMISSIONAL">Demissional</option>
            <option value="RETORNO_TRABALHO">Retorno ao trabalho</option>
            <option value="MUDANCA_FUNCAO">Mudança de função</option>
          </select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="Cadastro de" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="Cadastro até" />
          <select
            value={periodicDue}
            onChange={(e) => setPeriodicDue(e.target.value)}
            className="form-select h-9"
          >
            <option value="">Próximo periódico</option>
            <option value="true">A vencer (30 dias)</option>
          </select>
          <select
            value={docsPending}
            onChange={(e) => setDocsPending(e.target.value)}
            className="form-select h-9"
          >
            <option value="">Documento pendente</option>
            <option value="true">Sim</option>
          </select>
      </FilterBar>

      <div className="relative mt-6">
        {isPending && <LoadingState overlay label="Atualizando colaboradores..." />}

        {initialItems.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum colaborador cadastrado"
            description="Cadastre colaboradores para criar encaminhamentos, agendamentos e documentos ocupacionais."
            action={
              canManage
                ? { label: "Novo colaborador", onClick: () => setNewDialogOpen(true) }
                : undefined
            }
            secondaryAction={{
              label: "Nova empresa",
              href: "/dashboard/empresas?new=1",
              variant: "outline",
            }}
          />
        ) : (
          <>
          <div className="hidden md:block">
          <DataTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="hidden md:table-cell">Função</TableHead>
                  <TableHead className="hidden lg:table-cell">Setor</TableHead>
                  <TableHead className="hidden sm:table-cell">Último exame</TableHead>
                  <TableHead className="hidden md:table-cell">Próx. periódico</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialItems.map((c) => {
                  const periodicBadge = getPeriodicExamBadge(c.nextPeriodicDate);
                  return (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => openDetail(c.id)}
                  >
                    <TableCell className="font-medium text-[#0F3D4A]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{c.fullName}</span>
                        {c.hasPendingDocs && (
                          <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-800 text-[10px] font-normal">
                            Docs pendentes
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{c.cpfMasked}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {c.companyId ? (
                        <Link
                          href={`/dashboard/empresas/${c.companyId}`}
                          className="text-[#16A085] hover:underline"
                        >
                          {c.companyName ?? "—"}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="hidden text-sm md:table-cell">{c.jobTitle ?? "—"}</TableCell>
                    <TableCell className="hidden text-sm lg:table-cell">{c.department ?? "—"}</TableCell>
                    <TableCell className="hidden text-sm sm:table-cell">
                      {c.lastExamLabel ? (
                        <span>
                          {c.lastExamLabel}
                          {c.lastExamDate && (
                            <span className="block text-xs text-slate-400">
                              {format(new Date(c.lastExamDate), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="hidden text-sm md:table-cell">
                      <div className="flex flex-col gap-1">
                        <span>
                          {c.nextPeriodicDate
                            ? format(new Date(c.nextPeriodicDate), "dd/MM/yyyy", { locale: ptBR })
                            : "Não definido"}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "w-fit rounded-full text-[10px] font-normal",
                            periodicBadge.tone === "danger" && "border-red-200 bg-red-50 text-red-800",
                            periodicBadge.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-800",
                            periodicBadge.tone === "ok" && "border-emerald-200 bg-emerald-50 text-emerald-800",
                            periodicBadge.tone === "neutral" && "border-slate-200 bg-slate-50 text-slate-600"
                          )}
                        >
                          {periodicBadge.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} type="collaborator" />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/colaboradores/${c.id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> Ver detalhes
                          </DropdownMenuItem>
                          {canManage && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/encaminhamentos/novo?patientId=${c.id}&companyId=${c.companyId ?? ""}`
                                  )
                                }
                              >
                                <FileText className="mr-2 h-4 w-4" /> Novo encaminhamento
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/agenda?new=1&patientId=${c.id}`)
                                }
                              >
                                <Calendar className="mr-2 h-4 w-4" /> Agendar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/colaboradores/${c.id}?tab=documents`)
                                }
                              >
                                <FolderOpen className="mr-2 h-4 w-4" /> Ver documentos
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/colaboradores/${c.id}?tab=overview`)
                                }
                              >
                                <Pencil className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DataTable>
          </div>

          <div className="grid gap-3 md:hidden">
            {initialItems.map((c) => {
              const periodicBadge = getPeriodicExamBadge(c.nextPeriodicDate);
              return (
                <MobileListCard
                  key={c.id}
                  icon={Users}
                  title={c.fullName}
                  subtitle={c.companyName ?? "Sem empresa"}
                  meta={c.jobTitle ?? undefined}
                  badge={
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={c.status} type="collaborator" />
                      <Badge variant="outline" className="rounded-full text-[9px] font-normal">
                        {periodicBadge.label}
                      </Badge>
                    </div>
                  }
                  onClick={() => openDetail(c.id)}
                />
              );
            })}
          </div>
          </>
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
              Página {initialPage} de {totalPages} ({initialTotal} colaboradores)
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

      <DetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={drawerCollaborator?.fullName ?? "Colaborador"}
        description={drawerCollaborator?.company?.tradeName ?? drawerCollaborator?.company?.legalName}
        loading={drawerLoading}
        size="xl"
      >
        {drawerCollaborator && (
          <CollaboratorDetailDrawerContent collaborator={drawerCollaborator} />
        )}
      </DetailDrawer>

      <NewCollaboratorDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        companies={companies}
        defaultCompanyId={searchParams.get("companyId") ?? undefined}
        onSuccess={(id, createReferral) => {
          if (createReferral) {
            router.push(`/dashboard/encaminhamentos/novo?patientId=${id}`);
          } else {
            router.push(`/dashboard/colaboradores/${id}`);
          }
          router.refresh();
        }}
      />
    </PageModule>
  );
}
