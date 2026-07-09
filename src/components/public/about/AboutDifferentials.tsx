import { CheckCircle2 } from "lucide-react";
import { ABOUT_DIFFERENTIALS } from "@/data/about";

const STATS = [
  { value: "6", label: "diferenciais para o RH" },
  { value: "1", label: "portal empresarial integrado" },
  { value: "100%", label: "foco em conformidade SST" },
] as const;

export function AboutDifferentials() {
  return (
    <section className="about-diff">
      <div className="container-page">
        <div className="home-why-panel">
          <div className="home-why-header">
            <p className="home-why-eyebrow">Diferenciais</p>
            <h2 className="home-why-title">O que torna a Unimetra diferente</h2>
            <p className="home-why-desc">
              Estrutura clínica, organização documental e tecnologia a serviço do RH — com foco em
              confiança e conformidade.
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
            {ABOUT_DIFFERENTIALS.map((item) => (
              <li key={item.title} className="home-why-check-item">
                <CheckCircle2 className="home-why-check-icon" strokeWidth={1.75} aria-hidden />
                <div>
                  <p className="home-why-check-title">{item.title}</p>
                  <p className="home-why-check-desc">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
