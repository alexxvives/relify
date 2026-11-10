import { companyCopy } from "@/lib/company-copy";
import { adjustmentsToFormJson, storedEbitdaAdjustments } from "@/lib/ebitda-adjustments";
import { sellerAdjustmentWrite, storedAdjustmentList } from "@/lib/seller-draft-guard";
import { deleteUnusedAdjustmentDocuments, missingAdjustmentDocument } from "@/server/adjustmentDocumentDisk";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { activeSellerProjectId } from "@/server/sellerCompany";
import { Prisma } from "@/generated/prisma/client";
import { notifyEbitdaAdjustment } from "@/server/notifyEbitdaAdjustment";

export type SaveEbitdaAdjustmentsResult = { ok: true; json: string } | { ok: false; message: string };

/**
 * t89: saves only the EBITDA adjustments of the seller's active company, from the adjustments modal. Same rules as
 * the full draft save (sellerAdjustmentWrite): the adjusted figure is recomputed here from the stored accounts EBITDA.
 */
export async function saveEbitdaAdjustments(user: CurrentUser, raw: string): Promise<SaveEbitdaAdjustmentsResult> {
  if (!user.onboarded || user.role !== "seller") {
    return { ok: false, message: companyCopy.notSeller };
  }
  const activeId = await activeSellerProjectId(user.id);
  const project = activeId
    ? await prisma.project.findFirst({
        where: { id: activeId, ownerId: user.id },
        select: { id: true, ebitdaCents: true, ebitdaAdjustments: true },
      })
    : null;
  if (!project) {
    return { ok: false, message: "Guarda primero los datos de tu empresa." };
  }
  const previous = storedAdjustmentList(project.ebitdaAdjustments);
  const write = sellerAdjustmentWrite(raw, { ebitdaCents: Number(project.ebitdaCents), rows: previous });
  if (!write.ok) {
    return { ok: false, message: write.code === "adjustment-count" ? companyCopy.adjustmentsCount : companyCopy.adjustmentsInvalid };
  }
  const missing = write.write.kind === "set" ? await missingAdjustmentDocument(project.id, write.write.rows) : false;
  if (missing) {
    return { ok: false, message: companyCopy.adjustmentDocumentMissing };
  }
  if (write.write.kind === "set") {
    await prisma.project.update({
      where: { id: project.id },
      data: { ebitdaAdjustments: write.write.rows, adjustedEbitdaCents: write.write.adjustedEbitdaCents },
    });
    await deleteUnusedAdjustmentDocuments(project.id, previous ?? [], write.write.rows);
    await notifyEbitdaAdjustment(project.id, previous, write.write.rows);
    return { ok: true, json: adjustmentsToFormJson(write.write.rows) };
  }
  if (write.write.kind === "clear") {
    await prisma.project.update({ where: { id: project.id }, data: { ebitdaAdjustments: Prisma.DbNull, adjustedEbitdaCents: 0 } });
    await deleteUnusedAdjustmentDocuments(project.id, previous ?? [], []);
    return { ok: true, json: "" };
  }
  return { ok: true, json: adjustmentsToFormJson(storedEbitdaAdjustments(project.ebitdaAdjustments)) };
}
