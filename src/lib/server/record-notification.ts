import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";

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

/**
 * The client's notice once an advisor accepts the encargo (deposit paid, or S43 waived in the free launch).
 * S43: the private advisor chat is the "Asesor" tab of the ficha, so a buyer lands there; a seller's ficha is per
 * buyer process, so the seller lands on Mis procesos.
 */
export async function notifyDepositAccepted(input: {
  requesterId: string;
  client: "investor" | "seller";
  codename: string;
  slug?: string;
}): Promise<void> {
  await recordNotification({
    userId: input.requesterId,
    title: "Solicitud aceptada",
    body: `Un asesor ha aceptado tu solicitud para ${input.codename}.`,
    href: input.client === "seller" || !input.slug ? (input.client === "seller" ? "/mi-empresa/procesos" : "/procesos") : `/proyectos/${input.slug}?tab=advisor`,
  });
}
