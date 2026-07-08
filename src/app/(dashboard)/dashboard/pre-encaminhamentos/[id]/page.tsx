import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/page-auth";
import { isEmpresaUser } from "@/lib/authz";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { PreReferralStatusForm } from "@/components/dashboard/PreReferralStatusForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PRE_REFERRAL_CLINICAL_EXAM_LABELS,
  EXAM_SELECTION_MODE_LABELS,
} from "@/types";
import { formatPhone } from "@/lib/helpers";

export default async function PreEncaminhamentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await requirePagePermission("referrals.manage");
  if (isEmpresaUser(session)) notFound();

  const request = await prisma.publicReferralRequest.findUnique({ where: { id } });
  if (!request) notFound();

  return (
    <div>
      <PageHeader title={request.protocol} description="Detalhes do pré-encaminhamento público">
        <Link href="/dashboard/pre-encaminhamentos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </Link>
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge status={request.status} type="preReferral" />
        <PreReferralStatusForm requestId={request.id} currentStatus={request.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Empresa e contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium text-slate-700">Empresa:</span> {request.companyName}</p>
            {request.companyDocument && (
              <p><span className="font-medium text-slate-700">CNPJ/CPF:</span> {request.companyDocument}</p>
            )}
            <p><span className="font-medium text-slate-700">Responsável:</span> {request.responsibleName}</p>
            <p><span className="font-medium text-slate-700">WhatsApp:</span> {formatPhone(request.whatsapp)}</p>
            {request.email && (
              <p><span className="font-medium text-slate-700">E-mail:</span> {request.email}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Colaborador e exame</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium text-slate-700">Colaborador:</span> {request.employeeName}</p>
            {request.employeeDocument && (
              <p><span className="font-medium text-slate-700">CPF:</span> {request.employeeDocument}</p>
            )}
            <p><span className="font-medium text-slate-700">Função:</span> {request.employeeRole}</p>
            <p>
              <span className="font-medium text-slate-700">Tipo de exame:</span>{" "}
              {PRE_REFERRAL_CLINICAL_EXAM_LABELS[request.clinicalExamType]}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Exames complementares e observações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium text-slate-700">Modo de seleção:</span>{" "}
              {EXAM_SELECTION_MODE_LABELS[request.examSelectionMode]}
            </p>
            {request.selectedExams.length > 0 && (
              <p>
                <span className="font-medium text-slate-700">Exames selecionados:</span>{" "}
                {request.selectedExams.join(", ")}
              </p>
            )}
            {request.notes && (
              <p><span className="font-medium text-slate-700">Observações:</span> {request.notes}</p>
            )}
            <p className="text-xs text-slate-500 pt-2">
              Recebido em {format(request.createdAt, "dd/MM/yyyy 'às' HH:mm")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
