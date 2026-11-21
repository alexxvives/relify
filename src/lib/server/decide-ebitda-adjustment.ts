import { randomUUID } from "node:crypto";
import { adjustedEbitdaCents, adjustmentReviewNoteMax, approvedAdjustments, storedEbitdaAdjustments } from "@/lib/ebitda-adjustments";
import type { AdjustmentDecisionView } from "@/lib/ebitda-adjustments";
import { companyCopy } from "@/lib/company-copy";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { recordNotification } from "@/lib/server/record-notification";
import { prisma } from "@/lib/db";

export type AdjustmentDecision = "approved" | "rejected";

/** Where the seller sees the decided row (the adjusted EBITDA tile of the Ficha). */
export const decidedAdjustmentHref = "/mi-empresa/detalles#ebitda-ajustado";

/** The seller's aviso for each decision. The admin's note goes in the body of a rejection when there is one. */
export function adjustmentDecisionNotice(status: AdjustmentDecision, note: string | null): { title: string; body: string } {
  if (status === "approved") {
    return { title: companyCopy.adjustmentApprovedNoticeTitle, body: companyCopy.adjustmentApprovedNoticeBody };
  }
  return {
    title: companyCopy.adjustmentRejectedNoticeTitle,
    body: note ? `${companyCopy.adjustmentRejectedNoticeBody} Motivo: ${note}` : companyCopy.adjustmentRejectedNoticeBody,
  };
}

/** S38: pending → approved | rejected, and a decided row can be flipped either way. Same status twice is a no-op. */
export function canDecide(current: string, next: AdjustmentDecision): boolean {
  return current !== next && (current === "pending" || current === "approved" || current === "rejected");
}

/**
 * S32 + S38: an admin approves or rejects an EBITDA adjustment, and may later reverse it. Every decision is kept in
 * ebitda_adjustment_decision (who, when, why), the adjusted EBITDA is recomputed and the seller gets an aviso.
 */
export async function decideEbitdaAdjustment(
  user: CurrentUser,
  slug: string,
  rowId: string,
  status: AdjustmentDecision,
  rawNote = "",
): Promise<boolean> {
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
  const target = rows?.find((row) => row.id === rowId);
  if (!rows || !target || !canDecide(target.status, status)) {
    return false;
  }
  const note = status === "rejected" ? rawNote.trim().slice(0, adjustmentReviewNoteMax) || null : null;
  let decidedId = rowId;
  const next = rows.map((row) => {
    const id = row.id.startsWith("legacy-") ? randomUUID() : row.id;
    if (row.id !== rowId) {
      return { ...row, id };
    }
    decidedId = id;
    const { reviewNote: _previous, ...rest } = row;
    return { ...rest, id, status, ...(note ? { reviewNote: note } : {}) };
  });
  await prisma.$transaction([
    prisma.project.update({
      where: { id: project.id },
      data: {
        ebitdaAdjustments: next,
        adjustedEbitdaCents: adjustedEbitdaCents(Number(project.ebitdaCents), approvedAdjustments(next)),
      },
    }),
    prisma.ebitdaAdjustmentDecision.create({
      data: {
        id: randomUUID(),
        projectId: project.id,
        rowId: decidedId,
        status,
        note,
        adminId: user.id,
        adminLabel: [user.name, user.lastName].filter(Boolean).join(" ") || user.email,
      },
    }),
  ]);
  if (project.ownerId) {
    await recordNotification({ userId: project.ownerId, ...adjustmentDecisionNotice(status, note), href: decidedAdjustmentHref });
  }
  return true;
}

const when = new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Madrid" });

/** Admin view: each row's decision history, oldest first. */
export async function adjustmentHistory(projectId: string): Promise<Map<string, AdjustmentDecisionView[]>> {
  const decisions = await prisma.ebitdaAdjustmentDecision.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { id: true, rowId: true, status: true, note: true, adminLabel: true, createdAt: true },
  });
  const byRow = new Map<string, AdjustmentDecisionView[]>();
  for (const row of decisions) {
    const list = byRow.get(row.rowId) ?? [];
    list.push({
      id: row.id,
      status: row.status === "approved" ? "approved" : "rejected",
      note: row.note,
      by: row.adminLabel,
      at: when.format(row.createdAt),
    });
    byRow.set(row.rowId, list);
  }
  return byRow;
}
