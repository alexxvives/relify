import * as z from "zod";
import { adminCopy } from "@/lib/admin-copy";
import { userRoles } from "@/lib/auth-input";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

const inputSchema = z.object({
  userId: z.string().trim().min(1).max(128),
  role: z.enum(userRoles),
});

export type AdminMutation = { ok: true; message: string } | { ok: false; message: string };

export async function changeAccountRole(user: CurrentUser, userId: string, role: string): Promise<AdminMutation> {
  if (!user.onboarded || user.role !== "admin") {
    return { ok: false, message: adminCopy.forbidden };
  }

  const parsed = inputSchema.safeParse({ userId, role });

  if (!parsed.success) {
    return { ok: false, message: adminCopy.invalid };
  }

  if (parsed.data.userId === user.id) {
    return { ok: false, message: adminCopy.ownRole };
  }

  const account = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true },
  });

  if (!account) {
    return { ok: false, message: adminCopy.missingAccount };
  }

  await prisma.user.update({
    where: { id: account.id },
    data: { role: parsed.data.role },
  });

  return { ok: true, message: adminCopy.roleChanged };
}
