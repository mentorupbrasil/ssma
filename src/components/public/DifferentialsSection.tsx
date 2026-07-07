import { MARKET_DIFFERENTIALS } from "@/data/marketing";
import { SectionTitle } from "@/components/public/SectionTitle";

export function DifferentialsSection() {
  return (
    <section className="differentials-section scroll-mt-[var(--header-height)]">
      <div className="container-page">
        <SectionTitle
          eyebrow="Diferenciais"
          title="O que nos diferencia no mercado"
          description="Unimos atendimento ocupacional, estrutura física e gestão digital para simplificar a rotina das empresas."
          className="differentials-section-title"
        />

        <div className="differentials-grid">
          {MARKET_DIFFERENTIALS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="differential-card group">
                <div className="differential-card-icon">
                  <Icon strokeWidth={1.75} />
                </div>
                <h3 className="differential-card-title">{item.title}</h3>
                <p className="differential-card-desc">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
