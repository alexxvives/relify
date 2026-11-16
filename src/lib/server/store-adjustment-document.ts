import { randomUUID } from "node:crypto";
import { companyCopy } from "@/lib/company-copy";
import { isIntEnvironment } from "@/lib/int-env";
import { adjustmentDocumentExtension } from "@/lib/ebitda-adjustments";
import { writeAdjustmentDocument } from "@/lib/server/adjustment-document-disk";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";
import { activeSellerProjectId } from "@/lib/server/seller-company";

export type StoreAdjustmentDocumentResult =
  | { ok: true; documentId: string; documentName: string }
  | { ok: false; message: string };

export async function storeAdjustmentDocument(
  user: CurrentUser,
  fileName: string,
  bytes: Uint8Array,
): Promise<StoreAdjustmentDocumentResult> {
  if (isIntEnvironment()) {
    return { ok: false, message: companyCopy.adjustmentDocumentIntDisabled };
  }
  const { assertUploadsEnabled } = await import("./int-guards");
  assertUploadsEnabled();
  
  if (!user.onboarded || user.role !== "seller") {
    return { ok: false, message: companyCopy.notSeller };
  }
  const name = fileName.replace(/[\r\n\u0000]/g, "").trim().slice(0, 180);
  if (!adjustmentDocumentExtension(name)) {
    return { ok: false, message: companyCopy.adjustmentDocumentType };
  }
  const activeId = await activeSellerProjectId(user.id);
  const project = activeId
    ? await prisma.project.findFirst({ where: { id: activeId, ownerId: user.id }, select: { id: true } })
    : null;
  if (!project) {
    return { ok: false, message: "Guarda primero los datos de tu empresa." };
  }
  const documentId = randomUUID();
  const written = await writeAdjustmentDocument(project.id, documentId, name, bytes);
  if (written === "type") {
    return { ok: false, message: companyCopy.adjustmentDocumentType };
  }
  if (written === "size") {
    return { ok: false, message: companyCopy.adjustmentDocumentTooBig };
  }
  if (written !== "ok") {
    return { ok: false, message: companyCopy.adjustmentDocumentSaveFailed };
  }
  return { ok: true, documentId, documentName: name };
}
