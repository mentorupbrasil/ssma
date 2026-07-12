import "server-only";

import { prisma } from "@/lib/prisma";
import { getBillingNotice } from "@/lib/syncpay/labels";

export async function getClinicBillingNotice(clinicId: string) {
  const sub = await prisma.clinicSubscription.findUnique({
    where: { clinicId_provider: { clinicId, provider: "syncpay" } },
  });
  if (!sub) return null;

  const current = await prisma.subscriptionCharge.findFirst({
    where: { subscriptionId: sub.id },
    orderBy: { cycleNumber: "desc" },
  });

  return getBillingNotice({
    nextDueAt: current?.dueDate ?? sub.nextDueAt,
    currentChargePaid: current?.status === "paid",
    subscriptionStatus: sub.status,
  });
}
