import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/forms/ContactForm";
import { getClinicInfo, whatsappLink } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "Contato" };

export default async function ContatoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const clinic = getClinicInfo();
  const isOrcamento = tipo === "orcamento";

  return (
    <>
      <section className="bg-[#0F3D4A] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold">{isOrcamento ? "Solicitar orçamento" : "Contato"}</h1>
          <p className="mt-4 text-lg text-slate-300">Estamos prontos para atender sua empresa.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-2xl font-bold text-[#0F3D4A]">
              {isOrcamento ? "Formulário de orçamento" : "Formulário de contato"}
            </h2>
            <p className="mt-2 text-slate-600">Preencha os dados e retornaremos em breve.</p>
            <div className="mt-8">
              <ContactForm type={isOrcamento ? "orcamento" : "contato"} />
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-[#0F3D4A]">Informações</h3>
              <ul className="mt-4 space-y-4 text-sm text-slate-600">
                <li className="flex items-center gap-3"><Phone className="h-4 w-4 text-[#16A085]" />{clinic.phone}</li>
                <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-[#16A085]" />{clinic.email}</li>
                <li className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#16A085]" />{clinic.address}</li>
                <li className="flex items-center gap-3"><Clock className="h-4 w-4 text-[#16A085]" />{clinic.hours}</li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={whatsappLink("Olá! Gostaria de falar com a clínica.")} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-[#16A085] hover:bg-[#138d75]">
                    <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                  </Button>
                </a>
                {!isOrcamento && (
                  <Link href="/contato?tipo=orcamento">
                    <Button variant="outline">Solicitar orçamento</Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <iframe src={clinic.mapsEmbed} width="100%" height="300" style={{ border: 0 }} loading="lazy" title="Mapa" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
