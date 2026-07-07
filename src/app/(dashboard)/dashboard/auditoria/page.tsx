import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AuditoriaPage() {
  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader title="Logs de auditoria" description="Registro de ações críticas no sistema" />

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
                  {format(log.createdAt, "dd/MM/yy HH:mm")}
                </TableCell>
                <TableCell>{log.user?.name ?? "Sistema"}</TableCell>
                <TableCell><span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium">{log.action}</span></TableCell>
                <TableCell>{log.entity}</TableCell>
                <TableCell className="max-w-xs truncate text-sm text-slate-500">{log.details ?? "—"}</TableCell>
                <TableCell className="text-xs text-slate-400">{log.ipAddress ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
