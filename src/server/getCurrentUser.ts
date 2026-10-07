import { cache } from "react";
import { headers } from "next/headers";
import { accountDisplayName, readUserRole, type UserRoleName } from "@/lib/auth-input";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";

export type CurrentUser = {
  id: string;
  name: string;
  lastName: string | null;
  phone: string | null;
  displayName: string;
  email: string;
  role: UserRoleName | null;
  onboarded: boolean;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  let session: Awaited<ReturnType<typeof auth.api.getSession>>;

  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    return null;
  }

  if (!session) {
    return null;
  }

  const stored = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, lastName: true, phone: true, email: true, role: true, onboardedAt: true, suspendedAt: true },
  });

  if (!stored || stored.suspendedAt !== null) {
    return null;
  }

  return {
    id: session.user.id,
    name: stored.name,
    lastName: stored.lastName,
    phone: stored.phone,
    displayName: accountDisplayName(stored.name, stored.lastName),
    email: stored.email,
    role: readUserRole(stored.role),
    onboarded: stored.onboardedAt !== null,
  };
});
