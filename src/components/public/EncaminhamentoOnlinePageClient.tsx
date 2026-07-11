"use client";

import { PreReferralWizard } from "@/components/forms/PreReferralWizard";
import {
  EncaminhamentoHero,
  EncaminhamentoInfoBox,
} from "@/components/public/EncaminhamentoSections";
import { PageSection } from "@/components/public/PageSection";

export function EncaminhamentoOnlinePageClient({
  examOptions = [],
}: {
  examOptions?: string[];
}) {
  return (
    <>
      <EncaminhamentoHero />

      <PageSection variant="muted" className="scroll-mt-[var(--header-height)]">
        <div id="pre-encaminhamento" className="mx-auto max-w-2xl">
          <EncaminhamentoInfoBox />
          <div className="page-content-card mt-6">
            <PreReferralWizard examOptions={examOptions} />
          </div>
        </div>
      </PageSection>
    </>
  );
}
