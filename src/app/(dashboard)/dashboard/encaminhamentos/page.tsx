import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAuthSession } from "@/lib/page-auth";
import { getCompanyFilter, isEmpresaUser } from "@/lib/authz";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTable } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CLINICAL_EXAM_LABELS } from "@/types";

export default async function EncaminhamentosPage() {
  const session = await requireAuthSession();
  const isEmpresa = isEmpresaUser(session);
  const where = getCompanyFilter(session);

  const referrals = await prisma.referral.findMany({
    where,
    include: { company: true, patient: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Encaminhamentos" description="Gestão de encaminhamentos do portal e solicitações internas">
        <div className="flex flex-wrap gap-2">
          {!isEmpresa && (
            <Link href="/dashboard/pre-encaminhamentos">
              <Button variant="outline">Pré-encaminhamentos</Button>
            </Link>
          )}
          <Link href="/dashboard/encaminhamentos/novo">
            <Button variant="brand"><Plus className="mr-2 h-4 w-4" /> Novo</Button>
          </Link>
        </div>
      </PageHeader>

      <DataTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Protocolo</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link href={`/dashboard/encaminhamentos/${r.id}`} className="font-semibold text-[var(--brand-green)] hover:underline">
                    {r.protocol}
                  </Link>
                </TableCell>
                <TableCell>{r.company.tradeName ?? r.company.legalName}</TableCell>
                <TableCell>{r.patient.fullName}</TableCell>
                <TableCell>{CLINICAL_EXAM_LABELS[r.clinicalExamType]}</TableCell>
                <TableCell>{format(r.createdAt, "dd/MM/yyyy")}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTable>
    </div>
  );
}
