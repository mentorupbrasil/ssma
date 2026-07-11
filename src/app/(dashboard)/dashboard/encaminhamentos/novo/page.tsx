import Link from "next/link";
import { redirect } from "next/navigation";

import { ReferralWizardEmpresa } from "@/components/forms/ReferralWizardEmpresa";
import { ReferralWizard } from "@/components/forms/ReferralWizard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { getEmpresaPrefill } from "@/actions";
import { getReferralCatalogExams } from "@/actions/exams";
import { requireAuthSession } from "@/lib/page-auth";
import { isEmpresaUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { maskCpf } from "@/lib/collaborators";

export default async function NovoEncaminhamentoPage() {
  const session = await requireAuthSession();
  const isEmpresa = isEmpresaUser(session);

  const [prefill, catalogExams] = await Promise.all([
    getEmpresaPrefill(),
    isEmpresa ? Promise.resolve([]) : getReferralCatalogExams(),
  ]);

  if (isEmpresa && prefill) {
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

    return (
      <div>
        <PageHeader
          title="Novo encaminhamento"
          description="Selecione colaboradores e o tipo de exame. A clínica cuida dos complementares conforme o PCMSO."
        />
        <div className="max-w-3xl">
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
          />
        </div>
      </div>
    );
  }

  if (isEmpresa) redirect("/dashboard/encaminhamentos");

  const complementaryExams = catalogExams
    .filter((e) => e.category !== "LABORATORIAL")
    .map((e) => e.name);
  const labExams = catalogExams
    .filter((e) => e.category === "LABORATORIAL")
    .map((e) => e.name);

  return (
    <div>
      <PageHeader title="Novo encaminhamento" description="Cadastro interno de encaminhamento" />
      <div className="max-w-3xl">
        <ReferralWizard
          mode="dashboard"
          prefill={prefill ?? undefined}
          lockCompany={!!prefill}
          complementaryExams={complementaryExams}
          labExams={labExams}
        />
      </div>
      {!prefill && (
        <p className="mt-4 text-sm text-slate-500">
          Ou direcione a empresa ao{" "}
          <Link href="/encaminhamento-online" className="text-[#16A085] underline">
            pré-encaminhamento rápido
          </Link>
          .
        </p>
      )}
    </div>
  );
}
