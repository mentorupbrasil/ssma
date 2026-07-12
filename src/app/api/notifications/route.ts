import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markAllNotificationsRead } from "@/lib/notifications";
import { isPathModuleEnabled } from "@/lib/modules";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const visible = items
    .filter((n) => !n.link || isPathModuleEnabled(n.link))
    .slice(0, 20);

  return NextResponse.json({
    items: visible.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await markAllNotificationsRead(session.user.id);
  return NextResponse.json({ ok: true });
}
