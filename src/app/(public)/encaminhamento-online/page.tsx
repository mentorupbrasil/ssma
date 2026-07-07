import { Shield, Lock, FileCheck } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { ReferralWizard } from "@/components/forms/ReferralWizard";
import { PageSection } from "@/components/public/PageSection";

export const metadata = { title: "Encaminhamento Online" };

const TRUST_ITEMS = [
  { icon: FileCheck, label: "Protocolo gerado automaticamente" },
  { icon: Shield, label: "Conformidade com LGPD" },
  { icon: Lock, label: "Dados protegidos em trânsito" },
];

export default function EncaminhamentoPage() {
  return (
    <>
      <PageHero
        eyebrow="Portal empresarial"
        title="Encaminhamento Online"
        description="Encaminhe colaboradores para exames ocupacionais de forma rápida, segura e organizada."
      />

      <PageSection variant="muted">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex flex-wrap gap-2">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
                >
                  <Icon className="h-3.5 w-3.5 text-[var(--brand-green)]" strokeWidth={1.75} />
                  {item.label}
                </span>
              );
            })}
          </div>
          <div className="page-content-card">
            <ReferralWizard />
          </div>
        </div>
      </PageSection>
    </>
  );
}
