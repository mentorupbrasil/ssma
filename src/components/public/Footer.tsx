import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Navigation } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/public/SocialIcons";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { getClinicSiteConfig } from "@/config/clinic";
import { formatPhone, getClinicInfo, whatsappLink } from "@/lib/helpers";

const LEGAL_LINKS = [
  { href: "/politica-de-privacidade", label: "Política de privacidade" },
  { href: "/termos-de-uso", label: "Termos de uso" },
] as const;

export function Footer() {
  const clinic = getClinicInfo();
  const config = getClinicSiteConfig();
  const locationLabel = `${config.city} — ${config.state}`;
  const whatsappHref = whatsappLink(`Olá! Gostaria de falar com a ${clinic.name}.`);

  const socialLinks = [
    { icon: InstagramIcon, label: "Instagram", href: config.instagram },
    { icon: FacebookIcon, label: "Facebook", href: config.facebook },
  ].filter((item) => Boolean(item.href));

  return (
    <footer className="site-footer">
      <div className="site-footer-glow" aria-hidden />
      <div className="container-page site-footer-main">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <BrandLogo height={32} showLink href="/" />
            <p className="site-footer-tagline">
              Medicina e Segurança do Trabalho para empresas em {locationLabel}.
            </p>
            <p className="site-footer-micro">
              Atendimento ocupacional, documentos, exames e suporte para o RH.
            </p>

            {socialLinks.length > 0 && (
              <div className="site-footer-social" aria-label="Redes sociais">
                <span className="site-footer-social-label">Siga a Unimetra</span>
                <div className="site-footer-social-icons">
                  {socialLinks.map(({ icon: Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${label} da ${clinic.name}`}
                      className="site-footer-social-btn"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="site-footer-contact">
            <div className="site-footer-chips">
              {config.hasWhatsApp && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-footer-chip"
                >
                  <span className="site-footer-chip-icon">
                    <MessageCircle strokeWidth={1.75} />
                  </span>
                  <span className="site-footer-chip-body">
                    <span className="site-footer-chip-label">WhatsApp</span>
                    <span className="site-footer-chip-value">{formatPhone(config.whatsapp)}</span>
                  </span>
                </a>
              )}

              {clinic.email && (
                <a href={`mailto:${clinic.email}`} className="site-footer-chip">
                  <span className="site-footer-chip-icon">
                    <Mail strokeWidth={1.75} />
                  </span>
                  <span className="site-footer-chip-body">
                    <span className="site-footer-chip-label">E-mail</span>
                    <span className="site-footer-chip-value">{clinic.email}</span>
                  </span>
                </a>
              )}

              <div className="site-footer-chip site-footer-chip--static">
                <span className="site-footer-chip-icon">
                  <MapPin strokeWidth={1.75} />
                </span>
                <span className="site-footer-chip-body">
                  <span className="site-footer-chip-label">Localização</span>
                  <span className="site-footer-chip-value">{locationLabel}</span>
                </span>
              </div>

              {config.hasMapLink && (
                <a
                  href={config.googleMapsExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-footer-chip site-footer-chip--map"
                >
                  <span className="site-footer-chip-icon">
                    <Navigation strokeWidth={1.75} />
                  </span>
                  <span className="site-footer-chip-body">
                    <span className="site-footer-chip-label">Mapa</span>
                    <span className="site-footer-chip-value site-footer-chip-link">
                      Ver localização
                      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                  </span>
                </a>
              )}
            </div>

            <div className="site-footer-actions">
              <Link href="/contato" className="site-footer-action">
                Entrar em contato
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="site-footer-legal">
        <div className="container-page site-footer-legal-inner">
          <p className="site-footer-copy">
            © {new Date().getFullYear()} {clinic.name}. Todos os direitos reservados.
          </p>
          <nav className="site-footer-legal-nav" aria-label="Legal">
            {LEGAL_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="site-footer-legal-link">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
