import { ABOUT_WORKFLOW_STEPS } from "@/data/about";

export function AboutWorkProcess() {
  return (
    <section
      id="forma-de-trabalhar"
      className="about-process scroll-mt-[var(--header-height)]"
    >
      <div className="container-page">
        <div className="about-process-header">
          <p className="about-eyebrow about-eyebrow--muted">Como trabalhamos</p>
          <h2 className="about-section-heading about-section-heading--center">
            Nossa forma de trabalhar com empresas
          </h2>
          <p className="about-section-lead">
            Um fluxo claro do diagnóstico da necessidade até a entrega documental, com suporte ao RH
            em cada etapa.
          </p>
        </div>

        <div className="about-process-track">
          {ABOUT_WORKFLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <article key={step.step} className="about-process-step">
                <div className="about-process-step-rail" aria-hidden>
                  <span className="about-process-step-num">{step.step}</span>
                  {index < ABOUT_WORKFLOW_STEPS.length - 1 && (
                    <span className="about-process-step-line" />
                  )}
                </div>
                <div className="about-process-step-body">
                  <div className="about-process-step-icon">
                    <Icon strokeWidth={1.75} />
                  </div>
                  <h3 className="about-process-step-title">{step.title}</h3>
                  <p className="about-process-step-text">{step.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
