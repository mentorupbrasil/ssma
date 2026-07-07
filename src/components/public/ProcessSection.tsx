import Link from "next/link";
import { ClipboardCheck, FileCheck, MessageCircle, Monitor } from "lucide-react";
import { SectionTitle } from "@/components/public/SectionTitle";
import { Button } from "@/components/ui/button";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";

const PROCESS_STEPS = [
  {
    title: "Primeiro contato",
    desc: "A empresa solicita orçamento ou fala com um especialista.",
    icon: MessageCircle,
  },
  {
    title: "Diagnóstico",
    desc: "Entendemos o porte, os riscos e as necessidades ocupacionais.",
    icon: ClipboardCheck,
  },
  {
    title: "Proposta",
    desc: "Montamos um plano com exames, documentos e prazos claros.",
    icon: FileCheck,
  },
  {
    title: "Execução digital",
    desc: "Acompanhamento por portal, encaminhamentos online e status em tempo real.",
    icon: Monitor,
  },
] as const;

export function ProcessSection() {
  const clinic = getClinicInfo();

  return (
    <section className="process-section scroll-mt-[var(--header-height)] bg-white">
      <div className="container-page">
        <SectionTitle
          eyebrow="Processo"
          title="Como funciona na prática"
          description="Da solicitação ao acompanhamento dos exames, tudo acontece com clareza, organização e suporte especializado."
          className="process-section-title"
        />

        <div className="process-steps-grid">
          {PROCESS_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="process-step-card group">
                <div className="process-step-header">
                  <span className="process-step-number">{index + 1}</span>
                  <span className="process-step-icon" aria-hidden>
                    <Icon strokeWidth={1.75} />
                  </span>
                </div>
                <h3 className="process-step-title">{step.title}</h3>
                <p className="process-step-desc">{step.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="process-section-cta">
          <Link href="/contato?tipo=orcamento">
            <Button variant="brand" size="lg" className="rounded-xl">
              Solicitar orçamento agora
            </Button>
          </Link>
          <a
            href={whatsappLink(
              `Olá! Gostaria de falar com um especialista em SST da ${clinic.name}.`
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="lg" className="rounded-xl">
              Falar com especialista
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
