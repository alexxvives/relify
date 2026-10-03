import { randomUUID } from "node:crypto";
import { advisoryCopy, type AdvisoryQuoteInput } from "@/lib/advisory";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { recordNotification } from "@/server/recordNotification";

export type AdvisoryQuoteResult = { ok: true } | { ok: false; message: string };

export async function submitAdvisoryQuote(user: CurrentUser, input: AdvisoryQuoteInput): Promise<AdvisoryQuoteResult> {
  if (!user.onboarded || (user.role !== "investor" && user.role !== "seller")) {
    return { ok: false, message: advisoryCopy.forbidden };
  }

  await prisma.advisoryQuote.create({
    data: {
      id: randomUUID(),
      investorId: user.id,
      services: [...input.services],
    },
  });
  await recordNotification({
    userId: user.id,
    title: advisoryCopy.noticeTitle,
    body: advisoryCopy.noticeBody,
    href: user.role === "seller" ? "/mi-empresa/servicios" : "/asesoramiento",
  });

  return { ok: true };
}
