import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  YoutubeIcon,
} from "@/components/public/SocialIcons";
import { getClinicSiteConfig } from "@/config/clinic";
import { formatPhone, getClinicInfo, whatsappLink } from "@/lib/helpers";

const SOCIAL_ICONS = [
  { icon: InstagramIcon, label: "Instagram" },
  { icon: FacebookIcon, label: "Facebook" },
  { icon: LinkedinIcon, label: "LinkedIn" },
  { icon: YoutubeIcon, label: "YouTube" },
] as const;

export function Footer() {
  const clinic = getClinicInfo();
  const config = getClinicSiteConfig();

  return (
    <footer className="site-footer mt-auto border-t border-white/10 bg-[var(--brand-navy)] text-slate-300">
      <div className="container-page grid gap-10 py-14 lg:grid-cols-4 lg:gap-12 lg:py-16">
        <div>
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-green)] text-lg font-bold text-white shadow-sm">
            U
          </div>
          <h3 className="text-lg font-bold text-white">{clinic.name}</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Medicina e Segurança do Trabalho com agilidade, tecnologia e confiança para empresas
            de todos os portes.
          </p>
        </div>

        <div>
          <h4 className="footer-column-title">Links úteis</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              ["/atualizacoes", "Atualizações"],
              ["/politica-de-privacidade", "Política de privacidade"],
              ["/termos-de-uso", "Termos de uso"],
            ].map(([href, label]) => (
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
          <div className="footer-social-grid" aria-label="Redes sociais">
            {SOCIAL_ICONS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="footer-social-icon"
                title={`${label} em breve`}
                aria-label={`${label} em breve`}
              >
                <Icon className="h-[1.1rem] w-[1.1rem]" />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {clinic.name}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
