import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTable } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCNPJ } from "@/lib/helpers";

export default async function EmpresasPage() {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { patients: true, referrals: true } } },
  });

  return (
    <div>
      <PageHeader title="Empresas" description="Gestão de empresas clientes">
        <Link href="/dashboard/empresas/novo">
          <Button variant="brand"><Plus className="mr-2 h-4 w-4" /> Nova empresa</Button>
        </Link>
      </PageHeader>

      <DataTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razão social</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Pacientes</TableHead>
              <TableHead>Encaminhamentos</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link href={`/dashboard/empresas/${c.id}`} className="font-medium text-[#0F3D4A] hover:underline">
                    {c.tradeName ?? c.legalName}
                  </Link>
                </TableCell>
                <TableCell>{formatCNPJ(c.cnpj)}</TableCell>
                <TableCell>{c.responsibleName ?? "—"}</TableCell>
                <TableCell>{c._count.patients}</TableCell>
                <TableCell>{c._count.referrals}</TableCell>
                <TableCell>
                  <StatusBadge status={c.status === "ACTIVE" ? "CONCLUIDO" : "CANCELADO"} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTable>
    </div>
  );
}
