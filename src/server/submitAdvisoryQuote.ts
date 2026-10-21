import { randomUUID } from "node:crypto";
import { advisoryCopy, advisoryServices, type AdvisoryQuoteInput } from "@/lib/advisory";
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

  const slug = input.projectSlug ?? "";
  const project = slug === "" ? null : await engagementProject({ slug, user });

  if (project && !project.ok) {
    return project;
  }

  if (input.advisorId && !project) {
    return { ok: false, message: engagementCopy.companyRequired };
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

  if (input.advisorId && project) {
    if (project.client === "investor") {
      const access = await prisma.projectAccess.findFirst({
        where: { projectId: project.projectId, investorId: user.id, ndaAcceptedAt: { not: null } },
        select: { id: true },
      });

      if (!access) {
        return { ok: false, message: engagementCopy.connectNeedsCompany };
      }
    } else {
      const ready = await prisma.projectAccess.count({
        where: { projectId: project.projectId, ndaAcceptedAt: { not: null } },
      });

      if (ready === 0) {
        return { ok: false, message: engagementCopy.connectNeedsQa };
      }
    }

    await createEngagement({
      projectId: project.projectId,
      requesterId: user.id,
      client: project.client,
      services: [...input.services],
      advisorId: input.advisorId,
      codename: project.codename,
    });
  } else if (!input.advisorId) {
    const names = input.services
      .map((id) => advisoryServices.find((service) => service.id === id)?.title ?? id)
      .join(", ");
    const place = project ? project.codename : "Sin empresa";
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: { id: true },
    });

    for (const admin of admins) {
      await recordNotification({
        userId: admin.id,
        title: advisoryCopy.adminNoticeTitle,
        body: `${place}: ${names}. ${user.email}. ${advisoryCopy.adminNoticeBody}`,
        href: "/admin",
      });
    }
  }

  await recordNotification({
    userId: user.id,
    title: advisoryCopy.noticeTitle,
    body: advisoryCopy.noticeBody,
    href: user.role === "seller" ? "/mi-empresa/servicios" : "/asesoramiento",
  });

  return { ok: true };
}
