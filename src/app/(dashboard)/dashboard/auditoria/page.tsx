import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { scopedWhere } from "@/lib/scoped-db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

export const metadata = { title: "Auditoria" };

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; entity?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const scope = session?.user ? scopedWhere({ user: session.user as never }) : {};
  const q = params.q?.trim();
  const entity = params.entity?.trim();

  const logs = await prisma.auditLog.findMany({
    where: {
      ...scope,
      ...(entity ? { entity } : {}),
      ...(q
        ? {
            OR: [
              { action: { contains: q, mode: "insensitive" } },
              { details: { contains: q, mode: "insensitive" } },
              { entity: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="Logs de auditoria" description="Registro de ações críticas no sistema" />
      <form className="mb-4 flex flex-wrap gap-2">
        <Input name="q" placeholder="Buscar ação, entidade..." defaultValue={q} className="max-w-xs" />
        <Input name="entity" placeholder="Entidade (ex: User)" defaultValue={entity} className="max-w-xs" />
        <Button type="submit">Filtrar</Button>
        <Link href="/dashboard/auditoria"><Button type="button" variant="outline">Limpar</Button></Link>
      </form>
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
