import { redirect } from "next/navigation";

export default async function PacienteIdRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/colaboradores/${id}`);
}
