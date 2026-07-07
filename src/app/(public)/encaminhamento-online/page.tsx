import { SectionTitle } from "@/components/public/SectionTitle";
import { ReferralWizard } from "@/components/forms/ReferralWizard";

export const metadata = { title: "Encaminhamento Online" };

export default function EncaminhamentoPage() {
  return (
    <>
      <section className="bg-[#0F3D4A] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold">Encaminhamento Online</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Encaminhe colaboradores para exames ocupacionais de forma rápida e segura.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Preencha o formulário"
            description="O encaminhamento será registrado e aparecerá no painel da clínica com status 'Novo'."
            align="left"
            className="mb-8"
          />
          <ReferralWizard />
        </div>
      </section>
    </>
  );
}
