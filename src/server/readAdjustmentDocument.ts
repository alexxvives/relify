import { storedEbitdaAdjustments } from "@/lib/ebitda-adjustments";
import { readAdjustmentDocument as readBytes } from "@/server/adjustmentDocumentDisk";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { activeSellerProjectId } from "@/server/sellerCompany";

export async function readSellerAdjustmentDocument(
  user: CurrentUser,
  fileId: string,
): Promise<{ bytes: Buffer; fileName: string } | null> {
  if (!user.onboarded || user.role !== "seller") {
    return null;
  }
  const activeId = await activeSellerProjectId(user.id);
  if (!activeId) {
    return null;
  }
  const project = await prisma.project.findFirst({
    where: { id: activeId, ownerId: user.id },
    select: { id: true },
  });
  if (!project) {
    return null;
  }
  return readBytes(project.id, fileId);
}

export async function readAdminAdjustmentDocument(
  user: CurrentUser,
  slug: string,
  fileId: string,
): Promise<{ bytes: Buffer; fileName: string } | null> {
  if (!user.onboarded || user.role !== "admin") {
    return null;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return null;
  }
  const project = await prisma.project.findFirst({
    where: { slug },
    select: { id: true, ebitdaAdjustments: true },
  });
  if (!project) {
    return null;
  }
  const listed = storedEbitdaAdjustments(project.ebitdaAdjustments) ?? [];
  if (!listed.some((row) => row.documentId === fileId)) {
    return null;
  }
  return readBytes(project.id, fileId);
}
