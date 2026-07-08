import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { resolveClinicId } from "@/lib/scoped-db";
import { getClinicInfo } from "@/lib/helpers";
import { ConfiguracoesClient } from "@/components/dashboard/settings/ConfiguracoesClient";

export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const session = await auth();
  const clinicId = session?.user ? await resolveClinicId({ user: session.user as never }) : null;
  const settings = await prisma.setting.findMany({
    where: { clinicId },
    orderBy: { key: "asc" },
    select: { key: true, value: true },
  });
  return <ConfiguracoesClient clinic={getClinicInfo()} settings={settings} />;
}
