import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageHero } from "@/components/public/PageHero";
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
      <PageHero
        eyebrow="Fale conosco"
        title={isOrcamento ? "Solicitar orçamento" : "Entre em contato"}
        description="Nossa equipe comercial responde com agilidade. Para urgências, use o WhatsApp."
      >
        <a
          href={whatsappLink("Olá! Gostaria de falar com um especialista.")}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="brand" className="rounded-xl">
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp direto
          </Button>
        </a>
      </PageHero>

      <section className="section-padding">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-[var(--brand-navy)]">
              {isOrcamento ? "Formulário de orçamento" : "Formulário de contato"}
            </h2>
            <p className="mt-2 text-slate-600">
              Preencha os dados e retornaremos em breve. Você também pode enviar direto pelo
              WhatsApp.
            </p>
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-[var(--shadow-soft)]">
              <ContactForm type={isOrcamento ? "orcamento" : "contato"} />
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[var(--shadow-soft)]">
              <h3 className="font-semibold text-[var(--brand-navy)]">Informações</h3>
              <ul className="mt-4 space-y-4 text-sm text-slate-600">
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-[var(--brand-green)]" />
                  {clinic.phone}
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-[var(--brand-green)]" />
                  {clinic.email}
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-green)]" />
                  {clinic.address}
                </li>
                <li className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-[var(--brand-green)]" />
                  {clinic.hours}
                </li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={whatsappLink("Olá! Gostaria de falar com a clínica.")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="brand">
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

            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-[var(--shadow-soft)]">
              <iframe
                src={clinic.mapsEmbed}
                width="100%"
                height="300"
                style={{ border: 0 }}
                loading="lazy"
                title="Mapa"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
