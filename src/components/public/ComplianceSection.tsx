import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { COMPLIANCE_DOCS } from "@/data/marketing";
import { SectionTitle } from "@/components/public/SectionTitle";
import { Button } from "@/components/ui/button";

export function ComplianceSection() {
  return (
    <section className="section-padding bg-white">
      <div className="container-page">
        <div className="mb-10 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">Evite multas e autuações</p>
              <p className="mt-1 text-sm text-amber-800/90">
                Empresas irregulares estão sujeitas a penalidades em fiscalizações do MTE e
                inconsistências no eSocial.
              </p>
            </div>
          </div>
          <Link href="/contato?tipo=orcamento" className="shrink-0">
            <Button variant="brand" className="w-full rounded-xl sm:w-auto">
              Falar com especialista
            </Button>
          </Link>
        </div>

        <SectionTitle
          eyebrow="Obrigatoriedade legal"
          title="Esses documentos são exigidos para sua empresa"
          description="Mantenha sua operação em dia com programas, laudos e exames conforme a legislação trabalhista."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {COMPLIANCE_DOCS.map((doc) => (
            <div
              key={doc.sigla}
              className="premium-card-hover group border-slate-200/80 p-5"
            >
              <div className="mb-4 inline-flex rounded-xl bg-[var(--brand-green-light)] p-3 transition group-hover:bg-[var(--brand-green)]/15">
                <doc.icon className="h-6 w-6 text-[var(--brand-green)]" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-green)]">
                {doc.sigla}
              </p>
              <h3 className="mt-1 font-semibold text-[var(--brand-navy)]">{doc.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{doc.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/servicos">
            <Button variant="outline" size="lg" className="rounded-xl">
              Ver todos os serviços
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
