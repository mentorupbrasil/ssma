import { ABOUT_HERO_PANEL_ITEMS } from "@/data/about";

export function AboutHeroPanel() {
  return (
    <div className="about-ed-hero-panel">
      <div className="about-ed-hero-panel-bg">
        <div className="about-ed-hero-panel-grid" />
        <div className="about-ed-hero-panel-bar" />
      </div>

      <div className="about-ed-hero-panel-body">
        <p className="about-ed-hero-panel-kicker">Medicina e Segurança do Trabalho</p>
        <ul className="about-ed-hero-panel-list">
          {ABOUT_HERO_PANEL_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label} className="about-ed-hero-panel-item">
                <span className="about-ed-hero-panel-item-icon">
                  <Icon strokeWidth={1.75} />
                </span>
                <span>{item.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
