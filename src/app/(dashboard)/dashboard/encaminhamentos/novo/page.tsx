import Link from "next/link";
import { ReferralWizard } from "@/components/forms/ReferralWizard";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function NovoEncaminhamentoPage() {
  return (
    <div>
      <PageHeader title="Novo encaminhamento" description="Cadastro interno de encaminhamento" />
      <div className="max-w-3xl">
        <ReferralWizard />
      </div>
      <p className="mt-4 text-sm text-slate-500">
        Ou direcione a empresa ao <Link href="/encaminhamento-online" className="text-[#16A085] underline">formulário online</Link>.
      </p>
    </div>
  );
}
