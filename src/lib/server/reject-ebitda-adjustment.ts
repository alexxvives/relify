import { randomUUID } from "node:crypto";
import { adjustedEbitdaCents, adjustmentReviewNoteMax, approvedAdjustments, storedEbitdaAdjustments } from "@/lib/ebitda-adjustments";
import { companyCopy } from "@/lib/company-copy";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { recordNotification } from "@/lib/server/record-notification";
import { prisma } from "@/lib/db";

/** Where the seller sees the rejected row (the adjusted EBITDA tile of the Ficha). */
export const rejectedAdjustmentHref = "/mi-empresa/detalles#ebitda-ajustado";

/** The seller's aviso. The admin's note goes in the body when there is one. */
export function rejectedAdjustmentNotice(note: string | null): { title: string; body: string } {
  return {
    title: companyCopy.adjustmentRejectedNoticeTitle,
    body: note ? `${companyCopy.adjustmentRejectedNoticeBody} Motivo: ${note}` : companyCopy.adjustmentRejectedNoticeBody,
  };
}

/**
 * S32: an admin turns down a pending EBITDA adjustment. The row stays in the seller's list as "Rechazado" (with the
 * optional note), never counts in the adjusted EBITDA, and the seller gets an aviso.
 */
export async function rejectEbitdaAdjustment(user: CurrentUser, slug: string, rowId: string, rawNote: string): Promise<boolean> {
  if (!user.onboarded || user.role !== "admin" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || rowId.trim() === "") {
    return false;
  }
  const project = await prisma.project.findFirst({
    where: { slug },
    select: { id: true, ownerId: true, ebitdaCents: true, ebitdaAdjustments: true },
  });
  if (!project) {
    return false;
  }
  const rows = storedEbitdaAdjustments(project.ebitdaAdjustments);
  if (!rows || !rows.some((row) => row.id === rowId && row.status === "pending")) {
    return false;
  }
  const note = rawNote.trim().slice(0, adjustmentReviewNoteMax) || null;
  const next = rows.map((row) => {
    const id = row.id.startsWith("legacy-") ? randomUUID() : row.id;
    if (row.id !== rowId) {
      return { ...row, id };
    }
    const { reviewNote: _previous, ...rest } = row;
    return { ...rest, id, status: "rejected" as const, ...(note ? { reviewNote: note } : {}) };
  });
  await prisma.project.update({
    where: { id: project.id },
    data: {
      ebitdaAdjustments: next,
      adjustedEbitdaCents: adjustedEbitdaCents(Number(project.ebitdaCents), approvedAdjustments(next)),
    },
  });
  if (project.ownerId) {
    await recordNotification({ userId: project.ownerId, ...rejectedAdjustmentNotice(note), href: rejectedAdjustmentHref });
  }
  return true;
}
