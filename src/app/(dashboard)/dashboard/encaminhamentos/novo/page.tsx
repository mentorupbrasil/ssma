import Link from "next/link";
import { ReferralWizard } from "@/components/forms/ReferralWizard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { getEmpresaPrefill } from "@/actions";
import { getReferralCatalogExams } from "@/actions/exams";

export default async function NovoEncaminhamentoPage() {
  const [prefill, catalogExams] = await Promise.all([
    getEmpresaPrefill(),
    getReferralCatalogExams(),
  ]);

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
