import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ROLE_LABELS } from "@/lib/permissions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function UsuariosPage() {
  const users = await prisma.user.findMany({
    include: { company: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Usuários e permissões" description="Gestão de acesso ao sistema (apenas ADMIN)" />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell><Badge variant="secondary">{ROLE_LABELS[u.role]}</Badge></TableCell>
                <TableCell>{u.company?.tradeName ?? "—"}</TableCell>
                <TableCell>{u.status === "ACTIVE" ? "Ativo" : "Inativo"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
