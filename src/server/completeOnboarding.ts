import { headers } from "next/headers";
import { authCopy } from "@/lib/auth-copy";
import { readUserRole, storedPhone, type OnboardingInput, type UserRoleName } from "@/lib/auth-input";
import { normalizeCif } from "@/lib/spanish-cif";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";

export type CompleteOnboardingResult =
  | { ok: true; role: UserRoleName | null }
  | { ok: false; code: "signed_out" | "save_failed"; message: string };

export async function completeOnboarding(input: OnboardingInput): Promise<CompleteOnboardingResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { ok: false, code: "signed_out", message: authCopy.signInFailed };
  }

  const stored = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, onboardedAt: true },
  });

  if (!stored) {
    return { ok: false, code: "signed_out", message: authCopy.signInFailed };
  }

  if (stored.onboardedAt) {
    return { ok: true, role: readUserRole(stored.role) };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: input.name,
        lastName: input.lastName,
        nationalId: normalizeCif(input.nationalId),
        phone: storedPhone(input.phone),
        role: input.role,
        referralSource: input.referralSource,
        onboardedAt: new Date(),
      },
    });
  } catch {
    return { ok: false, code: "save_failed", message: authCopy.onboardingFailed };
  }

  return { ok: true, role: input.role };
}
