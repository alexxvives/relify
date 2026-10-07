import * as z from "zod";
import { adminCopy } from "@/lib/admin-copy";
import { messageKindLabel, personName } from "@/lib/project-message";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

const accessIdSchema = z.string().trim().min(1).max(128);

export type AdminThreadMessage = {
  id: string;
  kindLabel: string;
  body: string;
  authorLabel: string;
  createdAt: string;
};

export type AdminThread = {
  codename: string;
  messages: AdminThreadMessage[];
};

const when = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Madrid",
});

export async function getAdminThread(user: CurrentUser, accessId: string): Promise<AdminThread | null> {
  if (!user.onboarded || user.role !== "admin") {
    return null;
  }

  const parsed = accessIdSchema.safeParse(accessId);

  if (!parsed.success) {
    return null;
  }

  const access = await prisma.projectAccess.findUnique({
    where: { id: parsed.data },
    select: {
      investorId: true,
      project: { select: { id: true, codename: true, ownerId: true } },
    },
  });

  if (!access) {
    return null;
  }

  const [messages, investor, owner] = await Promise.all([
    prisma.projectMessage.findMany({
      where: { projectId: access.project.id, investorId: access.investorId },
      select: { id: true, author: true, kind: true, body: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: access.investorId },
      select: { name: true, lastName: true },
    }),
    access.project.ownerId
      ? prisma.user.findUnique({
          where: { id: access.project.ownerId },
          select: { name: true, lastName: true },
        })
      : Promise.resolve(null),
  ]);

  const investorName = investor ? personName(investor.name, investor.lastName) : "";
  const sellerName = owner ? personName(owner.name, owner.lastName) : "";

  return {
    codename: access.project.codename,
    messages: messages.map((message) => ({
      id: message.id,
      kindLabel: messageKindLabel(message.kind),
      body: message.body,
      authorLabel: authorLabel(message.author, sellerName, investorName),
      createdAt: when.format(message.createdAt),
    })),
  };
}

function authorLabel(author: "seller" | "investor", sellerName: string, investorName: string): string {
  if (author === "seller") {
    return sellerName.length > 0 ? `${sellerName} · ${adminCopy.sellerParty}` : adminCopy.sellerParty;
  }

  return investorName.length > 0 ? `${investorName} · ${adminCopy.investorParty}` : adminCopy.investorParty;
}
