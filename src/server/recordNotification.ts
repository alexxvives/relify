import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db";

export async function recordNotification(input: {
  userId: string;
  title: string;
  body: string;
  href: string | null;
}): Promise<void> {
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
