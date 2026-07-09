import { CheckCircle2 } from "lucide-react";
import { HOME_WHY_CHOOSE } from "@/data/home";

const STATS = [
  { value: "6", label: "documentos e programas cobertos" },
  { value: "5", label: "etapas claras, do orçamento ao ASO" },
  { value: "100%", label: "dos encaminhamentos com protocolo digital" },
] as const;

export function HomeWhyChooseSection() {
  return (
    <section className="home-why scroll-mt-[var(--header-height)]" id="por-que-escolher">
      <div className="container-page">
        <div className="home-why-panel">
          <div className="home-why-header">
            <p className="home-why-eyebrow">Diferenciais</p>
            <h2 className="home-why-title">Por que empresas escolhem a Unimetra</h2>
            <p className="home-why-desc">
              Atendimento ocupacional, suporte técnico e organização digital em um fluxo mais
              claro para empresas e equipes de RH.
            </p>
          </div>

          <dl className="home-why-stats">
            {STATS.map((stat) => (
              <div key={stat.label} className="home-why-stat">
                <dt className="home-why-stat-value">{stat.value}</dt>
                <dd className="home-why-stat-label">{stat.label}</dd>
              </div>
            ))}
          </dl>

          <ul className="home-why-checklist">
            {HOME_WHY_CHOOSE.map((item) => (
              <li key={item.title} className="home-why-check-item">
                <CheckCircle2 className="home-why-check-icon" strokeWidth={1.75} aria-hidden />
                <div>
                  <p className="home-why-check-title">{item.title}</p>
                  <p className="home-why-check-desc">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
