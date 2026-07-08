import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/page-auth";
import { isEmpresaUser } from "@/lib/authz";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTable } from "@/components/dashboard/DataTable";
import { PreReferralStatusForm } from "@/components/dashboard/PreReferralStatusForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PRE_REFERRAL_CLINICAL_EXAM_LABELS } from "@/types";
import { formatPhone } from "@/lib/helpers";

export default async function PreEncaminhamentosPage() {
  const session = await requirePagePermission("referrals.manage");
  if (isEmpresaUser(session)) notFound();

  const requests = await prisma.publicReferralRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Pré-encaminhamentos"
        description="Solicitações rápidas enviadas pelo formulário público — leads para análise e conversão"
      />

      <DataTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Protocolo</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Colaborador</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                  Nenhum pré-encaminhamento recebido ainda.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/pre-encaminhamentos/${r.id}`}
                      className="font-semibold text-[var(--brand-green)] hover:underline"
                    >
                      {r.protocol}
                    </Link>
                  </TableCell>
                  <TableCell>{r.companyName}</TableCell>
                  <TableCell>{r.employeeName}</TableCell>
                  <TableCell>{PRE_REFERRAL_CLINICAL_EXAM_LABELS[r.clinicalExamType]}</TableCell>
                  <TableCell>{formatPhone(r.whatsapp)}</TableCell>
                  <TableCell>{format(r.createdAt, "dd/MM/yyyy HH:mm")}</TableCell>
                  <TableCell>
                    <PreReferralStatusForm requestId={r.id} currentStatus={r.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DataTable>
    </div>
  );
}
