import { prisma } from "@/lib/db";

export async function markNotificationsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markNotificationRead(
  userId: string,
  id: string,
): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, id, readAt: null },
    data: { readAt: new Date() },
  });
}
