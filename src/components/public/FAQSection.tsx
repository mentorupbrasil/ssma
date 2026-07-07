import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { SectionTitle } from "@/components/public/SectionTitle";
import { Button } from "@/components/ui/button";
import { FAQ_ITEMS } from "@/data/services";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";

export function FAQSection() {
  const clinic = getClinicInfo();

  return (
    <section className="faq-section scroll-mt-[var(--header-height)] bg-white">
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          <SectionTitle
            eyebrow="FAQ"
            title="Perguntas frequentes"
            description="Tire as principais dúvidas sobre orçamento, encaminhamento online, exames ocupacionais e atendimento para empresas."
            className="faq-section-title"
          />

          <div className="faq-list">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="faq-item group">
                <summary className="faq-item-summary">
                  <span className="faq-item-question">{item.question}</span>
                  <ChevronDown
                    className="faq-item-chevron"
                    strokeWidth={2}
                    aria-hidden
                  />
                </summary>
                <div className="faq-item-answer-wrap">
                  <p className="faq-item-answer">{item.answer}</p>
                </div>
              </details>
            ))}
          </div>

          <div className="faq-cta">
            <p className="faq-cta-text">Ainda ficou com alguma dúvida?</p>
            <div className="faq-cta-actions">
              <a
                href={whatsappLink(
                  `Olá! Gostaria de falar com um especialista da ${clinic.name}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="rounded-xl">
                  Falar com especialista
                </Button>
              </a>
              <Link href="/contato?tipo=orcamento">
                <Button variant="brand" className="rounded-xl">
                  Solicitar orçamento
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
