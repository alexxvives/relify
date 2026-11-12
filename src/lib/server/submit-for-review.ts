import { emailSiteUrl } from "@/lib/env";
import { publishRequestEmail } from "@/lib/publish-request-email";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/server/mailer";
import { loadPublishChecks } from "@/lib/server/publish-checks";

/** Tells info@ a company is waiting for approval. Never throws: mail must not block the seller. */
export async function notifyPublishRequest(projectId: string, paid: boolean): Promise<void> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { slug: true, legalName: true, codename: true, owner: { select: { name: true, email: true } } },
    });

    if (!project) {
      return;
    }

    const adminUrl = new URL(`/admin/empresas/${project.slug}`, emailSiteUrl()).toString();
    const { to, ...mail } = publishRequestEmail({
      companyName: project.legalName || project.codename,
      ownerName: project.owner?.name ?? "",
      ownerEmail: project.owner?.email ?? "",
      adminUrl,
      paid,
    });
    await sendMail({ to, tag: "publish-request", ...mail });
  } catch (error) {
    console.error("notifyPublishRequest failed", error);
  }
}

/**
 * t75: submission is implicit. When the seller's own checklist is complete and the listing is
 * free (first company) or already paid, the draft moves to Pendiente and the team is told once.
 * A listing that still needs payment stays a draft: the seller sees "Publicar · pagar".
 * Approval (approveProject) still enforces the financial checks and EBITDA > 0.
 */
export async function submitForReviewIfReady(userId: string, projectId: string): Promise<"submitted" | "payment" | "none"> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId, status: "draft" },
    select: { id: true, listingPayment: { select: { id: true } } },
  });

  if (!project) {
    return "none";
  }

  const checks = await loadPublishChecks(project.id);

  if (!checks?.seller.ready) {
    return "none";
  }

  const paid = project.listingPayment !== null;
  const liveCompanyCount = await prisma.project.count({
    where: { ownerId: userId, status: { in: ["published", "pending"] } },
  });

  if (liveCompanyCount > 0 && !paid) {
    return "payment";
  }

  // Conditional update: only the request that flips draft → pending sends the email.
  const moved = await prisma.project.updateMany({ where: { id: project.id, status: "draft" }, data: { status: "pending" } });

  if (moved.count === 0) {
    return "none";
  }

  await notifyPublishRequest(project.id, paid);
  return "submitted";
}
