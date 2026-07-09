"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AUDIT_ENTITY_LABELS,
  translateEntity,
  translateAction,
  isCriticalAudit,
} from "@/lib/audit";
import { cn } from "@/lib/utils";

type AuditLogRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  userName: string | null;
};

type AuditoriaClientProps = {
  logs: AuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
  users: { id: string; name: string }[];
  filters: {
    q?: string;
    entity?: string;
    action?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  };
};

export function AuditoriaClient({
  logs,
  total,
  page,
  pageSize,
  users,
  filters,
}: AuditoriaClientProps) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function applyFilters(form: FormData) {
    const params = new URLSearchParams();
    for (const [key, value] of form.entries()) {
      if (typeof value === "string" && value.trim()) params.set(key, value.trim());
    }
    router.push(`/dashboard/auditoria?${params.toString()}`);
  }

  return (
    <div className="referrals-module">
      <PageHeader title="Logs de auditoria" description="Registro de ações críticas no sistema" />

      <form action={applyFilters} className="mb-4">
        <FilterBar
          onClear={() => router.push("/dashboard/auditoria")}
          searchLabel="Filtrar"
        >
          <Input name="q" placeholder="Buscar..." defaultValue={filters.q} className="max-w-xs" />
          <Select name="entity" defaultValue={filters.entity ?? "ALL"}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Entidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas entidades</SelectItem>
              {Object.entries(AUDIT_ENTITY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select name="userId" defaultValue={filters.userId ?? "ALL"}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Usuário" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos usuários</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input name="dateFrom" type="date" defaultValue={filters.dateFrom} />
          <Input name="dateTo" type="date" defaultValue={filters.dateTo} />
        </FilterBar>
        <div className="mt-2">
          <Button type="submit" size="sm">Filtrar</Button>
        </div>
      </form>

      {logs.length === 0 ? (
        <EmptyState title="Nenhum registro" description="Ajuste os filtros ou aguarde novas ações no sistema." />
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {format(new Date(log.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{log.userName ?? "Sistema"}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "rounded px-2 py-0.5 text-xs font-medium",
                        isCriticalAudit(log.entity, log.action)
                          ? "bg-red-50 text-red-700"
                          : "bg-slate-100 text-slate-700"
                      )}>
                        {translateAction(log.action)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span title={log.entity}>{translateEntity(log.entity)}</span>
                      {log.entityId && (
                        <span className="block text-xs text-slate-400 truncate max-w-[120px]">{log.entityId}</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-slate-500">{log.details ?? "—"}</TableCell>
                    <TableCell className="text-xs text-slate-400">{log.ipAddress ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
            <span>{logs.length} de {total} registros</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/dashboard/auditoria?${new URLSearchParams({ ...filters, page: String(page - 1) } as Record<string, string>).toString()}`}>
                  <Button variant="outline" size="sm">Anterior</Button>
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/dashboard/auditoria?${new URLSearchParams({ ...filters, page: String(page + 1) } as Record<string, string>).toString()}`}>
                  <Button variant="outline" size="sm">Próxima</Button>
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
