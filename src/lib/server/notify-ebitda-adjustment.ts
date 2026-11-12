import { ebitdaAdjustmentEmail, shouldNotifyEbitdaAdjustment } from "@/lib/ebitda-adjustment-email";
import type { EbitdaAdjustment } from "@/lib/ebitda-adjustments";
import { emailSiteUrl } from "@/lib/env";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/server/mailer";

/** Tells info@ a seller submitted EBITDA adjustments. Never throws: mail must not block the seller. */
export async function notifyEbitdaAdjustment(
  projectId: string,
  previous: EbitdaAdjustment[] | null,
  next: EbitdaAdjustment[],
): Promise<void> {
  if (!shouldNotifyEbitdaAdjustment(previous, next)) {
    return;
  }
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, slug: true, legalName: true, codename: true },
    });
    if (!project) {
      return;
    }
    const pending = next.filter((row) => row.status === "pending");
    const listed = pending.length > 0 ? pending : next;
    const amount = listed.reduce((sum, row) => sum + row.amountCents, 0);
    const { to, ...mail } = ebitdaAdjustmentEmail({
      companyName: project.legalName || project.codename,
      projectId: project.id,
      adjustmentAmountCents: amount,
      rows: next,
      adminUrl: new URL(`/admin/empresas/${project.slug}`, emailSiteUrl()).toString(),
    });
    await sendMail({ to, tag: "ebitda-adjustment", ...mail });
  } catch (error) {
    console.error("notifyEbitdaAdjustment failed", error);
  }
}
