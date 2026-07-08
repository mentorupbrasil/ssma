import { redirect } from "next/navigation";

export default async function PreEncaminhamentoDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/pre-encaminhamentos?id=${id}`);
}
