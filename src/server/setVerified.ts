import * as z from "zod";
import { adminCopy } from "@/lib/admin-copy";
import { prisma } from "@/server/db";
import type { CurrentUser } from "@/server/getCurrentUser";
import type { AdminMutation } from "@/server/unpublishProject";

const idSchema = z.string().trim().min(1).max(128);

export type VerifiedTarget = "project" | "advisor";

/** Admin-only: marks a company or an advisor as "Verificado" (or clears it). */
export async function setVerified(
  user: CurrentUser,
  target: VerifiedTarget,
  id: string,
  verified: boolean,
): Promise<AdminMutation> {
  if (!user.onboarded || user.role !== "admin") {
    return { ok: false, message: adminCopy.forbidden };
  }

  const parsed = idSchema.safeParse(id);

  if (!parsed.success) {
    return { ok: false, message: adminCopy.invalid };
  }

  const verifiedAt = verified ? new Date() : null;
  const updated =
    target === "project"
      ? await prisma.project.updateMany({
          where: { id: parsed.data },
          data: { verifiedAt },
        })
      : await prisma.advisorProfile.updateMany({
          where: { userId: parsed.data },
          data: { verifiedAt },
        });

  if (updated.count === 0) {
    return {
      ok: false,
      message:
        target === "project" ? adminCopy.missingProject : adminCopy.invalid,
    };
  }

  return {
    ok: true,
    message: verified ? adminCopy.verifiedOn : adminCopy.verifiedOff,
  };
}
