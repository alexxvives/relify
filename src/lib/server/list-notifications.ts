import { cache } from "react";
import type { NotificationView } from "@/lib/notifications";
import { prisma } from "@/lib/db";

function noticeDate(value: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(value);
}

// Cached per request: the shell and the page both ask for the same list.
export const listNotifications = cache(
  async (userId: string): Promise<NotificationView[]> => {
    const rows = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        body: true,
        href: true,
        readAt: true,
        createdAt: true,
      },
    });

    return rows
      .filter((row) => row.title !== "Pregunta enviada")
      .map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        href: row.href,
        when: noticeDate(row.createdAt),
        unread: row.readAt === null,
      }));
  },
);
