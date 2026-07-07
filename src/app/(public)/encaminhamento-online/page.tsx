import { Shield, Lock } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { ReferralWizard } from "@/components/forms/ReferralWizard";

export const metadata = { title: "Encaminhamento Online" };

export default function EncaminhamentoPage() {
  return (
    <>
      <PageHero
        eyebrow="Portal empresarial"
        title="Encaminhamento Online"
        description="Encaminhe colaboradores para exames ocupacionais de forma rápida, segura e organizada. Seus dados são protegidos conforme a LGPD."
      />

      <section className="section-padding">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex flex-wrap gap-4 rounded-2xl border border-[var(--brand-green)]/20 bg-[var(--brand-green-light)]/40 p-4 text-sm text-slate-700">
              <span className="inline-flex items-center gap-2 font-medium">
                <Shield className="h-4 w-4 text-[var(--brand-green)]" />
                Protocolo gerado automaticamente
              </span>
              <span className="inline-flex items-center gap-2 font-medium">
                <Lock className="h-4 w-4 text-[var(--brand-green)]" />
                Dados criptografados em trânsito
              </span>
            </div>
            <ReferralWizard />
          </div>
        </div>
      </section>
    </>
  );
}
