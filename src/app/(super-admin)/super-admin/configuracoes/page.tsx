import { prisma } from "@/lib/prisma";
import { SuperAdminConfigClient } from "@/components/dashboard/clinics/SuperAdminConfigClient";

export const metadata = { title: "Configurações SaaS" };

export default async function SuperAdminConfigPage() {
  const settings = await prisma.setting.findMany({
    where: { clinicId: null },
    orderBy: { key: "asc" },
    select: { key: true, value: true },
  });
  return <SuperAdminConfigClient settings={settings} />;
}
