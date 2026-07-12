import "server-only";
import { prisma } from "@/lib/prisma";
import { notifyUserByEmail } from "@/lib/email";
import { isPathModuleEnabled } from "@/lib/modules";

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  link?: string;
  sendEmail?: boolean;
}) {
  // Não gera alertas para módulos desativados por feature flag.
  if (params.link && !isPathModuleEnabled(params.link)) {
    return null;
  }

  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      link: params.link ?? null,
    },
  });

  if (params.sendEmail) {
    await notifyUserByEmail(
      params.userId,
      params.title,
      `<p>${params.message}</p>${params.link ? `<p><a href="${params.link}">Abrir no sistema</a></p>` : ""}`
    );
  }

  return notification;
}

export async function markNotificationRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
