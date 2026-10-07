import { authCopy } from "@/lib/auth-copy";
import { storedPhone, type AccountProfileInput } from "@/lib/auth-input";
import { normalizeCif } from "@/lib/spanish-cif";
import { prisma } from "@/server/db";

export async function updateAccountProfile(
  userId: string,
  input: AccountProfileInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        lastName: input.lastName,
        nationalId: normalizeCif(input.nationalId),
        phone: storedPhone(input.phoneCountry, input.phone),
      },
    });
  } catch {
    return { ok: false, message: authCopy.onboardingFailed };
  }

  return { ok: true };
}
