import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db";

// One unread notice per (user, title, body, link). A repeat of an unread notice
// moves it back to the top instead of stacking a duplicate in "Avisos".
export async function recordNotification(input: {
  userId: string;
  title: string;
  body: string;
  href: string | null;
}): Promise<void> {
  const existing = await prisma.notification.findFirst({
    where: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      href: input.href,
      readAt: null,
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.notification.update({
      where: { id: existing.id },
      data: { createdAt: new Date() },
    });
    return;
  }

  await prisma.notification.create({
    data: {
      id: randomUUID(),
      userId: input.userId,
      title: input.title,
      body: input.body,
      href: input.href,
    },
  });
}
