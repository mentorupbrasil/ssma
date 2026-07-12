import { redirect } from "next/navigation";

export default async function MensagemContatoRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/orcamentos?tab=oportunidades`);
}
