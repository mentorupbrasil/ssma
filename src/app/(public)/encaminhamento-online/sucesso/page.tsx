import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Encaminhamento Enviado" };

export default async function SucessoPage({
  searchParams,
}: {
  searchParams: Promise<{ protocolo?: string }>;
}) {
  const { protocolo } = await searchParams;

  return (
    <section className="flex min-h-[60vh] items-center justify-center py-20">
      <div className="mx-auto max-w-lg px-4 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#DFF7F0]">
          <CheckCircle2 className="h-8 w-8 text-[#16A085]" />
        </div>
        <h1 className="text-3xl font-bold text-[#0F3D4A]">Encaminhamento enviado!</h1>
        {protocolo && (
          <p className="mt-4 text-lg">
            Protocolo: <strong className="text-[#16A085]">{protocolo}</strong>
          </p>
        )}
        <p className="mt-4 text-slate-600">
          Seu encaminhamento foi registrado com sucesso. Nossa equipe entrará em contato para agendar os exames.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/"><Button variant="outline">Voltar ao início</Button></Link>
          <Link href="/encaminhamento-online"><Button className="bg-[#16A085] hover:bg-[#138d75]">Novo encaminhamento</Button></Link>
        </div>
      </div>
    </section>
  );
}
