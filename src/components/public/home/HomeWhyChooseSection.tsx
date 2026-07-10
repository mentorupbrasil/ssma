import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoCloud } from "@/components/public/LogoCloud";
import { HOME_CLIENT_WORDMARKS, HOME_WHY_CHOOSE } from "@/data/home";

const STATS = [
  { value: "6", label: "documentos e programas cobertos", variant: "number" },
  { value: "5", label: "etapas claras, do orçamento ao ASO", variant: "number" },
  { value: "Protocolo digital", label: "em cada encaminhamento", variant: "text" },
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
                <dt
                  className={cn(
                    "home-why-stat-value",
                    stat.variant === "text" && "home-why-stat-value--text"
                  )}
                >
                  {stat.value}
                </dt>
                <dd className="home-why-stat-label">{stat.label}</dd>
              </div>
            ))}
          </dl>

          <ul className="home-why-checklist">
            {HOME_WHY_CHOOSE.map((item) => (
              <li key={item.title} className="home-why-check-item">
                <span className="home-why-check-mark" aria-hidden>
                  <Check strokeWidth={2.5} />
                </span>
                <div>
                  <p className="home-why-check-title">{item.title}</p>
                  <p className="home-why-check-desc">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="home-why-clients">
            <p className="home-why-clients-label">Empresas que confiam na Unimetra</p>
            <LogoCloud
              wordmarks={HOME_CLIENT_WORDMARKS}
              variant="dark"
              className="home-why-clients-logos"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
