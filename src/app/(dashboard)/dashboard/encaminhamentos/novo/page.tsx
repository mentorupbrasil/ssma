import Link from "next/link";
import { ReferralWizard } from "@/components/forms/ReferralWizard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { getEmpresaPrefill } from "@/actions";

export default async function NovoEncaminhamentoPage() {
  const prefill = await getEmpresaPrefill();

  return (
    <div>
      <PageHeader title="Novo encaminhamento" description="Cadastro interno de encaminhamento" />
      <div className="max-w-3xl">
        <ReferralWizard
          mode="dashboard"
          prefill={prefill ?? undefined}
          lockCompany={!!prefill}
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
