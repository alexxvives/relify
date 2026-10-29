import { waitlistCopy } from "@/lib/waitlist";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

export type AdminWaitlistRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  city: string;
  createdAt: string;
};

const roleLabels: Record<string, string> = Object.fromEntries(waitlistCopy.roles.map((role) => [role.id, role.label]));

export async function listWaitlist(user: CurrentUser): Promise<AdminWaitlistRow[]> {
  if (!user.onboarded || user.role !== "admin") {
    return [];
  }

  const entries = await prisma.waitlistEntry.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, city: true, createdAt: true },
  });

  return entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    email: entry.email,
    role: entry.role,
    roleLabel: roleLabels[entry.role] ?? entry.role,
    city: entry.city,
    createdAt: entry.createdAt.toISOString(),
  }));
}
