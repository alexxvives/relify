import { cache } from "react";
import { headers } from "next/headers";
import { authoritativeSessionQuery } from "@/lib/auth-session";
import {
  accountDisplayName,
  readUserRole,
  type UserRoleName,
} from "@/lib/auth-input";
import { auth } from "@/lib/server/auth";
import { prisma } from "@/lib/db";

export type CurrentUser = {
  id: string;
  name: string;
  lastName: string | null;
  phone: string | null;
  displayName: string;
  email: string;
  role: UserRoleName | null;
  onboarded: boolean;
  termsAccepted: boolean;
  termsAcceptedAt: Date | null;
  /** Signed documents show the DNI/NIE; older accounts may still need to add it. */
  nationalIdMissing: boolean;
};

export async function getAuthoritativeAuthSession(
  headerList: Awaited<ReturnType<typeof headers>>,
) {
  return auth.api.getSession({
    headers: headerList,
    query: authoritativeSessionQuery,
  });
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  let session: Awaited<ReturnType<typeof auth.api.getSession>>;

  try {
    session = await getAuthoritativeAuthSession(await headers());
  } catch {
    return null;
  }

  if (!session) {
    return null;
  }

  const stored = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      lastName: true,
      phone: true,
      email: true,
      role: true,
      onboardedAt: true,
      termsAcceptedAt: true,
      suspendedAt: true,
      nationalId: true,
    },
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
    termsAccepted: stored.termsAcceptedAt !== null,
    termsAcceptedAt: stored.termsAcceptedAt,
    nationalIdMissing: !stored.nationalId,
  };
});
