import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CLINICAL_EXAM_LABELS } from "@/types";

export default async function EncaminhamentosPage() {
  const session = await auth();
  const where = session?.user?.role === "EMPRESA" && session.user.companyId
    ? { companyId: session.user.companyId }
    : {};

  const referrals = await prisma.referral.findMany({
    where,
    include: { company: true, patient: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Encaminhamentos" description="Gestão de encaminhamentos online e internos">
        <Link href="/dashboard/encaminhamentos/novo">
          <Button className="bg-[#16A085] hover:bg-[#138d75]"><Plus className="mr-2 h-4 w-4" /> Novo</Button>
        </Link>
      </PageHeader>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
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
                  <Link href={`/dashboard/encaminhamentos/${r.id}`} className="font-medium text-[#16A085] hover:underline">{r.protocol}</Link>
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
      </div>
    </div>
  );
}
