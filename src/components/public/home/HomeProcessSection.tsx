import { SectionHeader } from "@/components/public/SectionHeader";
import { HOME_PROCESS_STEPS } from "@/data/home";

export function HomeProcessSection() {
  return (
    <section className="home-process scroll-mt-[var(--header-height)]" id="como-funciona">
      <div className="container-page">
        <SectionHeader
          eyebrow="Processo"
          title="Como funciona na prática"
          description="Da solicitação ao acompanhamento dos documentos, com clareza em cada etapa para empresas e RH."
        />

        <div className="home-process-timeline">
          {HOME_PROCESS_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="home-process-step">
                <div className="home-process-step-head">
                  <span className="home-process-step-num" aria-hidden>
                    {index + 1}
                  </span>
                  <span className="home-process-step-icon" aria-hidden>
                    <Icon strokeWidth={1.75} />
                  </span>
                </div>
                <h3 className="home-process-step-title">{step.title}</h3>
                <p className="home-process-step-desc">{step.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
