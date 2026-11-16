import * as z from "zod";
import { adminCopy } from "@/lib/admin-copy";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";
import type { AdminMutation } from "@/lib/server/unpublish-project";

const idSchema = z.string().uuid();

export async function deleteWaitlistEntry(user: CurrentUser, id: string): Promise<AdminMutation> {
  if (!user.onboarded || user.role !== "admin") {
    return { ok: false, message: adminCopy.forbidden };
  }

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return { ok: false, message: adminCopy.invalid };
  }

  const existing = await prisma.waitlistEntry.findUnique({
    where: { id: parsed.data },
    select: { id: true },
  });
  if (!existing) {
    return { ok: false, message: "Esa persona ya no está en la lista." };
  }

  await prisma.waitlistEntry.delete({ where: { id: existing.id } });
  return { ok: true, message: "Quitado de la lista de espera." };
}
