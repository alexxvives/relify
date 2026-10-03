import type { NotificationView } from "@/lib/notifications";
import { prisma } from "@/server/db";

export async function listNotifications(userId: string): Promise<NotificationView[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, title: true, body: true, href: true, readAt: true },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    href: row.href,
    unread: row.readAt === null,
  }));
}
