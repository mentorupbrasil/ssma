import { Quote } from "lucide-react";
import { siteMedia } from "@/config/media";
import { SectionTitle } from "@/components/public/SectionTitle";
import { MediaPlaceholder } from "@/components/public/MediaPlaceholder";

export function TestimonialsSection() {
  return (
    <section className="section-padding bg-white">
      <div className="container-page">
        <SectionTitle
          eyebrow="Depoimentos"
          title="O que dizem nossos clientes"
          description="Substitua os textos e anexe fotos/logos reais quando disponíveis."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {siteMedia.testimonials.map((t, i) => (
            <div key={i} className="premium-card flex flex-col border-slate-200/80 p-6">
              <Quote className="mb-4 h-8 w-8 text-[var(--brand-green)]/40" />
              <p className="flex-1 text-sm leading-relaxed text-slate-600">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                <MediaPlaceholder
                  label="Foto"
                  variant="avatar"
                  src={t.photo || undefined}
                  className="h-12 w-12 shrink-0 !aspect-auto !rounded-full !p-0"
                  hint="/public/images/depoimentos/"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--brand-navy)]">{t.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
            Empresas que confiam em nós
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {siteMedia.clientLogos.map((logo, i) => (
              <MediaPlaceholder
                key={i}
                label={`Logo ${i + 1}`}
                variant="logo"
                src={logo || undefined}
                className="h-14 w-28 !aspect-auto"
                hint="/public/images/logos/"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
