import Link from "next/link";
import { CheckCircle2, MessageCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSection } from "@/components/public/PageSection";
import { PRE_REFERRAL_CLINICAL_EXAM_LABELS } from "@/types";
import { buildPreReferralWhatsAppMessage } from "@/data/pre-referral";
import { whatsappLink } from "@/lib/helpers";

export const metadata = { title: "Pré-encaminhamento Enviado" };

export default async function SucessoPage({
  searchParams,
}: {
  searchParams: Promise<{
    protocolo?: string;
    empresa?: string;
    colaborador?: string;
    exame?: string;
  }>;
}) {
  const { protocolo, empresa, colaborador, exame } = await searchParams;

  const examLabel =
    exame && exame in PRE_REFERRAL_CLINICAL_EXAM_LABELS
      ? PRE_REFERRAL_CLINICAL_EXAM_LABELS[exame as keyof typeof PRE_REFERRAL_CLINICAL_EXAM_LABELS]
      : exame;

  const whatsappMessage =
    protocolo && empresa && colaborador && examLabel
      ? buildPreReferralWhatsAppMessage({
          protocol: protocolo,
          companyName: empresa,
          employeeName: colaborador,
          clinicalExamType: examLabel,
        })
      : "Olá! Enviei um pré-encaminhamento pelo site e gostaria de confirmar os próximos passos.";

  return (
    <PageSection className="!py-16 md:!py-20">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200/80 bg-emerald-50 shadow-sm">
          <CheckCircle2 className="h-7 w-7 text-[var(--brand-green)]" strokeWidth={1.75} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--brand-navy)] sm:text-3xl">
          Pré-encaminhamento enviado com sucesso.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]">
          Recebemos sua solicitação. Nossa equipe irá confirmar os dados, exames necessários e
          próximos passos pelo WhatsApp informado.
        </p>

        {(protocolo || empresa || colaborador || examLabel) && (
          <div className="pre-referral-success-summary mx-auto mt-6 text-left">
            {protocolo && (
              <p>
                <span>Protocolo:</span> <strong>{protocolo}</strong>
              </p>
            )}
            {empresa && (
              <p>
                <span>Empresa:</span> {empresa}
              </p>
            )}
            {colaborador && (
              <p>
                <span>Colaborador:</span> {colaborador}
              </p>
            )}
            {examLabel && (
              <p>
                <span>Tipo de exame:</span> {examLabel}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <a href={whatsappLink(whatsappMessage)} target="_blank" rel="noopener noreferrer">
            <Button variant="brand" className="w-full rounded-xl">
              <MessageCircle className="mr-2 h-4 w-4" />
              Enviar mensagem no WhatsApp
            </Button>
          </a>
          <Link href="/encaminhamento-online">
            <Button variant="outline" className="w-full rounded-xl">
              <RotateCcw className="mr-2 h-4 w-4" />
              Fazer novo encaminhamento
            </Button>
          </Link>
        </div>
      </div>
    </PageSection>
  );
}
