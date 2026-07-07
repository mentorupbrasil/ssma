import Link from "next/link";
import { Share2, MapPin, Phone, Mail, Clock } from "lucide-react";
import { getClinicInfo } from "@/lib/helpers";

export function Footer() {
  const clinic = getClinicInfo();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-[#0F3D4A] text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#16A085] text-lg font-bold text-white">
            U
          </div>
          <h3 className="text-lg font-semibold text-white">{clinic.name}</h3>
          <p className="mt-2 text-sm text-slate-300">
            Medicina e Segurança do Trabalho com agilidade, tecnologia e confiança.
          </p>
        </div>

        <div>
          <h4 className="mb-4 font-semibold text-white">Links úteis</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/servicos" className="hover:text-white">Serviços</Link></li>
            <li><Link href="/exames" className="hover:text-white">Exames e preparos</Link></li>
            <li><Link href="/encaminhamento-online" className="hover:text-white">Encaminhamento online</Link></li>
            <li><Link href="/atualizacoes" className="hover:text-white">Atualizações</Link></li>
            <li><Link href="/politica-de-privacidade" className="hover:text-white">Política de privacidade</Link></li>
            <li><Link href="/termos-de-uso" className="hover:text-white">Termos de uso</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-semibold text-white">Contato</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#16A085]" />
              {clinic.address}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#16A085]" />
              {clinic.phone}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#16A085]" />
              {clinic.email}
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#16A085]" />
              {clinic.hours}
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-semibold text-white">Redes sociais</h4>
          <a
            href={clinic.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm hover:text-white"
          >
            <Share2 className="h-4 w-4 text-[#16A085]" />
            Instagram
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {clinic.name}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
