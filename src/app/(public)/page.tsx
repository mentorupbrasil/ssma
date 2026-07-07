import { SectionTitle } from "@/components/public/SectionTitle";
import { CTASection } from "@/components/public/CTASection";
import { ComplianceSection } from "@/components/public/ComplianceSection";
import { PortalShowcase } from "@/components/public/PortalShowcase";
import { TestimonialsSection } from "@/components/public/TestimonialsSection";
import { TopClinicalExams } from "@/components/public/TopClinicalExams";
import { ProcessSection } from "@/components/public/ProcessSection";
import { DifferentialsSection } from "@/components/public/DifferentialsSection";
import { LocationSection } from "@/components/public/LocationSection";
import { HomeHero } from "@/components/public/HomeHero";
import { FAQ_ITEMS } from "@/data/services";
import { TRUST_PILLARS } from "@/data/marketing";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";

export default async function HomePage() {
  const clinic = getClinicInfo();

  return (
    <>
      <HomeHero />

      <ComplianceSection />
      <PortalShowcase />

      <section className="trust-pillars-section scroll-mt-[var(--header-height)] bg-slate-50/40">
        <div className="container-page">
          <SectionTitle
            eyebrow="Por que nos escolher"
            title={`${clinic.name} — SST com tecnologia e confiança`}
            description="Unimos atendimento clínico de qualidade com gestão digital para empresas."
            className="trust-pillars-title"
          />
          <div className="trust-pillars-grid">
            {TRUST_PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="trust-pillar-card group">
                  <div className="trust-pillar-icon">
                    <Icon strokeWidth={1.75} />
                  </div>
                  <h3 className="trust-pillar-card-title">{p.title}</h3>
                  <p className="trust-pillar-card-desc">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <TopClinicalExams />

      <ProcessSection />

      <DifferentialsSection />

      <TestimonialsSection />

      <CTASection
        title="Pronto para regularizar a saúde ocupacional da sua empresa?"
        description="Fale com um especialista e veja como organizar exames, documentos e encaminhamentos em um fluxo mais ágil e seguro."
        primaryLabel="Solicitar orçamento sem compromisso"
        secondaryHref={whatsappLink(
          `Olá! Gostaria de falar com um especialista em SST da ${clinic.name}.`
        )}
        secondaryLabel="Falar com especialista"
      />

      <LocationSection />

      <section className="section-padding bg-white">
        <div className="container-page max-w-3xl">
          <SectionTitle eyebrow="FAQ" title="Perguntas frequentes" />
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="group premium-card overflow-hidden border-slate-200/80 open:shadow-[var(--shadow-soft)]"
              >
                <summary className="cursor-pointer list-none px-6 py-5 font-semibold text-[var(--brand-navy)] transition hover:text-[var(--brand-green)] [&::-webkit-details-marker]:hidden">
                  {item.question}
                </summary>
                <p className="border-t border-slate-100 px-6 pb-5 pt-4 text-sm leading-relaxed text-slate-600">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
