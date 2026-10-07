import * as z from "zod";
import { adminCopy } from "@/lib/admin-copy";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

const userIdSchema = z.string().trim().min(1).max(128);

export type AdminMutation = { ok: true; message: string } | { ok: false; message: string };

export async function setAccountSuspension(
  user: CurrentUser,
  userId: string,
  suspended: boolean,
): Promise<AdminMutation> {
  if (!user.onboarded || user.role !== "admin") {
    return { ok: false, message: adminCopy.forbidden };
  }

  const parsed = userIdSchema.safeParse(userId);

  if (!parsed.success) {
    return { ok: false, message: adminCopy.invalid };
  }

  if (suspended && parsed.data === user.id) {
    return { ok: false, message: adminCopy.ownSuspend };
  }

  const account = await prisma.user.findUnique({
    where: { id: parsed.data },
    select: { id: true },
  });

  if (!account) {
    return { ok: false, message: adminCopy.missingAccount };
  }

  if (suspended) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: account.id },
        data: { suspendedAt: new Date() },
      }),
      prisma.session.deleteMany({ where: { userId: account.id } }),
    ]);
    return { ok: true, message: adminCopy.suspended };
  }

  await prisma.user.update({
    where: { id: account.id },
    data: { suspendedAt: null },
  });

  return { ok: true, message: adminCopy.reactivated };
}
