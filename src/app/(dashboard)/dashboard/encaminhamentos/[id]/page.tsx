import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ReferralStatusForm } from "@/components/dashboard/ReferralStatusForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLINICAL_EXAM_LABELS, EXAM_CATEGORY_LABELS } from "@/types";
import { requireAuthSession, handleAccessError } from "@/lib/page-auth";
import { assertReferralAccess } from "@/lib/authz";

export default async function EncaminhamentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuthSession();

  try {
    await assertReferralAccess(session, id);
  } catch (error) {
    handleAccessError(error);
  }

  const referral = await prisma.referral.findUnique({
    where: { id },
    include: {
      company: true,
      patient: true,
      exams: true,
      assignedTo: true,
      appointments: true,
    },
  });

  if (!referral) notFound();

  const canChangeStatus = session.user.role !== "EMPRESA" && session.user.role !== "VISUALIZADOR";

  return (
    <div>
      <PageHeader
        title={referral.protocol}
        description={`Criado em ${format(referral.createdAt, "dd/MM/yyyy 'às' HH:mm")}`}
      >
        <StatusBadge status={referral.status} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dados do encaminhamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>Empresa:</strong> {referral.company.tradeName ?? referral.company.legalName}
            </p>
            <p>
              <strong>Paciente:</strong> {referral.patient.fullName}
            </p>
            <p>
              <strong>Exame clínico:</strong> {CLINICAL_EXAM_LABELS[referral.clinicalExamType]}
            </p>
            <p>
              <strong>Autorizador:</strong> {referral.authorizerName ?? "—"}
            </p>
            <p>
              <strong>Origem:</strong> {referral.source}
            </p>
            {referral.assignedTo && (
              <p>
                <strong>Responsável:</strong> {referral.assignedTo.name}
              </p>
            )}
            {referral.internalNotes && (
              <p>
                <strong>Obs. internas:</strong> {referral.internalNotes}
              </p>
            )}

            <div className="pt-4">
              <p className="mb-2 font-medium">Exames solicitados</p>
              {referral.exams.length === 0 ? (
                <p className="text-slate-500">Apenas exame clínico.</p>
              ) : (
                <ul className="space-y-1">
                  {referral.exams.map((e) => (
                    <li key={e.id} className="flex gap-2">
                      <span className="text-slate-500">{EXAM_CATEGORY_LABELS[e.category]}:</span>
                      {e.examName}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {referral.appointments.length > 0 && (
              <div className="pt-4">
                <p className="mb-2 font-medium">Agendamentos</p>
                <ul className="space-y-1">
                  {referral.appointments.map((a) => (
                    <li key={a.id}>
                      {a.title} — {format(a.scheduledAt, "dd/MM/yyyy HH:mm")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {canChangeStatus && (
          <Card>
            <CardHeader>
              <CardTitle>Alterar status</CardTitle>
            </CardHeader>
            <CardContent>
              <ReferralStatusForm referralId={referral.id} currentStatus={referral.status} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
