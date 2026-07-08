import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createAuditLog(params: {
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  userId?: string;
}) {
  let ipAddress: string | undefined;
  try {
    const headersList = await headers();
    ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      undefined;
  } catch {
    ipAddress = undefined;
  }

  let userId = params.userId;
  if (!userId) {
    const session = await auth();
    userId = session?.user?.id;
  }

  await prisma.auditLog.create({
    data: {
      userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      details: params.details,
      ipAddress,
    },
  });
}

export async function generateProtocol(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `UNI-${year}-`;

  const [lastReferral, lastPreReferral] = await Promise.all([
    prisma.referral.findFirst({
      where: { protocol: { startsWith: prefix } },
      orderBy: { protocol: "desc" },
      select: { protocol: true },
    }),
    prisma.publicReferralRequest
      .findFirst({
        where: { protocol: { startsWith: prefix } },
        orderBy: { protocol: "desc" },
        select: { protocol: true },
      })
      .catch(() => null),
  ]);

  const numbers = [lastReferral, lastPreReferral]
    .filter(Boolean)
    .map((item) => parseInt(item!.protocol.replace(prefix, ""), 10))
    .filter((n) => !Number.isNaN(n));

  const lastNumber = numbers.length > 0 ? Math.max(...numbers) : 0;

  return `${prefix}${String(lastNumber + 1).padStart(6, "0")}`;
}
