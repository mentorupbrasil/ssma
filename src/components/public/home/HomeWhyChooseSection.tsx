import { SectionHeader } from "@/components/public/SectionHeader";
import { HOME_WHY_CHOOSE } from "@/data/home";

export function HomeWhyChooseSection() {
  return (
    <section className="home-why scroll-mt-[var(--header-height)]" id="por-que-escolher">
      <div className="container-page">
        <SectionHeader
          eyebrow="Diferenciais"
          title="Por que empresas escolhem a Unimetra"
          description="Atendimento ocupacional, suporte técnico e organização digital em um fluxo mais claro para empresas e RHs."
        />

        <div className="home-why-grid">
          {HOME_WHY_CHOOSE.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="home-why-card group">
                <div className="home-why-card-icon" aria-hidden>
                  <Icon strokeWidth={1.75} />
                </div>
                <h3 className="home-why-card-title">{item.title}</h3>
                <p className="home-why-card-desc">{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
