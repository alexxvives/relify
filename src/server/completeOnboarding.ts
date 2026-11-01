import { headers } from "next/headers";
import { authCopy } from "@/lib/auth-copy";
import {
  readUserRole,
  storedPhone,
  type OnboardingInput,
  type UserRoleName,
} from "@/lib/auth-input";
import { normalizeCif } from "@/lib/spanish-cif";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { readSiteUrl } from "@/lib/env";
import { welcomeEmail } from "@/lib/email/messages";
import { sendMail } from "@/server/mailer";

export type CompleteOnboardingResult =
  | { ok: true; role: UserRoleName | null }
  | { ok: false; code: "signed_out" | "save_failed"; message: string };

export async function completeOnboarding(
  input: OnboardingInput,
): Promise<CompleteOnboardingResult> {
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
        phone: storedPhone(input.phoneCountry, input.phone),
        role: input.role,
        referralSource: input.referralSource,
        onboardedAt: new Date(),
      },
    });
  } catch {
    return {
      ok: false,
      code: "save_failed",
      message: authCopy.onboardingFailed,
    };
  }

  // t73b: welcome email, once (the onboardedAt guard above stops repeats). Never blocks onboarding.
  if (
    input.role === "seller" ||
    input.role === "investor" ||
    input.role === "advisor"
  ) {
    await sendMail({
      to: session.user.email,
      tag: `welcome-${input.role}`,
      ...welcomeEmail(input.role, input.name.trim(), readSiteUrl()),
    });
  }

  return { ok: true, role: input.role };
}
