import { redirect } from "next/navigation";

export default async function ContatoDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/orcamentos/mensagens/${id}`);
}
