import { redirect } from "next/navigation";

import { ReferralWizardEmpresa } from "@/components/forms/ReferralWizardEmpresa";
import { NovoExameEmpresaShell } from "@/components/dashboard/referrals/NovoExameEmpresaShell";
import { getEmpresaPrefill } from "@/actions";
import { requireAuthSession } from "@/lib/page-auth";
import { isEmpresaUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { maskCpf } from "@/lib/collaborators";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const v = params[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

/** RH solicita exames; a clínica recebe na fila (não cria encaminhamento por aqui). */
export default async function NovoEncaminhamentoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const session = await requireAuthSession();
  const isEmpresa = isEmpresaUser(session);

  if (!isEmpresa) {
    redirect("/dashboard/encaminhamentos");
  }

  const prefill = await getEmpresaPrefill();
  if (!prefill) {
    redirect("/dashboard/encaminhamentos");
  }

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId! },
    select: { tradeName: true, legalName: true },
  });
  const patients = await prisma.patient.findMany({
    where: { companyId: session.user.companyId!, status: "ATIVO" },
    select: {
      id: true,
      fullName: true,
      cpf: true,
      jobTitle: true,
      department: true,
    },
    orderBy: { fullName: "asc" },
  });

  const initialPatientId = getParam(params, "patientId") || undefined;

  return (
    <NovoExameEmpresaShell>
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Nova solicitação de exames</h1>
          <p className="colaboradores-empresa-subtitle">
            Selecione colaboradores e o tipo de exame. A clínica processará a solicitação.
          </p>
        </div>
      </header>
      <ReferralWizardEmpresa
        patients={patients.map((p) => ({
          id: p.id,
          fullName: p.fullName,
          cpfMasked: maskCpf(p.cpf),
          jobTitle: p.jobTitle,
          department: p.department,
        }))}
        companyName={company?.tradeName ?? company?.legalName ?? prefill.companyName}
        authorizerName={prefill.authorizerName}
        initialPatientId={initialPatientId}
      />
    </NovoExameEmpresaShell>
  );
}
