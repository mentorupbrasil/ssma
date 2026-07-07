import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSection } from "@/components/public/PageSection";

export const metadata = { title: "Encaminhamento Enviado" };

export default async function SucessoPage({
  searchParams,
}: {
  searchParams: Promise<{ protocolo?: string }>;
}) {
  const { protocolo } = await searchParams;

  return (
    <PageSection className="!py-16 md:!py-20">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200/80 bg-emerald-50 shadow-sm">
          <CheckCircle2 className="h-7 w-7 text-[var(--brand-green)]" strokeWidth={1.75} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--brand-navy)] sm:text-3xl">
          Encaminhamento enviado
        </h1>
        {protocolo && (
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Protocolo:{" "}
            <strong className="font-semibold text-[var(--brand-navy)]">{protocolo}</strong>
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]">
          Seu encaminhamento foi registrado com sucesso. Nossa equipe entrará em contato para
          agendar os exames.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button variant="outline" className="w-full rounded-xl sm:w-auto">
              Voltar ao início
            </Button>
          </Link>
          <Link href="/encaminhamento-online">
            <Button variant="brand" className="w-full rounded-xl sm:w-auto">
              Novo encaminhamento
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </PageSection>
  );
}
