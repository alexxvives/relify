import { prisma } from "@/lib/db";

export async function getAccountNationalId(
  userId: string,
): Promise<string | null> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { nationalId: true },
  });

  return row?.nationalId ?? null;
}
