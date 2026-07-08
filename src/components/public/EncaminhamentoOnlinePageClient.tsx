"use client";

import { useRef } from "react";
import { PreReferralWizard } from "@/components/forms/PreReferralWizard";
import {
  EncaminhamentoHero,
  EncaminhamentoPathCards,
  EncaminhamentoInfoBox,
} from "@/components/public/EncaminhamentoSections";
import { CTASection } from "@/components/public/CTASection";
import { PageSection } from "@/components/public/PageSection";
import { whatsappLink } from "@/lib/helpers";

export function EncaminhamentoOnlinePageClient({
  examOptions = [],
}: {
  examOptions?: string[];
}) {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <EncaminhamentoHero />

      <PageSection>
        <EncaminhamentoPathCards onScrollToForm={scrollToForm} />
      </PageSection>

      <PageSection variant="muted" className="scroll-mt-[var(--header-height)]">
        <div ref={formRef} id="pre-encaminhamento" className="mx-auto max-w-2xl">
          <EncaminhamentoInfoBox />
          <div className="page-content-card mt-6">
            <PreReferralWizard examOptions={examOptions} />
          </div>
        </div>
      </PageSection>

      <CTASection
        title="Quer acesso completo ao portal empresarial?"
        description="Cadastre sua empresa para acompanhar encaminhamentos, exames e documentos ocupacionais em um ambiente exclusivo para o RH."
        primaryHref="/contato?tipo=orcamento"
        primaryLabel="Solicitar acesso ao portal"
        secondaryHref={whatsappLink("Olá! Quero fazer um encaminhamento ocupacional e preciso de ajuda.")}
        secondaryLabel="Falar com especialista"
      />
    </>
  );
}
