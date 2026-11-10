import * as z from "zod";
import { adminCopy } from "@/lib/admin-copy";
import { valuationCopy, valuationRequestStatuses } from "@/lib/valuation-request";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import type { AdminMutation } from "@/server/unpublishProject";

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(valuationRequestStatuses),
  notes: z.string().max(4000),
});

export async function updateValuationRequest(
  user: CurrentUser,
  input: { id: string; status: string; notes: string },
): Promise<AdminMutation> {
  if (!user.onboarded || user.role !== "admin") {
    return { ok: false, message: adminCopy.forbidden };
  }

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: adminCopy.invalid };
  }

  const existing = await prisma.valuationRequest.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (!existing) {
    return { ok: false, message: "Esa solicitud ya no está." };
  }

  await prisma.valuationRequest.update({
    where: { id: existing.id },
    data: {
      status: parsed.data.status,
      notes: parsed.data.notes.trim(),
    },
  });
  return { ok: true, message: valuationCopy.adminSaved };
}
