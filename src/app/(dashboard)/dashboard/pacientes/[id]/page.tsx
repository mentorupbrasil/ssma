import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatCPF } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLINICAL_EXAM_LABELS } from "@/types";

export default async function PacienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      company: true,
      referrals: { orderBy: { createdAt: "desc" }, take: 10 },
      documents: { take: 10 },
    },
  });

  if (!patient) notFound();

  return (
    <div>
      <PageHeader title={patient.fullName} description={patient.company?.tradeName ?? patient.company?.legalName ?? "Sem empresa"} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Dados pessoais</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>CPF:</strong> {formatCPF(patient.cpf)}</p>
            <p><strong>RG:</strong> {patient.rg ?? "—"}</p>
            <p><strong>Nascimento:</strong> {patient.birthDate ? format(patient.birthDate, "dd/MM/yyyy") : "—"}</p>
            <p><strong>Função:</strong> {patient.jobTitle ?? "—"}</p>
            <p><strong>Setor:</strong> {patient.department ?? "—"}</p>
            <p><strong>Telefone:</strong> {patient.phone ?? "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Encaminhamentos</CardTitle></CardHeader>
          <CardContent>
            {patient.referrals.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum encaminhamento.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {patient.referrals.map((r) => (
                  <li key={r.id} className="flex items-center justify-between">
                    <Link href={`/dashboard/encaminhamentos/${r.id}`} className="text-[#16A085] hover:underline">{r.protocol}</Link>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
