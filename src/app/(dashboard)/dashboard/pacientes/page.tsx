import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCPF } from "@/lib/helpers";

export default async function PacientesPage() {
  const session = await auth();
  const where = session?.user?.role === "EMPRESA" && session.user.companyId
    ? { companyId: session.user.companyId }
    : {};

  const patients = await prisma.patient.findMany({
    where,
    include: { company: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <div>
      <PageHeader title="Pacientes" description="Colaboradores e pacientes cadastrados">
        <Link href="/dashboard/pacientes/novo">
          <Button className="bg-[#16A085] hover:bg-[#138d75]"><Plus className="mr-2 h-4 w-4" /> Novo paciente</Button>
        </Link>
      </PageHeader>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link href={`/dashboard/pacientes/${p.id}`} className="font-medium text-[#0F3D4A] hover:underline">{p.fullName}</Link>
                </TableCell>
                <TableCell>{formatCPF(p.cpf)}</TableCell>
                <TableCell>{p.company?.tradeName ?? p.company?.legalName ?? "—"}</TableCell>
                <TableCell>{p.jobTitle ?? "—"}</TableCell>
                <TableCell>{p.status === "ACTIVE" ? "Ativo" : "Inativo"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
