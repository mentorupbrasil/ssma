import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
} from "@/components/public/SocialIcons";
import { getClinicSiteConfig } from "@/config/clinic";
import { formatPhone, getClinicInfo, whatsappLink } from "@/lib/helpers";
import { BrandLogo } from "@/components/brand/BrandLogo";

/** Links que não aparecem no menu principal do header */
const FOOTER_EXTRA_LINKS = [
  { href: "/atualizacoes", label: "Atualizações" },
  { href: "/politica-de-privacidade", label: "Política de privacidade" },
  { href: "/termos-de-uso", label: "Termos de uso" },
] as const;

export function Footer() {
  const clinic = getClinicInfo();
  const config = getClinicSiteConfig();

  const socialLinks = [
    { icon: InstagramIcon, label: "Instagram", href: config.instagram },
    { icon: FacebookIcon, label: "Facebook", href: config.facebook },
  ].filter((item) => Boolean(item.href));

  return (
    <footer className="site-footer mt-auto border-t border-white/10 bg-[var(--brand-navy)] text-slate-300">
      <div className="container-page grid gap-10 py-14 lg:grid-cols-4 lg:gap-12 lg:py-16">
        <div>
          <div className="mb-4">
            <BrandLogo height={40} showLink href="/" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Medicina e Segurança do Trabalho com agilidade, tecnologia e confiança para empresas
            de todos os portes.
          </p>
        </div>

        <div>
          <h4 className="footer-column-title">Informações</h4>
          <ul className="space-y-2.5 text-sm">
            {FOOTER_EXTRA_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="transition hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="footer-column-title">Contato</h4>
          <ul className="space-y-3.5 text-sm">
            {config.hasWhatsApp && (
              <li className="flex items-start gap-3">
                <MessageCircle className="footer-contact-icon" strokeWidth={1.75} />
                <a
                  href={whatsappLink(`Olá! Gostaria de falar com a ${clinic.name}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="leading-relaxed text-slate-400 transition hover:text-white"
                >
                  {formatPhone(config.whatsapp)}
                </a>
              </li>
            )}
            {clinic.email && (
              <li className="flex items-start gap-3">
                <Mail className="footer-contact-icon" strokeWidth={1.75} />
                <a
                  href={`mailto:${clinic.email}`}
                  className="break-all leading-relaxed text-slate-400 transition hover:text-white"
                >
                  {clinic.email}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h4 className="footer-column-title">Redes sociais</h4>
          <p className="mb-4 text-sm leading-relaxed text-slate-400">
            Acompanhe novidades e conteúdos sobre saúde ocupacional.
          </p>
          {socialLinks.length > 0 ? (
            <div className="footer-social-grid" aria-label="Redes sociais">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-icon transition hover:bg-white/10 hover:text-white"
                  aria-label={`${label} da ${clinic.name}`}
                >
                  <Icon className="h-[1.1rem] w-[1.1rem]" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Em breve.</p>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {clinic.name}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
