import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatCNPJ, formatPhone } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CLINICAL_EXAM_LABELS } from "@/types";

export default async function EmpresaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      patients: { take: 10, orderBy: { fullName: "asc" } },
      referrals: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { patient: true },
      },
    },
  });

  if (!company) notFound();

  return (
    <div>
      <PageHeader title={company.tradeName ?? company.legalName} description={company.legalName}>
        <StatusBadge status={company.status === "ACTIVE" ? "CONCLUIDO" : "CANCELADO"} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Dados cadastrais</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>CNPJ:</strong> {formatCNPJ(company.cnpj)}</p>
            <p><strong>E-mail:</strong> {company.email ?? "—"}</p>
            <p><strong>Telefone:</strong> {company.phone ? formatPhone(company.phone) : "—"}</p>
            <p><strong>Responsável:</strong> {company.responsibleName ?? "—"}</p>
            <p><strong>Endereço:</strong> {[company.address, company.city, company.state].filter(Boolean).join(", ") || "—"}</p>
            {company.notes && <p><strong>Obs:</strong> {company.notes}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Colaboradores</CardTitle></CardHeader>
          <CardContent>
            {company.patients.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum colaborador cadastrado.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {company.patients.map((p) => (
                  <li key={p.id}>
                    <Link href={`/dashboard/pacientes/${p.id}`} className="text-[#16A085] hover:underline">{p.fullName}</Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Encaminhamentos recentes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Protocolo</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {company.referrals.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/dashboard/encaminhamentos/${r.id}`} className="text-[#16A085] hover:underline">{r.protocol}</Link>
                  </TableCell>
                  <TableCell>{r.patient.fullName}</TableCell>
                  <TableCell>{CLINICAL_EXAM_LABELS[r.clinicalExamType]}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
