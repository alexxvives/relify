import { authCopy } from "@/lib/auth-copy";
import { storedPhone, type AccountProfileInput } from "@/lib/auth-input";
import { normalizeCif } from "@/lib/spanish-cif";
import { prisma } from "@/lib/db";

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
        // S27: partial profiles: an empty DNI/NIE or phone clears the field instead of failing.
        nationalId: input.nationalId.trim() ? normalizeCif(input.nationalId) : null,
        phone: input.phone.trim() ? storedPhone(input.phoneCountry, input.phone) : null,
      },
    });
  } catch {
    return { ok: false, message: authCopy.onboardingFailed };
  }

  return { ok: true };
}
