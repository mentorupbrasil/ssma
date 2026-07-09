import { Info } from "lucide-react";
import { ABOUT_COMPLIANCE } from "@/data/about";

export function AboutCompliance() {
  return (
    <section
      id="conformidade"
      className="about-compliance scroll-mt-[var(--header-height)]"
    >
      <div className="container-page">
        <div className="about-compliance-header">
          <p className="about-eyebrow about-eyebrow--muted">Conformidade</p>
          <h2 className="about-section-heading about-section-heading--center">
            Compromisso com conformidade, segurança e responsabilidade
          </h2>
          <p className="about-compliance-copy">
            Dados ocupacionais exigem cuidado, organização e controle. Por isso, a Unimetra
            trabalha com fluxos pensados para apoiar empresas na gestão de documentos, exames e
            informações sensíveis.
          </p>
        </div>

        <div className="about-compliance-grid">
          {ABOUT_COMPLIANCE.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="about-compliance-card">
                <div className="about-compliance-card-icon">
                  <Icon strokeWidth={1.75} />
                </div>
                <p className="about-compliance-card-title">{item.title}</p>
              </article>
            );
          })}
        </div>

        <div className="about-compliance-note">
          <Info className="about-compliance-note-icon" strokeWidth={1.75} />
          <p>
            O portal empresarial complementa o atendimento da clínica, facilitando o acompanhamento
            de solicitações, documentos e status ocupacionais.
          </p>
        </div>
      </div>
    </section>
  );
}
