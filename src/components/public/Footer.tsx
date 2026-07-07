import Link from "next/link";
import { Share2, MapPin, Phone, Mail, Clock } from "lucide-react";
import { getClinicInfo } from "@/lib/helpers";

export function Footer() {
  const clinic = getClinicInfo();

  return (
    <footer className="mt-auto border-t border-white/10 bg-[var(--brand-navy)] text-slate-300">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-4">
        <div>
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-green)] text-lg font-bold text-white">
            U
          </div>
          <h3 className="text-lg font-bold text-white">{clinic.name}</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Medicina e Segurança do Trabalho com agilidade, tecnologia e confiança para empresas de todos os portes.
          </p>
        </div>

        <div>
          <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">Links úteis</h4>
          <ul className="space-y-3 text-sm">
            {[
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
          <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">Contato</h4>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-green)]" />
              {clinic.address}
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-[var(--brand-green)]" />
              {clinic.phone}
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[var(--brand-green)]" />
              {clinic.email}
            </li>
            <li className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-[var(--brand-green)]" />
              {clinic.hours}
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">Redes sociais</h4>
          <a
            href={clinic.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10 hover:text-white"
          >
            <Share2 className="h-4 w-4 text-[var(--brand-green)]" />
            Instagram
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {clinic.name}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
