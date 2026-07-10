import { LogoCloud } from "@/components/public/LogoCloud";
import { HOME_CLIENT_LOGOS } from "@/data/home";

export function HomeClientsSection() {
  return (
    <section className="home-clients" aria-label="Empresas atendidas">
      <div className="container-page">
        <div className="home-clients-inner">
          <p className="home-clients-eyebrow">Confiança</p>
          <p className="home-clients-title">Empresas que confiam na Unimetra</p>
          <LogoCloud logos={HOME_CLIENT_LOGOS} className="home-clients-logos" />
        </div>
      </div>
    </section>
  );
}
