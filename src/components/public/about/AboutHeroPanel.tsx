import { LayoutDashboard, MapPin, Shield, Stethoscope } from "lucide-react";

const LAYERS = [
  { icon: Stethoscope, label: "Medicina do Trabalho", tone: "a" as const },
  { icon: Shield, label: "Segurança do Trabalho", tone: "b" as const },
  { icon: LayoutDashboard, label: "Portal empresarial", tone: "c" as const },
];

export function AboutHeroPanel() {
  return (
    <div className="about-ed-hero-panel">
      <div className="about-ed-hero-panel-glow" aria-hidden />
      <div className="about-ed-hero-panel-frame">
        <div className="about-ed-hero-panel-head">
          <span className="about-ed-hero-panel-badge">
            <MapPin className="size-3.5" aria-hidden />
            Imperatriz — MA
          </span>
          <p className="about-ed-hero-panel-label">Medicina e Segurança do Trabalho</p>
        </div>

        <div className="about-ed-hero-panel-stack" aria-hidden>
          {LAYERS.map((layer, index) => {
            const Icon = layer.icon;
            return (
              <div
                key={layer.label}
                className={`about-ed-hero-panel-layer about-ed-hero-panel-layer--${layer.tone}`}
                style={{ ["--layer-i" as string]: index }}
              >
                <span className="about-ed-hero-panel-layer-icon">
                  <Icon strokeWidth={1.65} />
                </span>
                <span className="about-ed-hero-panel-layer-text">{layer.label}</span>
              </div>
            );
          })}
        </div>

        <p className="about-ed-hero-panel-foot">Atendimento presencial e suporte digital</p>
      </div>
    </div>
  );
}
