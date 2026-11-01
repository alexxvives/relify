import { prisma } from "@/server/db";

export type OwnerContact = {
  email: string;
  firstName: string;
  role: string | null;
};

/** Email, first name and role of a project owner, for notices sent to them. */
export async function ownerContact(
  ownerId: string | null,
): Promise<OwnerContact | null> {
  if (!ownerId) return null;
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { email: true, name: true, role: true, suspendedAt: true },
  });
  if (!owner || owner.suspendedAt) return null;
  return {
    email: owner.email,
    firstName: owner.name.trim().split(/\s+/)[0] ?? "",
    role: owner.role,
  };
}

/** Where an owner manages a project: advisors through their mandates, sellers in Mi empresa. */
export function ownerHome(
  role: string | null,
  sellerPath = "/mi-empresa",
): string {
  return role === "advisor" ? "/mandatos/venta" : sellerPath;
}
