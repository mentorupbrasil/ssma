import { prisma } from "@/lib/prisma";
import { ClinicasClient } from "@/components/dashboard/clinics/ClinicasClient";

export const metadata = { title: "Clínicas" };

export default async function ClinicasPage() {
  const clinics = await prisma.clinic.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { companies: true, users: true } } },
  });
  return <ClinicasClient clinics={clinics} />;
}
