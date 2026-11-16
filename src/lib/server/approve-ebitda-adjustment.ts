import { randomUUID } from "node:crypto";
import { adjustedEbitdaCents, approvedAdjustments, storedEbitdaAdjustments } from "@/lib/ebitda-adjustments";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";

export async function approveEbitdaAdjustment(user: CurrentUser, slug: string, rowId: string): Promise<boolean> {
  if (!user.onboarded || user.role !== "admin" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || rowId.trim() === "") {
    return false;
  }
  const project = await prisma.project.findFirst({
    where: { slug },
    select: { id: true, ebitdaCents: true, ebitdaAdjustments: true },
  });
  if (!project) {
    return false;
  }
  const rows = storedEbitdaAdjustments(project.ebitdaAdjustments);
  if (!rows || !rows.some((row) => row.id === rowId && row.status === "pending")) {
    return false;
  }
  const next = rows.map((row) => ({
    ...row,
    id: row.id.startsWith("legacy-") ? randomUUID() : row.id,
    status: row.id === rowId ? ("approved" as const) : row.status,
  }));
  await prisma.project.update({
    where: { id: project.id },
    data: {
      ebitdaAdjustments: next,
      adjustedEbitdaCents: adjustedEbitdaCents(Number(project.ebitdaCents), approvedAdjustments(next)),
    },
  });
  return true;
}
