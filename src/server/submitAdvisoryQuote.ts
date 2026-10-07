import { randomUUID } from "node:crypto";
import { advisoryCopy, type AdvisoryQuoteInput } from "@/lib/advisory";
import { engagementCopy } from "@/lib/engagement-copy";
import { advisorIsPublic, createEngagement, engagementProject } from "@/server/advisoryEngagement";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { recordNotification } from "@/server/recordNotification";

export type AdvisoryQuoteResult = { ok: true } | { ok: false; message: string };

export async function submitAdvisoryQuote(user: CurrentUser, input: AdvisoryQuoteInput): Promise<AdvisoryQuoteResult> {
  if (!user.onboarded || (user.role !== "investor" && user.role !== "seller")) {
    return { ok: false, message: advisoryCopy.forbidden };
  }

  const project = await engagementProject({ slug: input.projectSlug, user });

  if (!project.ok) {
    return project;
  }

  if (input.advisorId) {
    const listed = await advisorIsPublic(input.advisorId);

    if (!listed) {
      return { ok: false, message: engagementCopy.advisorMissing };
    }
  }

  await prisma.advisoryQuote.create({
    data: {
      id: randomUUID(),
      investorId: user.id,
      services: [...input.services],
    },
  });
  await createEngagement({
    projectId: project.projectId,
    requesterId: user.id,
    client: project.client,
    services: [...input.services],
    advisorId: input.advisorId ?? null,
    codename: project.codename,
  });
  await recordNotification({
    userId: user.id,
    title: advisoryCopy.noticeTitle,
    body: advisoryCopy.noticeBody,
    href: user.role === "seller" ? "/mi-empresa/servicios" : "/asesoramiento",
  });

  return { ok: true };
}
