import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { resolveClinicId } from "@/lib/scoped-db";
import { getClinicInfo } from "@/lib/helpers";
import { getClinicSiteConfig } from "@/config/clinic";
import { ConfiguracoesClient } from "@/components/dashboard/settings/ConfiguracoesClient";

export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const session = await auth();
  const clinicId = session?.user ? await resolveClinicId({ user: session.user as never }) : null;
  const [settings, clinic, site] = await Promise.all([
    prisma.setting.findMany({
      where: { clinicId },
      orderBy: { key: "asc" },
      select: { key: true, value: true },
    }),
    Promise.resolve(getClinicInfo()),
    Promise.resolve(getClinicSiteConfig()),
  ]);

  const defaults: Record<string, string> = {
    "clinic.display_name": clinic.name ?? "",
    "clinic.legal_name": "",
    "clinic.cnpj": "",
    "clinic.email": clinic.email ?? "",
    "clinic.phone": clinic.phone ?? "",
    "clinic.whatsapp": clinic.whatsapp ?? "",
    "clinic.zip": site.postalCode ?? "",
    "clinic.city_state": [clinic.city, clinic.state].filter(Boolean).join("/"),
    "clinic.address": site.address ?? clinic.address ?? "",
    "clinic.hours": clinic.hours ?? "",
    "clinic.logo_url": "",
  };

  return <ConfiguracoesClient defaults={defaults} settings={settings} />;
}
