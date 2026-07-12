"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Search,
  Shield,
} from "lucide-react";
import { PageModule } from "@/components/dashboard/PageModule";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DetailDrawer } from "@/components/dashboard/DetailDrawer";
import {
  SystemActionMenu,
  type SystemActionItem,
} from "@/components/dashboard/SystemActionMenu";
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
import { exportAuditLogsCsv } from "@/actions/audit";
import {
  AUDIT_UI_ACTION_LABELS,
  formatAuditActor,
  formatAuditDateTime,
  formatAuditOrigin,
  formatAuditSummary,
  getVisibleAuditEntityOptions,
  isCriticalAudit,
  parseAuditChanges,
  translateAction,
  translateEntity,
} from "@/lib/audit";
import { toast } from "sonner";
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
  const [pending, startTransition] = useTransition();
  const [exporting, setExporting] = useState(false);
  const [detail, setDetail] = useState<AuditLogRow | null>(null);

  const [q, setQ] = useState(filters.q ?? "");
  const [userId, setUserId] = useState(filters.userId ?? "");
  const [action, setAction] = useState(filters.action ?? "");
  const [entity, setEntity] = useState(filters.entity ?? "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");
  const skipAuto = useRef(true);

  const entityOptions = useMemo(() => getVisibleAuditEntityOptions(), []);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const enriched = useMemo(
    () =>
      logs.map((log) => ({
        ...log,
        summary: formatAuditSummary({
          action: log.action,
          entity: log.entity,
          details: log.details,
          userName: log.userName,
        }),
        actor: formatAuditActor(log.userName),
      })),
    [logs]
  );

  function pushFilters(next: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value?.trim()) params.set(key, value.trim());
    }
    startTransition(() => router.push(`/dashboard/auditoria?${params.toString()}`));
  }

  function currentFilterPayload(overrides: Partial<AuditoriaClientProps["filters"]> = {}) {
    return {
      q: overrides.q ?? q,
      userId: overrides.userId ?? userId,
      action: overrides.action ?? action,
      entity: overrides.entity ?? entity,
      dateFrom: overrides.dateFrom ?? dateFrom,
      dateTo: overrides.dateTo ?? dateTo,
    };
  }

  useEffect(() => {
    if (skipAuto.current) {
      skipAuto.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      pushFilters(currentFilterPayload());
    }, 350);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, userId, action, entity, dateFrom, dateTo]);

  function clearFilters() {
    skipAuto.current = true;
    setQ("");
    setUserId("");
    setAction("");
    setEntity("");
    setDateFrom("");
    setDateTo("");
    startTransition(() => router.push("/dashboard/auditoria"));
    window.setTimeout(() => {
      skipAuto.current = false;
    }, 0);
  }

  function goPage(next: number) {
    pushFilters({
      q: filters.q,
      userId: filters.userId,
      action: filters.action,
      entity: filters.entity,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      page: next > 1 ? String(next) : "",
    });
  }

  async function handleExport() {
    setExporting(true);
    const result = await exportAuditLogsCsv({
      q: filters.q,
      userId: filters.userId,
      action: filters.action,
      entity: filters.entity,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    });
    setExporting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${result.count} log(s) exportado(s).`);
  }

  function rowActions(log: AuditLogRow): SystemActionItem[] {
    return [
      {
        label: "Ver detalhes",
        hint: "Abrir registro completo (somente leitura)",
        icon: Eye,
        iconTone: "view",
        onClick: () => setDetail(log),
      },
    ];
  }

  const detailChanges = detail ? parseAuditChanges(detail.details) : [];

  return (
    <PageModule className="auditoria-logs">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Logs de auditoria</h1>
          <p className="colaboradores-empresa-subtitle">
            Histórico somente leitura das ações realizadas no sistema.
          </p>
        </div>
        <div className="colaboradores-empresa-header-actions">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() => void handleExport()}
            disabled={exporting || pending}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar logs
          </Button>
        </div>
      </header>

      <div className="tabela-precos-filters auditoria-filters auditoria-filters--row">
        <div className="tabela-precos-search auditoria-search">
          <Search className="tabela-precos-search-icon" aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar"
            className="tabela-precos-search-input"
            aria-label="Busca"
          />
        </div>
        <select
          className="tabela-precos-select"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          aria-label="Usuário"
        >
          <option value="">Usuário</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <select
          className="tabela-precos-select"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          aria-label="Ação"
        >
          <option value="">Ação</option>
          {Object.entries(AUDIT_UI_ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          className="tabela-precos-select"
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          aria-label="Módulo"
        >
          <option value="">Módulo</option>
          {entityOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="auditoria-period" role="group" aria-label="Período">
          <span className="auditoria-period-label">Período</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="tabela-precos-select auditoria-date"
            aria-label="Data inicial"
          />
          <span className="auditoria-period-sep" aria-hidden>
            –
          </span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="tabela-precos-select auditoria-date"
            aria-label="Data final"
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={clearFilters} disabled={pending}>
          Limpar
        </Button>
      </div>

      <p className="auditoria-result-meta">
        {total} registro{total === 1 ? "" : "s"} · ordenados do mais recente para o mais antigo
        {pending ? " · atualizando…" : ""}
      </p>

      {enriched.length === 0 ? (
        <EmptyState
          icon={Shield}
          compact
          title="Nenhum registro encontrado"
          description="Ajuste os filtros ou aguarde novas ações no sistema."
        />
      ) : (
        <div className="colaboradores-empresa-table-wrap">
          <div className="colaboradores-empresa-table-scroll">
            <Table className="colaboradores-empresa-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Data e hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Módulo/registro</TableHead>
                  <TableHead>Resumo</TableHead>
                  <TableHead className="colaboradores-empresa-th-actions">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enriched.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatAuditDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell>{log.actor}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "auditoria-action-badge",
                          isCriticalAudit(log.entity, log.action) &&
                            "auditoria-action-badge--critical"
                        )}
                      >
                        {translateAction(log.action)}
                      </span>
                    </TableCell>
                    <TableCell>{translateEntity(log.entity)}</TableCell>
                    <TableCell className="max-w-md text-sm text-slate-600">
                      <button
                        type="button"
                        className="text-left hover:underline"
                        onClick={() => setDetail(log)}
                      >
                        {log.summary}
                      </button>
                    </TableCell>
                    <TableCell>
                      <SystemActionMenu items={rowActions(log)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="colaboradores-empresa-pagination">
              <span>
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || pending}
                  onClick={() => goPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages || pending}
                  onClick={() => goPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <DetailDrawer
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        title="Detalhes do log"
        description="Registro somente leitura — não é possível editar ou excluir."
        size="lg"
      >
        {detail && (
          <div className="auditoria-detail">
            <dl className="auditoria-detail-grid">
              <div>
                <dt>Data e hora</dt>
                <dd>{formatAuditDateTime(detail.createdAt)}</dd>
              </div>
              <div>
                <dt>Usuário</dt>
                <dd>{formatAuditActor(detail.userName)}</dd>
              </div>
              <div>
                <dt>Ação</dt>
                <dd>{translateAction(detail.action)}</dd>
              </div>
              <div>
                <dt>Módulo</dt>
                <dd>{translateEntity(detail.entity)}</dd>
              </div>
              <div className="auditoria-detail-wide">
                <dt>Registro afetado</dt>
                <dd>
                  {formatAuditSummary({
                    action: detail.action,
                    entity: detail.entity,
                    details: detail.details,
                    userName: detail.userName,
                  })}
                </dd>
              </div>
              <div>
                <dt>IP</dt>
                <dd>{detail.ipAddress || "Não registrado"}</dd>
              </div>
              <div>
                <dt>Origem da ação</dt>
                <dd>
                  {formatAuditOrigin({
                    userName: detail.userName,
                    action: detail.action,
                    ipAddress: detail.ipAddress,
                  })}
                </dd>
              </div>
            </dl>

            {(detailChanges.length > 0 || detail.details) && (
              <section className="auditoria-detail-changes">
                <h3>Valores</h3>
                {detailChanges.length > 0 ? (
                  <ul>
                    {detailChanges.map((change, idx) => (
                      <li key={`${change.field ?? "c"}-${idx}`}>
                        {change.field ? <strong>{change.field}: </strong> : null}
                        <span className="auditoria-before">{change.before ?? "—"}</span>
                        <span className="auditoria-arrow"> → </span>
                        <span className="auditoria-after">{change.after ?? "—"}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="auditoria-detail-raw">
                    <p>
                      <strong>Valores anteriores:</strong> Não informados neste registro
                    </p>
                    <p>
                      <strong>Valores novos / detalhe:</strong> {detail.details}
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </DetailDrawer>
    </PageModule>
  );
}
