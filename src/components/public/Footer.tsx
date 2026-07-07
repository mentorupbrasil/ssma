import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
} from "lucide-react";
import { formatAddressLines, formatOpeningHoursLines, getClinicSiteConfig } from "@/config/clinic";
import { getClinicInfo } from "@/lib/helpers";

const SOCIAL_ICONS = [
  { icon: Instagram, label: "Instagram" },
  { icon: Facebook, label: "Facebook" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Youtube, label: "YouTube" },
] as const;

export function Footer() {
  const clinic = getClinicInfo();
  const config = getClinicSiteConfig();
  const addressLines = config.hasAddress ? formatAddressLines(config.fullAddress) : [];
  const hoursLines = formatOpeningHoursLines(config.openingHours);

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
              ["/sobre", "Sobre nós"],
              ["/servicos", "Serviços"],
              ["/exames", "Exames e preparos"],
              ["/encaminhamento-online", "Encaminhamento online"],
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
            {addressLines.length > 0 && (
              <li className="flex items-start gap-3">
                <MapPin className="footer-contact-icon" strokeWidth={1.75} />
                <span className="leading-relaxed text-slate-400">
                  {addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </li>
            )}
            {clinic.phone && (
              <li className="flex items-center gap-3">
                <Phone className="footer-contact-icon" strokeWidth={1.75} />
                <span className="text-slate-400">{clinic.phone}</span>
              </li>
            )}
            {clinic.email && (
              <li className="flex items-center gap-3">
                <Mail className="footer-contact-icon" strokeWidth={1.75} />
                <span className="text-slate-400">{clinic.email}</span>
              </li>
            )}
            {hoursLines.length > 0 && (
              <li className="flex items-start gap-3">
                <Clock className="footer-contact-icon" strokeWidth={1.75} />
                <span className="leading-relaxed text-slate-400">
                  {hoursLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
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
                <Icon strokeWidth={1.75} />
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
