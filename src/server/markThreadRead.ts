import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

/** Stamps "chat opened now" for whichever side of this access the user is. Ignores anyone else. */
export async function markThreadRead(
  user: CurrentUser,
  accessId: string,
): Promise<boolean> {
  const access = await prisma.projectAccess.findUnique({
    where: { id: accessId },
    select: { investorId: true, project: { select: { ownerId: true } } },
  });
  if (!access) {
    return false;
  }
  const now = new Date();
  if (access.investorId === user.id) {
    await prisma.projectAccess.update({
      where: { id: accessId },
      data: { investorReadAt: now },
    });
    return true;
  }
  if (access.project.ownerId === user.id) {
    await prisma.projectAccess.update({
      where: { id: accessId },
      data: { sellerReadAt: now },
    });
    return true;
  }
  return false;
}
